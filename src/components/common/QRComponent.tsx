import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRViewerProps {
  value: string;
  size?: number;
  businessName?: string;
}

export const QRViewer: React.FC<QRViewerProps> = ({ value, size = 200, businessName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [value, size]);

  return (
    <div id="qr-code-container" className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="relative p-3 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
        <canvas ref={canvasRef} className="rounded-lg shadow-inner" />
      </div>

      <div className="mt-4 text-center">
        {businessName && (
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {businessName} Membership QR
          </p>
        )}
        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400 select-all">
          ID: {value}
        </p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          🔒 Encrypted Token • No personal data encoded
        </p>
      </div>
    </div>
  );
};
