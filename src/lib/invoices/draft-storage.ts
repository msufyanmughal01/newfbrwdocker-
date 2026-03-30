// IndexedDB Draft Storage Utilities
// Phase 1: Client-side draft persistence | Phase 2: Server sync migration

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { InvoiceFormData } from './validation';

// =============================================================================
// Types
// =============================================================================

export interface InvoiceDraft {
  id: string; // UUID
  invoiceData: Partial<InvoiceFormData>; // Partial invoice (incomplete form)
  lastSaved: number; // Unix timestamp
  organizationId: string; // For multi-tenant support
  createdAt: number; // Unix timestamp
}

interface DraftDB extends DBSchema {
  drafts: {
    key: string; // Draft ID
    value: InvoiceDraft;
    indexes: {
      'by-organization': string;
      'by-last-saved': number;
    };
  };
}

// =============================================================================
// Database Connection
// =============================================================================

let dbPromise: Promise<IDBPDatabase<DraftDB>> | null = null;

/**
 * Initialize IndexedDB connection
 *
 * Creates database and indexes on first run
 * Reuses connection for subsequent calls
 */
function getDB(): Promise<IDBPDatabase<DraftDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DraftDB>('invoice-drafts', 1, {
      upgrade(db) {
        const store = db.createObjectStore('drafts', { keyPath: 'id' });
        store.createIndex('by-organization', 'organizationId');
        store.createIndex('by-last-saved', 'lastSaved');
      },
    });
  }
  return dbPromise;
}

// =============================================================================
// Draft Operations
// =============================================================================

/**
 * Save draft to IndexedDB
 *
 * Creates new draft or updates existing one
 * Auto-save interval: 60 seconds (configured in form component)
 *
 * @param draftId - Unique draft identifier (UUID)
 * @param invoiceData - Partial invoice form data
 * @param organizationId - Organization ID for multi-tenant filtering
 * @throws Error if IndexedDB operation fails
 */
export async function saveDraft(
  draftId: string,
  invoiceData: Partial<InvoiceFormData>,
  organizationId: string
): Promise<void> {
  const db = await getDB();

  // Get existing draft to preserve createdAt
  const existing = await db.get('drafts', draftId);

  await db.put('drafts', {
    id: draftId,
    invoiceData,
    lastSaved: Date.now(),
    organizationId,
    createdAt: existing?.createdAt || Date.now(),
  });
}

/**
 * Load draft from IndexedDB
 *
 * @param draftId - Draft identifier to load
 * @returns Draft data or undefined if not found
 */
export async function loadDraft(draftId: string): Promise<InvoiceDraft | undefined> {
  const db = await getDB();
  return await db.get('drafts', draftId);
}

/**
 * List all drafts for an organization
 *
 * Sorted by last saved (most recent first)
 *
 * @param organizationId - Organization ID to filter by
 * @returns Array of drafts sorted by lastSaved descending
 */
export async function listDrafts(organizationId: string): Promise<InvoiceDraft[]> {
  const db = await getDB();
  const drafts = await db.getAllFromIndex('drafts', 'by-organization', organizationId);

  // Sort by lastSaved descending (most recent first)
  return drafts.sort((a, b) => b.lastSaved - a.lastSaved);
}

/**
 * Delete draft from IndexedDB
 *
 * Called when invoice is successfully submitted or user manually deletes
 *
 * @param draftId - Draft identifier to delete
 */
export async function deleteDraft(draftId: string): Promise<void> {
  const db = await getDB();
  await db.delete('drafts', draftId);
}

/**
 * Delete all drafts for an organization
 *
 * Used for cleanup or testing
 *
 * @param organizationId - Organization ID to delete drafts for
 */
export async function deleteAllDrafts(organizationId: string): Promise<void> {
  const db = await getDB();
  const drafts = await db.getAllFromIndex('drafts', 'by-organization', organizationId);

  const tx = db.transaction('drafts', 'readwrite');
  await Promise.all([
    ...drafts.map((draft) => tx.store.delete(draft.id)),
    tx.done,
  ]);
}

/**
 * Clear all drafts (for testing/reset)
 *
 * WARNING: This deletes ALL drafts for ALL organizations
 */
export async function clearAllDrafts(): Promise<void> {
  const db = await getDB();
  await db.clear('drafts');
}

/**
 * Get draft count for an organization
 *
 * Useful for UI badges showing number of drafts
 *
 * @param organizationId - Organization ID to count drafts for
 * @returns Number of drafts
 */
export async function getDraftCount(organizationId: string): Promise<number> {
  const db = await getDB();
  const drafts = await db.getAllFromIndex('drafts', 'by-organization', organizationId);
  return drafts.length;
}

/**
 * Check if draft exists
 *
 * @param draftId - Draft identifier to check
 * @returns true if draft exists, false otherwise
 */
export async function draftExists(draftId: string): Promise<boolean> {
  const db = await getDB();
  const draft = await db.get('drafts', draftId);
  return draft !== undefined;
}

// =============================================================================
// Storage Utilities
// =============================================================================

/**
 * Get IndexedDB storage estimate
 *
 * Useful for monitoring quota usage
 *
 * @returns Storage quota and usage information
 */
export async function getStorageEstimate(): Promise<{
  quota: number;
  usage: number;
  available: number;
  percentUsed: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const available = quota - usage;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      quota,
      usage,
      available,
      percentUsed: Math.round(percentUsed * 100) / 100,
    };
  }

  return {
    quota: 0,
    usage: 0,
    available: 0,
    percentUsed: 0,
  };
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
