import { ImageResponse } from 'next/og';

export const alt = 'EasyDigitalInvoice - FBR-Compliant Invoicing for Pakistan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0c1a3a 0%, #1a3272 45%, #1d4ed8 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-80px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Decorative glow bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-60px',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '44px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #60a5fa, #34d399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="30" height="30" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5" />
              <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.01em',
                lineHeight: '1',
                display: 'flex',
              }}
            >
              <span style={{ color: '#ffffff' }}>Easy</span>
              <span style={{ color: '#60a5fa' }}>Digital</span>
              <span style={{ color: '#ffffff' }}>&nbsp;Invoice</span>
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', display: 'flex' }}>
              FBR-COMPLIANT INVOICING - PAKISTAN
            </div>
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: '68px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: '1.05',
            letterSpacing: '-0.025em',
            marginBottom: '20px',
            maxWidth: '780px',
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          <span>FBR-Compliant&nbsp;</span>
          <span style={{ color: '#60a5fa' }}>E-Invoicing</span>
          <span>&nbsp;for Pakistan</span>
        </div>

        {/* Sub-headline */}
        <div
          style={{
            fontSize: '22px',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: '1.45',
            maxWidth: '680px',
            marginBottom: '52px',
            display: 'flex',
          }}
        >
          Generate, validate and submit FBR invoices instantly. NTN, CNIC, STRN, Sales Tax - all in one platform.
        </div>

        {/* Feature badges */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            'FBR API Integrated',
            'NTN and STRN Verified',
            'Sales Tax Compliant',
            'Sandbox + Production',
          ].map(text => (
            <div
              key={text}
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.88)',
                letterSpacing: '0.01em',
                display: 'flex',
              }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Right side: floating invoice card mockup */}
        <div
          style={{
            position: 'absolute',
            right: '72px',
            top: '50%',
            width: '280px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Invoice header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', display: 'flex' }}>
              SALE INVOICE
            </div>
            <div
              style={{
                background: 'rgba(34,197,94,0.2)',
                border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#34d399',
                display: 'flex',
              }}
            >
              ISSUED
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', display: 'flex' }} />

          {/* Mock rows */}
          {[
            { label: 'NTN', val: '1234567' },
            { label: 'STRN', val: '4210-XXXXX' },
            { label: 'Invoice #', val: 'INV-2026-001' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{r.label}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{r.val}</span>
            </div>
          ))}

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginTop: '4px', display: 'flex' }} />

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Grand Total</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#60a5fa' }}>PKR 118,000</span>
          </div>

          {/* Submit button mockup */}
          <div
            style={{
              marginTop: '6px',
              background: 'rgba(29,78,216,0.65)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            Submit to FBR
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
