'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

const COLS = 26;
const ROWS = 50;

type CellAddress = { row: number; col: number };
type CellData    = Record<string, string>;

// ─── pure helpers ──────────────────────────────────────────────────────────────

function colName(i: number) { return String.fromCharCode(65 + i); }
function cellKey(r: number, c: number) { return `${colName(c)}${r + 1}`; }

function parseCellRef(ref: string): CellAddress | null {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  const col = m[1].charCodeAt(0) - 65, row = parseInt(m[2]) - 1;
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  return { row, col };
}

function parseRange(range: string): string[] {
  const parts = range.split(':');
  if (parts.length !== 2) { const s = parseCellRef(range.trim()); return s ? [cellKey(s.row, s.col)] : []; }
  const s = parseCellRef(parts[0].trim()), e = parseCellRef(parts[1].trim());
  if (!s || !e) return [];
  const out: string[] = [];
  for (let r = Math.min(s.row, e.row); r <= Math.max(s.row, e.row); r++)
    for (let c = Math.min(s.col, e.col); c <= Math.max(s.col, e.col); c++)
      out.push(cellKey(r, c));
  return out;
}

/**
 * Shift all cell references in a formula by (dr, dc).
 * Used for relative-reference paste and fill-handle filling.
 */
function shiftFormula(value: string, dr: number, dc: number): string {
  if (!value.startsWith('=')) return value;
  return '=' + value.slice(1).toUpperCase().replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
    const nc = col.charCodeAt(0) - 65 + dc;
    const nr = parseInt(row) - 1 + dr;
    if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return '#REF!';
    return cellKey(nr, nc);
  });
}

// ─── formula engine ────────────────────────────────────────────────────────────

function getCellNumeric(key: string, cells: CellData, depth: number): number {
  const raw = cells[key];
  if (!raw) return 0;
  if (raw.startsWith('=')) {
    const r = evaluateFormula(raw, cells, depth + 1);
    return typeof r === 'number' ? r : parseFloat(r as string) || 0;
  }
  return parseFloat(raw) || 0;
}

function evaluateFormula(formula: string, cells: CellData, depth = 0): number | string {
  if (depth > 10) return '#REF!';
  const expr = formula.slice(1).trim().toUpperCase();

  // Aggregate functions
  const aggs: [RegExp, (refs: string[]) => number | string][] = [
    [/^SUM\(([^)]+)\)$/,     refs => refs.reduce((a, r) => a + getCellNumeric(r, cells, depth), 0)],
    [/^AVERAGE\(([^)]+)\)$/, refs => refs.length ? refs.reduce((a, r) => a + getCellNumeric(r, cells, depth), 0) / refs.length : 0],
    [/^COUNT\(([^)]+)\)$/,   refs => refs.filter(r => { const v = cells[r]; return v !== undefined && v !== '' && !isNaN(parseFloat(v)); }).length],
    [/^MAX\(([^)]+)\)$/,     refs => { const v = refs.map(r => getCellNumeric(r, cells, depth)); return v.length ? Math.max(...v) : 0; }],
    [/^MIN\(([^)]+)\)$/,     refs => { const v = refs.map(r => getCellNumeric(r, cells, depth)); return v.length ? Math.min(...v) : 0; }],
    [/^ROUND\(([^,]+),(\d+)\)$/, refs => +parseFloat(String(getCellNumeric(refs[0], cells, depth))).toFixed(parseInt(refs[1] ?? '0'))],
    [/^ABS\(([^)]+)\)$/,     refs => Math.abs(getCellNumeric(refs[0], cells, depth))],
  ];
  for (const [re, fn] of aggs) {
    const m = expr.match(re);
    if (m) return fn(parseRange(m[1]));
  }

  // IF(condition, true_val, false_val)
  const ifM = expr.match(/^IF\((.+),\s*(.+),\s*(.+)\)$/);
  if (ifM) {
    const cond = evaluateFormula('=' + ifM[1].trim(), cells, depth + 1);
    const branch = (cond && cond !== 0 && cond !== '0') ? ifM[2] : ifM[3];
    return evaluateFormula('=' + branch.trim(), cells, depth + 1);
  }

  // Arithmetic with cell refs substituted
  const arith = expr.replace(/([A-Z]+\d+)/g, m => String(getCellNumeric(m, cells, depth)));
  if (/^[\d\s+\-*/().]+$/.test(arith)) {
    try {
      const result = new Function(`"use strict"; return (${arith})`)();
      if (typeof result === 'number' && isFinite(result)) return result;
      if (!isFinite(result)) return '#DIV/0!';
    } catch { /* fall through */ }
  }
  return '#ERR!';
}

