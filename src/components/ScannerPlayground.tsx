import React, { useState } from 'react';
import {
  Barcode as BarcodeIcon,
  FileText,
  Plus,
  Trash2,
  Camera,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  Copy,
  Check,
  Code2,
} from 'lucide-react';
import { SAMPLE_DEVICES, SampleDevice } from '../data/sampleDevices';

interface ScannerPlaygroundProps {
  barcodes: string[];
  text: string;
  onChangeBarcodes: (barcodes: string[]) => void;
  onChangeText: (text: string) => void;
  onOpenScannerModal: () => void;
}

export const ScannerPlayground: React.FC<ScannerPlaygroundProps> = ({
  barcodes,
  text,
  onChangeBarcodes,
  onChangeText,
  onOpenScannerModal,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('mindray-n17');

  const handleAddBarcode = () => {
    onChangeBarcodes([...barcodes, '']);
  };

  const handleUpdateBarcode = (index: number, val: string) => {
    const updated = [...barcodes];
    updated[index] = val;
    onChangeBarcodes(updated);
  };

  const handleRemoveBarcode = (index: number) => {
    const updated = barcodes.filter((_, i) => i !== index);
    onChangeBarcodes(updated);
  };

  const handleInsertAi = (index: number, snippet: string) => {
    const current = barcodes[index] || '';
    handleUpdateBarcode(index, current + snippet);
  };

  const handleInsertSymbol = (symbolText: string) => {
    onChangeText(text ? `${text}\n${symbolText}` : symbolText);
  };

  const handleSelectPreset = (device: SampleDevice) => {
    setActivePresetId(device.id);
    onChangeBarcodes([...device.barcodes]);
    onChangeText(device.text);
  };

  const handleCopyBarcode = (val: string, index: number) => {
    navigator.clipboard.writeText(val);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Preset Device Fixtures Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Quick Test Fixtures & Regulatory Label Presets:
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Matches all 10 unit test cases
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SAMPLE_DEVICES.map((dev) => {
            const isActive = activePresetId === dev.id;
            return (
              <button
                key={dev.id}
                onClick={() => handleSelectPreset(dev)}
                className={`flex-shrink-0 text-left px-3 py-1.5 rounded-lg text-xs font-medium transition border flex items-center space-x-2 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <span>{dev.name.split(' (')[0]}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/70 text-slate-400 border border-slate-800">
                  {dev.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Input Area: Barcodes & OCR Text */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Barcode & UDI Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <BarcodeIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Barcodes & 2D UDI Carriers
                </h3>
                <p className="text-[11px] text-slate-400">
                  GS1-128, GS1 DataMatrix, or Plain Symbologies
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenScannerModal}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Scan</span>
              </button>
              <button
                onClick={handleAddBarcode}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Code</span>
              </button>
            </div>
          </div>

          {/* Barcodes list */}
          <div className="space-y-2.5 flex-1 min-h-[160px]">
            {barcodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 border border-dashed border-slate-800 rounded-lg p-4 text-center">
                <BarcodeIcon className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">No barcodes entered.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click "+ Add Code" or select a preset fixture above.
                </p>
              </div>
            ) : (
              barcodes.map((bc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={bc}
                      onChange={(e) => handleUpdateBarcode(idx, e.target.value)}
                      placeholder="(01)04012345678901(21)SN123456 or raw GS1..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => handleCopyBarcode(bc, idx)}
                      title="Copy barcode string"
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveBarcode(idx)}
                      title="Delete barcode"
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick AI Tag Insertion Toolbar */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium mr-1">
                      Insert GS1 AI:
                    </span>
                    <button
                      onClick={() => handleInsertAi(idx, '(01)04012345678901')}
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono"
                    >
                      (01) GTIN
                    </button>
                    <button
                      onClick={() => handleInsertAi(idx, '(10)LOT4821')}
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono"
                    >
                      (10) LOT
                    </button>
                    <button
                      onClick={() => handleInsertAi(idx, '(21)SN998877')}
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono"
                    >
                      (21) SN
                    </button>
                    <button
                      onClick={() => handleInsertAi(idx, '(11)230115')}
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono"
                    >
                      (11) MFG
                    </button>
                    <button
                      onClick={() => handleInsertAi(idx, '(17)280115')}
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono"
                    >
                      (17) EXP
                    </button>
                    <button
                      onClick={() => handleInsertAi(idx, '\u001D')}
                      title="ASCII 29 Group Separator (FNC1)"
                      className="text-[10px] bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono"
                    >
                      \u001D (GS)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Barcode Syntax Helper Note */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-[11px] text-slate-400 flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p>
              Supports bracketed AIs e.g.{' '}
              <span className="font-mono text-cyan-300">
                (01)...(11)...(10)...(21)...
              </span>{' '}
              and raw data with ASCII 29 delimiter{' '}
              <span className="font-mono text-cyan-300">\u001D</span>. Non-GS1 barcodes
              are safely preserved as candidates.
            </p>
          </div>
        </div>

        {/* Right Column: OCR Label Text Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  OCR Optical Label Text
                </h3>
                <p className="text-[11px] text-slate-400">
                  Label lines, ISO symbols, Arabic numerals & multi-line headers
                </p>
              </div>
            </div>

            <button
              onClick={() => onChangeText('')}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Quick Insert Symbols & Formats */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-medium">
              Insert Snippets:
            </span>
            <button
              onClick={() => handleInsertSymbol('Manufacturer: Shenzhen Mindray Bio-Medical Electronics Co., Ltd.')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
            >
              🏭 Manufacturer:
            </button>
            <button
              onClick={() => handleInsertSymbol('EC REP Medical Partner GmbH')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
            >
              🇪🇺 EC REP
            </button>
            <button
              onClick={() => handleInsertSymbol('Model: BeneVision N17')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
            >
              🏷️ Model
            </button>
            <button
              onClick={() => handleInsertSymbol('SN: FA-12345678')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
            >
              🔢 SN
            </button>
            <button
              onClick={() => handleInsertSymbol('LOT 20230A1')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
            >
              📦 LOT
            </button>
            <button
              onClick={() => handleInsertSymbol('MFG: ٢٠٢١/٠٣')}
              className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800 font-mono"
            >
              ٢٠٢١/٠٣ (Arabic)
            </button>
            <button
              onClick={() => handleInsertSymbol('Date of manufacture: 2022-08')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
            >
              📅 MFG Date
            </button>
            <button
              onClick={() => handleInsertSymbol('EXP: 2027-08')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
            >
              ⌛ EXP Date
            </button>
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="Paste raw OCR extracted text here...&#10;e.g.&#10;Mindray&#10;Manufacturer: Shenzhen Mindray Bio-Medical Electronics Co., Ltd.&#10;Model: BeneVision N17&#10;SN: FA-12345678"
              rows={8}
              className="w-full h-full min-h-[170px] bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
            />
          </div>

          {/* Quick Stats Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Lines: {text ? text.split('\n').filter(Boolean).length : 0} | Characters: {text.length}
            </span>
            <span className="text-teal-400">Live Auto-Parsing Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
