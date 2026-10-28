import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureBarcode: (barcode: string) => void;
  onCaptureOcrText: (text: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCaptureBarcode,
  onCaptureOcrText,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [simulatedDevices] = useState([
    {
      label: 'Mindray BeneVision N17 (Full Barcode + Label)',
      barcode: '(01)06944983000012(11)220801(10)20230A1(21)FA-12345678',
      text: 'Mindray\nManufacturer: Shenzhen Mindray Bio-Medical Electronics Co., Ltd.\nModel: BeneVision N17\nSN: FA-12345678\nLOT 20230A1\nDate of manufacture: 2022-08\nEXP: 2027-08',
    },
    {
      label: 'GS1 Raw DataMatrix with Group Separator',
      barcode: '01040123456789011123011510LOT4821\u001D21SN998877',
      text: 'Model: Precision Scalpel\nSerial Number: SN998877',
    },
    {
      label: 'Arabic-Indic Label (MFG: ٢٠٢١/٠٣)',
      barcode: '(01)06281001234567(21)12345',
      text: 'Gulf Health Tech\nMFG: ٢٠٢١/٠٣\nSN: 12345',
    },
    {
      label: 'EC REP MDR Dual Label',
      barcode: '(01)00840192837465(10)BATCH9921(21)ACME-4455',
      text: 'EC REP Medical Partner GmbH\nAcme Medical Inc.\nModel: Endoscope Camera',
    },
  ]);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    let currentStream: MediaStream | null = null;
    async function startCamera() {
      try {
        setCameraError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err: any) {
        setCameraError(
          'Camera access not available in this preview environment. You can use instant simulated camera scans or photo file upload.'
        );
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulatedScan = (item: { barcode: string; text: string }) => {
    onCaptureBarcode(item.barcode);
    onCaptureOcrText(item.text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Medical Device Barcode & Label Scanner
              </h3>
              <p className="text-xs text-slate-400">
                Align GS1 DataMatrix or OCR label inside the reticle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {stream ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 text-cyan-500 mb-2 opacity-80" />
              <p className="text-xs text-slate-300 max-w-xs">{cameraError || 'Initializing video feed...'}</p>
            </div>
          )}

          {/* Scanner Aiming Reticle (Biomedical HUD style) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="relative w-64 h-44 border-2 border-cyan-400/60 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

              {/* Laser scan line animation */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_8px_#38bdf8]" />

              <span className="text-[10px] text-cyan-300 font-mono tracking-wider bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30">
                ALIGN GS1 / UDI / LABEL
              </span>
            </div>
          </div>
        </div>

        {/* Quick Simulated Medical Device Label Scans */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Instant Hardware Scan Simulation:
            </span>
            <span className="text-[11px] text-slate-500">Click to capture</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {simulatedDevices.map((dev, idx) => (
              <button
                key={idx}
                onClick={() => handleSimulatedScan(dev)}
                className="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition flex flex-col group"
              >
                <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition">
                  {dev.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  {dev.barcode || dev.text.split('\n')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