function getDisplayValue(key: string, cells: CellData): string {
  const raw = cells[key];
  if (!raw) return '';
  if (raw.startsWith('=')) {
    const r = evaluateFormula(raw, cells);
    return typeof r === 'number' ? String(parseFloat(r.toPrecision(12))) : String(r);
  }
  return raw;
}

// ─── colours ──────────────────────────────────────────────────────────────────

const FILL_COLORS = ['#fef08a','#bbf7d0','#bfdbfe','#fecaca','#ddd6fe','#fed7aa','#f1f5f9','#ffffff'];
const REF_BG     = ['rgba(59,130,246,.22)','rgba(16,185,129,.22)','rgba(168,85,247,.22)','rgba(239,68,68,.22)','rgba(234,179,8,.22)'];
const REF_BORDER = ['#3b82f6','#10b981','#a855f7','#ef4444','#eab308'];

// ─── component ────────────────────────────────────────────────────────────────

export function SpreadsheetClient() {
  // cell data
  const [cells,      setCells]      = useState<CellData>({});
  const [cellColors, setCellColors] = useState<Record<string, string>>({});
  const [cellBorders,setCellBorders]= useState<Record<string, boolean>>({});

  // selection
  const [selected,  setSelected]  = useState<CellAddress>({ row: 0, col: 0 });
  const [selStart,  setSelStart]  = useState<CellAddress | null>(null);
  const [selEnd,    setSelEnd]    = useState<CellAddress | null>(null);

  // editing
  const [editing,   setEditing]   = useState<CellAddress | null>(null);
  const [editValue, setEditValue] = useState('');

  // fill handle
  const [fillDrag, setFillDrag] = useState(false);
  const [fillEnd,  setFillEnd]  = useState<CellAddress | null>(null);

  // copy buffer (stores anchor for relative-ref paste)
  const [copyBuf, setCopyBuf] = useState<{ data: CellData; anchor: CellAddress } | null>(null);

  // refs
  const gridRef       = useRef<HTMLDivElement>(null);
  const cellInputRef  = useRef<HTMLInputElement>(null);
  const fBarRef       = useRef<HTMLInputElement>(null);

  /**
   * formulaRefRef — synchronous (useRef) state for formula-mode cell clicking.
   * When the user types '=SUM(' and then clicks/drags cells we record:
   *   origBefore  — the formula text before the cursor when they first clicked
   *   origAfter   — the formula text after the cursor / selection
   *   startKey    — the cell key where the drag started
   * On each subsequent cell enter (drag) we rebuild editValue as origBefore + rangeRef + origAfter.
   */
  const formulaInsert = useRef<{
    origBefore: string;
    origAfter:  string;
    startKey:   string;
  } | null>(null);

  // ── derived ──────────────────────────────────────────────────────────────────

  const selectedKey   = cellKey(selected.row, selected.col);
  const selectedRaw   = cells[selectedKey] || '';
  const isFormulaMode = editing !== null && editValue.startsWith('=');

  /** Map cell-key → {bg, border} for formula reference highlighting. */
  const refHighlight = useMemo<Map<string,{bg:string;border:string}>>(() => {
    if (!editing || !editValue.startsWith('=')) return new Map();
    const map = new Map<string,{bg:string;border:string}>();
    const expr = editValue.slice(1).toUpperCase();
    let ci = 0;

    // ranges first (A1:B5)
    for (const m of expr.matchAll(/([A-Z]+\d+):([A-Z]+\d+)/g)) {
      const col = { bg: REF_BG[ci % REF_BG.length], border: REF_BORDER[ci % REF_BORDER.length] };
      parseRange(`${m[1]}:${m[2]}`).forEach(k => { if (!map.has(k)) map.set(k, col); });
      ci++;
    }
    // single refs
    const stripped = expr.replace(/[A-Z]+\d+:[A-Z]+\d+/g, '');
    for (const m of stripped.matchAll(/([A-Z]+\d+)/g)) {
      if (!map.has(m[1])) {
        map.set(m[1], { bg: REF_BG[ci % REF_BG.length], border: REF_BORDER[ci % REF_BORDER.length] });
        ci++;
      }
    }
    return map;
  }, [editing, editValue]);

  /** Cells that will be filled when fill handle is released. */
  const fillPreview = useMemo<Set<string>>(() => {
    if (!fillDrag || !fillEnd) return new Set();
    const s = new Set<string>();
    const { row: r0, col: c0 } = selected;
    const { row: r1, col: c1 } = fillEnd;
    if      (r1 > r0) for (let r = r0+1; r <= r1; r++) s.add(cellKey(r, c0));
    else if (r1 < r0) for (let r = r1;   r <  r0; r++) s.add(cellKey(r, c0));
    else if (c1 > c0) for (let c = c0+1; c <= c1; c++) s.add(cellKey(r0, c));
    else if (c1 < c0) for (let c = c1;   c <  c0; c++) s.add(cellKey(r0, c));
    return s;
  }, [fillDrag, fillEnd, selected]);

  const isInSel = useCallback((r: number, c: number) => {
    if (!selStart || !selEnd) return false;
    return r >= Math.min(selStart.row,selEnd.row) && r <= Math.max(selStart.row,selEnd.row) &&
           c >= Math.min(selStart.col,selEnd.col) && c <= Math.max(selStart.col,selEnd.col);
  }, [selStart, selEnd]);

  const getSelKeys = useCallback((): string[] => {
    if (selStart && selEnd) {
      return parseRange(`${cellKey(Math.min(selStart.row,selEnd.row),Math.min(selStart.col,selEnd.col))}:${cellKey(Math.max(selStart.row,selEnd.row),Math.max(selStart.col,selEnd.col))}`);
    }
    return [selectedKey];
  }, [selStart, selEnd, selectedKey]);

  const selLabel = useMemo(() => {
    if (selStart && selEnd) {
      const r1=Math.min(selStart.row,selEnd.row),r2=Math.max(selStart.row,selEnd.row);
      const c1=Math.min(selStart.col,selEnd.col),c2=Math.max(selStart.col,selEnd.col);
      return `${cellKey(r1,c1)}:${cellKey(r2,c2)} (${r2-r1+1}×${c2-c1+1})`;
    }
    return selectedKey;
  }, [selStart, selEnd, selectedKey]);

  // ── editing ───────────────────────────────────────────────────────────────────

  const commitEdit = useCallback(() => {
    if (!editing) return;
    const key = cellKey(editing.row, editing.col);
    setCells(prev => {
      if (editValue.trim() === '') { const n={...prev}; delete n[key]; return n; }
      return { ...prev, [key]: editValue };
    });
    setEditing(null);
    formulaInsert.current = null;
  }, [editing, editValue]);

  const startEdit = useCallback((row: number, col: number, initial?: string) => {
    setEditing({ row, col });
    setEditValue(initial !== undefined ? initial : (cells[cellKey(row, col)] || ''));
    setSelStart(null);
    setSelEnd(null);
    formulaInsert.current = null;
    requestAnimationFrame(() => cellInputRef.current?.focus());
  }, [cells]);

  const selectCell = useCallback((row: number, col: number) => {
    setSelected({ row: Math.max(0,Math.min(ROWS-1,row)), col: Math.max(0,Math.min(COLS-1,col)) });
    setSelStart(null);
    setSelEnd(null);
    formulaInsert.current = null;
    gridRef.current?.focus();
  }, []);

  const commitAndMove = useCallback((dr: number, dc: number) => {
    commitEdit();
    setSelected(p => ({
      row: Math.max(0,Math.min(ROWS-1,p.row+dr)),
      col: Math.max(0,Math.min(COLS-1,p.col+dc)),
    }));
    formulaInsert.current = null;
    requestAnimationFrame(() => gridRef.current?.focus());
  }, [commitEdit]);

  // ── fill handle execution ─────────────────────────────────────────────────────

  const executeFill = useCallback(() => {
    if (!fillEnd) { setFillDrag(false); return; }
    const { row: r0, col: c0 } = selected;
    const { row: r1, col: c1 } = fillEnd;
    const src = cells[cellKey(r0, c0)] || '';
    setCells(prev => {
      const n = { ...prev };
      if      (r1 > r0) for (let r=r0+1;r<=r1;r++) n[cellKey(r,c0)] = shiftFormula(src,r-r0,0);
      else if (r1 < r0) for (let r=r1;  r<r0; r++) n[cellKey(r,c0)] = shiftFormula(src,r-r0,0);
      else if (c1 > c0) for (let c=c0+1;c<=c1;c++) n[cellKey(r0,c)] = shiftFormula(src,0,c-c0);
      else if (c1 < c0) for (let c=c1;  c<c0; c++) n[cellKey(r0,c)] = shiftFormula(src,0,c-c0);
      return n;
    });
    setFillDrag(false);
    setFillEnd(null);
  }, [selected, fillEnd, cells]);

  useEffect(() => {
    const up = () => { if (fillDrag) executeFill(); };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [fillDrag, executeFill]);

  // ── keyboard ──────────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { row, col } = selected;

    if (editing) {
      if (e.key === 'Escape')  { setEditing(null); formulaInsert.current=null; gridRef.current?.focus(); e.preventDefault(); }
      else if (e.key === 'Enter') { commitAndMove(1, 0);  e.preventDefault(); }
      else if (e.key === 'Tab')   { commitAndMove(0, e.shiftKey ? -1 : 1); e.preventDefault(); }
      return;
    }

    // Ctrl+C — copy selection
    if ((e.ctrlKey||e.metaKey) && e.key==='c') {
      const r1=selStart?Math.min(selStart.row,selEnd?.row??row):row;
      const r2=selStart?Math.max(selStart.row,selEnd?.row??row):row;
      const c1=selStart?Math.min(selStart.col,selEnd?.col??col):col;
      const c2=selStart?Math.max(selStart.col,selEnd?.col??col):col;
      const buf: CellData = {};
      for (let r=r1;r<=r2;r++) for (let c=c1;c<=c2;c++) { const k=cells[cellKey(r,c)]; if(k) buf[cellKey(r-r1,c-c1)]=k; }
      setCopyBuf({ data: buf, anchor: {row:r1,col:c1} });
      e.preventDefault();
      return;
    }

    // Ctrl+V — paste with relative reference adjustment
    if ((e.ctrlKey||e.metaKey) && e.key==='v') {
      if (!copyBuf) return;
      setCells(prev => {
        const n = { ...prev };
        Object.entries(copyBuf.data).forEach(([relKey, val]) => {
          const rel = parseCellRef(relKey);
          if (!rel) return;
          const tr=row+rel.row, tc=col+rel.col;
          if (tr>=0&&tr<ROWS&&tc>=0&&tc<COLS)
            n[cellKey(tr,tc)] = shiftFormula(val, row-copyBuf.anchor.row+rel.row, col-copyBuf.anchor.col+rel.col);
        });
        return n;
      });
      e.preventDefault();
      return;
    }

    // Delete / Backspace — clear cells
    if (e.key==='Delete'||e.key==='Backspace') {
      setCells(p => { const n={...p}; getSelKeys().forEach(k=>delete n[k]); return n; });
      e.preventDefault();
      return;
    }

    // Arrow keys — navigate or extend selection with Shift
    const arrow: Record<string,[number,number]> = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
    if (arrow[e.key]) {
      const [dr,dc] = arrow[e.key];
      if (e.shiftKey) {
        const ns = selStart ?? selected;
        setSelStart(ns);
        setSelEnd({ row:Math.max(0,Math.min(ROWS-1,(selEnd?.row??row)+dr)), col:Math.max(0,Math.min(COLS-1,(selEnd?.col??col)+dc)) });
        setSelected({ row:Math.max(0,Math.min(ROWS-1,row+dr)), col:Math.max(0,Math.min(COLS-1,col+dc)) });
      } else { selectCell(row+dr, col+dc); }
      e.preventDefault();
      return;
    }

    if (e.key==='Tab')   { selectCell(row, col+(e.shiftKey?-1:1)); e.preventDefault(); return; }
    if (e.key==='Enter'||e.key==='F2') { startEdit(row,col); e.preventDefault(); return; }
    if (e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey) { startEdit(row,col,e.key); e.preventDefault(); }
  }, [selected, editing, selStart, selEnd, cells, copyBuf, commitAndMove, selectCell, startEdit, getSelKeys]);

  // ── formula-mode cell click handler ──────────────────────────────────────────

  /**
   * Called when user clicks (mousedown) a cell while a formula is being typed.
   * Instead of navigating, this inserts a cell reference at the cursor position.
   */
  function handleFormulaCellClick(r: number, c: number, e: React.MouseEvent) {
    e.preventDefault(); // keep input focused
    e.stopPropagation();

    const input = (document.activeElement === fBarRef.current)
      ? fBarRef.current!
      : cellInputRef.current!;

    const pos    = input.selectionStart ?? editValue.length;
    const posEnd = input.selectionEnd   ?? pos;

    // Record insert point (before, after) for subsequent drag
    const before = editValue.slice(0, pos);
    const after  = editValue.slice(posEnd);
    const ref    = cellKey(r, c);

    formulaInsert.current = { origBefore: before, origAfter: after, startKey: ref };

    const newVal = before + ref + after;
    setEditValue(newVal);

    requestAnimationFrame(() => {
      const ins = before.length + ref.length;
      input.focus();
      input.setSelectionRange(ins, ins);
    });
  }

  /**
   * Called on mouseenter while dragging over cells in formula mode.
   * Extends the inserted reference into a range (A1 → A1:C3).
   */
  function handleFormulaRangeDrag(r: number, c: number) {
    const fi = formulaInsert.current;
    if (!fi) return;
    const start = parseCellRef(fi.startKey);
    if (!start) return;
    const r1=Math.min(start.row,r), c1=Math.min(start.col,c);
    const r2=Math.max(start.row,r), c2=Math.max(start.col,c);
    const ref = (r1===r2&&c1===c2) ? fi.startKey : `${cellKey(r1,c1)}:${cellKey(r2,c2)}`;
    setEditValue(fi.origBefore + ref + fi.origAfter);
  }

  // ── formatting toolbar actions ────────────────────────────────────────────────

  const applyFormula = useCallback((fn: string) => {
    const name = fn==='AVG' ? 'AVERAGE' : fn;
    if (selStart && selEnd) {
      const r1=Math.min(selStart.row,selEnd.row), c1=Math.min(selStart.col,selEnd.col);
      const r2=Math.max(selStart.row,selEnd.row), c2=Math.max(selStart.col,selEnd.col);
      const ref = (r1===r2&&c1===c2) ? cellKey(r1,c1) : `${cellKey(r1,c1)}:${cellKey(r2,c2)}`;
      const target = cellKey(Math.min(r2+1,ROWS-1), c1);
      setCells(p => ({ ...p, [target]: `=${name}(${ref})` }));
      selectCell(Math.min(r2+1,ROWS-1), c1);
    } else {
      startEdit(selected.row, selected.col, `=${name}(`);
    }
  }, [selStart, selEnd, selected, selectCell, startEdit]);

  const applyColor = useCallback((color: string|null) => {
    setCellColors(p => {
      const n={...p}; getSelKeys().forEach(k=>{ if(color===null) delete n[k]; else n[k]=color; }); return n;
    });
  }, [getSelKeys]);

  const applyBorders = useCallback((add: boolean) => {
    setCellBorders(p => {
      const n={...p}; getSelKeys().forEach(k=>{ if(add) n[k]=true; else delete n[k]; }); return n;
    });
  }, [getSelKeys]);

  // ── scroll selected cell into view ────────────────────────────────────────────

  useEffect(() => {
    document.querySelector(`[data-cell="${selectedKey}"]`)?.scrollIntoView({ block:'nearest', inline:'nearest' });
  }, [selectedKey]);

  // ── styles ────────────────────────────────────────────────────────────────────

  const btn = 'px-2 py-1 text-xs rounded border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--surface-3)] transition-colors select-none';
  const sep = <div className="w-px self-stretch bg-[var(--border)] mx-0.5" />;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-[calc(100vh-8rem)] gap-2"
      onMouseUp={() => { formulaInsert.current = null; }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-base font-semibold text-[var(--foreground)]">Spreadsheet</h1>
        <span className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
          Session only — clears on tab close
        </span>
        {isFormulaMode && (
          <span className="text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded font-medium animate-pulse">
            ✦ Formula mode — click or drag cells to insert references
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => { setCells({}); setCellColors({}); setCellBorders({}); setEditing(null); setSelected({row:0,col:0}); }}
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* ── Formatting toolbar ── */}
      <div className="flex items-center gap-1 flex-wrap border border-[var(--border)] rounded-lg px-2 py-1.5 bg-[var(--surface-2)]">
        <span className="text-[10px] text-[var(--foreground-subtle)] mr-1 select-none font-mono">Σ</span>
        {(['SUM','AVG','MAX','MIN','COUNT'] as const).map(fn => (
          <button key={fn} type="button" onClick={() => applyFormula(fn)}
            title={`Insert =${fn==='AVG'?'AVERAGE':fn}() — select range first to auto-fill`}
            className={btn + ' font-mono'}>
            {fn}
          </button>
        ))}
        {sep}
        <span className="text-[10px] text-[var(--foreground-subtle)] mr-0.5 select-none">Fill</span>
        {FILL_COLORS.map(hex => (
          <button key={hex} type="button" onClick={() => applyColor(hex)}
            style={{ backgroundColor:hex, width:20, height:20, minWidth:20 }}
            className="rounded border border-[var(--border)] hover:scale-125 transition-transform" />
        ))}
        <button type="button" onClick={() => applyColor(null)} className={btn} title="Clear fill">✕</button>
        {sep}
        <button type="button" onClick={() => applyBorders(true)}  className={btn}>⊞ Border</button>
        <button type="button" onClick={() => applyBorders(false)} className={btn}>⊟ Clear</button>
      </div>

      {/* ── Formula bar ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-semibold text-[var(--foreground-muted)] bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1 min-w-[80px] text-center truncate select-none">
          {selLabel}
        </span>
        <span className="text-[var(--foreground-muted)] text-sm font-mono select-none">fx</span>
        <input
          ref={fBarRef}
          type="text"
          value={editing ? editValue : selectedRaw}
          onChange={e => {
            formulaInsert.current = null; // typing resets drag state
            if (editing) setEditValue(e.target.value);
            else startEdit(selected.row, selected.col, e.target.value);
          }}
          onKeyDown={e => {
            if (e.key==='Enter')  { commitAndMove(1,0); gridRef.current?.focus(); e.preventDefault(); }
            if (e.key==='Escape') { setEditing(null); formulaInsert.current=null; gridRef.current?.focus(); e.preventDefault(); }
          }}
          className="flex-1 text-sm font-mono border border-[var(--border)] rounded px-2 py-1 bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          placeholder="Value or formula — e.g. =SUM(A1:A10)"
        />
      </div>

      {/* ── Grid ── */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-auto border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        style={{ fontFamily:'var(--font-mono,ui-monospace,monospace)', fontSize:'13px' }}
      >
        <table className="border-collapse" style={{ tableLayout:'fixed', minWidth:'max-content' }}>
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 border-b border-r border-[var(--border)] bg-[var(--surface-2)]"
                style={{ width:44, minWidth:44 }} />
              {Array.from({length:COLS},(_,c) => (
                <th key={c}
                  className="sticky top-0 z-20 border-b border-r border-[var(--border)] bg-[var(--surface-2)] text-center text-xs font-semibold text-[var(--foreground-muted)] select-none"
                  style={{ width:96, minWidth:96, padding:'3px 0' }}>
                  {colName(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length:ROWS},(_,r) => (
              <tr key={r}>
                <td className="sticky left-0 z-10 border-b border-r border-[var(--border)] bg-[var(--surface-2)] text-center text-xs text-[var(--foreground-muted)] select-none"
                  style={{ width:44, minWidth:44, padding:'2px 0' }}>
                  {r+1}
                </td>
                {Array.from({length:COLS},(_,c) => {
                  const key        = cellKey(r, c);
                  const isSelected = selected.row===r && selected.col===c;
                  const isEditing  = editing?.row===r && editing?.col===c;
                  const inSel      = isInSel(r, c);
                  const inFill     = fillPreview.has(key);
                  const refHL      = refHighlight.get(key);
                  const display    = getDisplayValue(key, cells);
                  const isNum      = display !== '' && !isNaN(Number(display));

                  return (
                    <td key={c}
                      data-cell={key}
                      style={{
                        width:96, minWidth:96, height:24, padding:0, position:'relative',
                        backgroundColor: cellColors[key] || undefined,
                        ...(cellBorders[key] ? { boxShadow:'inset 0 0 0 2px #374151' } : {}),
                        // formula ref border highlight
                        ...(refHL && !isSelected ? { outline:`2px solid ${refHL.border}`, outlineOffset:'-1px', zIndex:8 } : {}),
                      }}
                      className={['border-b border-r border-[var(--border)]', isSelected ? 'outline outline-2 outline-[var(--primary)] z-10' : ''].join(' ')}
                      onMouseDown={e => {
                        if (fillDrag) return;

                        // ── Formula mode: insert cell reference ──
                        if (isFormulaMode) {
                          handleFormulaCellClick(r, c, e);
                          return;
                        }

                        if (editing) commitEdit();

                        if (e.shiftKey) {
                          setSelStart(selected);
                          setSelEnd({ row:r, col:c });
                          setSelected({ row:r, col:c });
                          e.preventDefault();
                          return;
                        }

                        setSelected({ row:r, col:c });
                        setSelStart(null);
                        setSelEnd(null);
                        gridRef.current?.focus();
                      }}
                      onMouseEnter={e => {
                        // fill handle drag
                        if (fillDrag) { setFillEnd({ row:r, col:c }); return; }

                        // formula range drag (extend range ref as user drags)
                        if (isFormulaMode && formulaInsert.current && e.buttons===1) {
                          handleFormulaRangeDrag(r, c);
                          return;
                        }

                        // normal range selection drag
                        if (e.buttons===1 && !editing && !isFormulaMode) {
                          if (!selStart) setSelStart(selected);
                          setSelEnd({ row:r, col:c });
                          setSelected({ row:r, col:c });
                        }
                      }}
                      onDoubleClick={() => { if (!isFormulaMode) startEdit(r, c); }}
                    >
                      {/* Formula reference colour overlay */}
                      {refHL && !isSelected && (
                        <div style={{ position:'absolute', inset:0, backgroundColor:refHL.bg, pointerEvents:'none', zIndex:1 }} />
                      )}

                      {/* Range-selection / fill-preview overlay */}
                      {(inSel || inFill) && !isSelected && (
                        <div style={{
                          position:'absolute', inset:0, pointerEvents:'none', zIndex:2,
                          backgroundColor: inFill ? 'rgba(34,197,94,.15)' : 'rgba(59,130,246,.13)',
                          border: inFill ? '1px dashed #16a34a' : undefined,
                        }} />
                      )}

                      {/* Cell editor input */}
                      {isEditing ? (
                        <input
                          ref={cellInputRef}
                          type="text"
                          value={editValue}
                          onChange={e => { setEditValue(e.target.value); formulaInsert.current = null; }}
                          onBlur={e => {
                            // Don't commit if another cell was clicked in formula mode
                            // (that mousedown called preventDefault, keeping focus here,
                            //  but onBlur may still fire in some browsers on relatedTarget)
                            if (isFormulaMode && e.relatedTarget === null) return;
                            if (!isFormulaMode) commitEdit();
                          }}
                          style={{
                            position:'absolute', inset:0, width:'100%', height:'100%',
                            padding:'0 6px', fontSize:13, fontFamily:'inherit',
                            border:'2px solid var(--primary)',
                            background:'var(--bg)', color:'var(--foreground)',
                            outline:'none', zIndex:20,
                          }}
                        />
                      ) : (
                        <span style={{
                          display:'block', lineHeight:'24px', padding:'0 6px',
                          overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
                          textAlign: isNum ? 'right' : 'left',
                          position:'relative', zIndex:3,
                          color: display.startsWith('#') && display.endsWith('!')
                            ? 'var(--destructive,#ef4444)' : 'var(--foreground)',
                        }}>
                          {display}
                        </span>
                      )}

                      {/* ── Fill handle (bottom-right square of selected cell) ── */}
                      {isSelected && !isEditing && (
                        <div
                          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setFillDrag(true); setFillEnd(null); }}
                          title="Drag to fill"
                          style={{
                            position:'absolute', bottom:-4, right:-4,
                            width:8, height:8, zIndex:15,
                            backgroundColor:'var(--primary)',
                            border:'2px solid white',
                            boxShadow:'0 0 0 1px var(--primary)',
                            cursor:'crosshair',
                          }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Hint bar ── */}
      <div className="flex items-center gap-3 text-[10px] text-[var(--foreground-subtle)] flex-wrap pb-1">
        {[
          ['Enter/F2','Edit cell'], ['Esc','Cancel'], ['↑↓←→','Move'],
          ['Shift+↑↓←→','Select range'], ['Drag cells','Select range'],
          ['Del','Clear'], ['Ctrl+C/V','Copy / Paste (relative refs)'],
        ].map(([k,l]) => (
          <span key={k}>
            <kbd className="bg-[var(--surface-2)] border border-[var(--border)] px-1 py-0.5 rounded text-[10px] font-mono">{k}</kbd>
            {' '}{l}
          </span>
        ))}
        <span className="ml-auto">
          Type <code className="bg-[var(--surface-2)] border border-[var(--border)] px-1 rounded">=SUM(</code> then <strong>click / drag cells</strong> to insert refs · drag <strong>↘ corner</strong> to fill
        </span>
      </div>
    </div>
  );
}
