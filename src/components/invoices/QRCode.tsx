'use client';

// QRCode — wraps react-qr-code SVG for print-safe 1.0×1.0 inch QR codes
// FBR spec: QR version 2.0 (25×25), 1.0×1.0 inch printed
// Note: FBR invoice numbers are 22-28 chars — auto-version selection used (minVersion={2})

import QRCodeSVG from 'react-qr-code';

interface QRCodeProps {
  value: string;
  /** Size in pixels at screen resolution (default 96 = 1 inch at 96dpi) */
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 96, className }: QRCodeProps) {
  return (
    <div
      className={className}
      style={{
        // Ensure 1.0 × 1.0 inch in print
        width: size,
        height: size,
      }}
    >
      <style>{`
        @media print {
          .fbr-qr-code {
            width: 1in !important;
            height: 1in !important;
          }
        }
      `}</style>
      <QRCodeSVG
        className="fbr-qr-code"
        value={value}
        size={size}
        level="M"
        // minVersion not a supported prop in current react-qr-code — library auto-selects
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
