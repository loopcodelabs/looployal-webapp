import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Upload, AlertCircle, RefreshCw, CheckCircle, Zap, ShieldCheck } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (qrCodeText: string) => void;
  tenantName?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  tenantName = 'Active Tenant',
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'cashier-qr-reader';

  // Start Live Camera
  const startCamera = async () => {
    setCameraError(null);
    setScannedResult(null);

    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(qrRegionId);
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        setScannedResult(decodedText);
        stopCamera();
        onScanSuccess(decodedText);
      };

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      // Try facingMode environment (rear camera) first, then fallback to user (front camera)
      try {
        await html5QrcodeRef.current.start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          () => {}
        );
      } catch (e) {
        // Fallback to front camera or any camera
        await html5QrcodeRef.current.start(
          { facingMode: 'user' },
          config,
          qrCodeSuccessCallback,
          () => {}
        );
      }

      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(
        err?.message || 'Unable to access camera. Please check camera permissions or upload an image.'
      );
      setCameraActive(false);
    }
  };

  // Stop Live Camera
  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error('Failed to stop camera scanner', err);
      }
    }
    setCameraActive(false);
  };

  // Scan from uploaded Image File
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    setCameraError(null);

    try {
      const html5Qrcode = new Html5Qrcode(qrRegionId);
      const decodedText = await html5Qrcode.scanFile(file, true);
      setScannedResult(decodedText);
      onScanSuccess(decodedText);
    } catch (err: any) {
      setCameraError('No valid QR code detected in the selected image file.');
    } finally {
      setIsScanningFile(false);
    }
  };

  // Cleanup camera on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setCameraError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Scan Customer QR Code
              </h3>
              <p className="text-xs text-slate-500">
                POS Scanner • Tenant Context: <span className="font-semibold text-blue-600 dark:text-blue-400">{tenantName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 space-y-4">
          
          {/* CAMERA DISPLAY REGION */}
          <div className="relative rounded-2xl bg-slate-950 min-h-[280px] flex flex-col items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
            <div id={qrRegionId} className="w-full h-full max-w-[320px]" />

            {!cameraActive && !scannedResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/90 text-slate-300">
                <Camera className="w-12 h-12 text-slate-600 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-slate-200">Live Camera Feed Inactive</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Click "Start Live Camera" to scan customer membership QR code using webcam or mobile camera.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Live Camera</span>
                </button>
              </div>
            )}

            {scannedResult && (
              <div className="absolute inset-0 bg-emerald-950/90 text-emerald-100 flex flex-col items-center justify-center p-6 text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
                <h4 className="text-base font-bold">QR Scanned Successfully!</h4>
                <p className="text-xs font-mono bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/50">
                  {scannedResult}
                </p>
              </div>
            )}
          </div>

          {/* CONTROLS & ERRORS */}
          {cameraActive && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Camera Scanning Active...
              </span>
              <button
                onClick={stopCamera}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                Stop Camera
              </button>
            </div>
          )}

          {cameraError && (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* FILE UPLOAD & DEMO QUICK SCANS */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                <Upload className="w-4 h-4 text-blue-500" />
                <span>Upload QR Image File (Alternative)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {isScanningFile && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Processing file...
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Quick POS Simulation (Test Scans):
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    const code = 'CUST-QR-cst-01';
                    setScannedResult(code);
                    onScanSuccess(code);
                  }}
                  className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 hover:border-indigo-500 text-left font-mono text-[11px] font-bold transition flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-100">Universal Customer QR</span>
                    <br />
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-300">CUST-QR-cst-01 (Rahul Verma)</span>
                  </div>
                  <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-sans">Universal</span>
                </button>

                <button
                  onClick={() => {
                    const code = '9876543210';
                    setScannedResult(code);
                    onScanSuccess(code);
                  }}
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 hover:border-emerald-500 text-left font-mono text-[11px] font-bold transition flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-100">Registered Mobile</span>
                    <br />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-300">9876543210</span>
                  </div>
                  <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-sans">Mobile</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Automatic Tenant Isolation Enforced
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
};
