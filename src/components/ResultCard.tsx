import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Tag,
  Hash,
  Box,
  Calendar,
  Hourglass,
  Layers,
  FileCode,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ParseResult, Source, Warning, PartialDate } from '../types/label';
import { lookupRegistry } from '../data/deviceCatalog';

interface ResultCardProps {
  result: ParseResult;
  onOpenPrint: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onOpenPrint }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const registryRecord = lookupRegistry(result.gtin || result.model?.value);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `medlabel-${result.serial?.value || 'device'}.json`);
    dlAnchor.click();
  };

  // Human-readable warning messages
  const warningMessages: Record<Warning, { title: string; desc: string; severity: 'error' | 'warning' | 'info' }> = {
    [Warning.SERIAL_MISMATCH]: {
      title: 'Serial Number Disagreement (Warning.SERIAL_MISMATCH)',
      desc: `Physical barcode serial "${result.serial?.value}" and OCR label serial do not match. Per medical device protocol, the Barcode value is prioritized as authoritative.`,
      severity: 'warning',
    },
    [Warning.LOT_MISMATCH]: {
      title: 'Batch / Lot Code Disagreement (Warning.LOT_MISMATCH)',
      desc: 'The lot number parsed from the 2D barcode differs from OCR text on the label.',
      severity: 'warning',
    },
    [Warning.DATE_DISCREPANCY]: {
      title: 'Date Discrepancy (Warning.DATE_DISCREPANCY)',
      desc: 'A discrepancy was detected between barcode production date and printed manufacture/expiration date.',
      severity: 'warning',
    },
    [Warning.EXPIRED_DEVICE]: {
      title: 'Device Expired (Warning.EXPIRED_DEVICE)',
      desc: 'This medical device has exceeded its expiration date. Do not deploy to clinical inventory without engineering re-certification.',
      severity: 'error',
    },
    [Warning.SUSPICIOUS_MANUFACTURER]: {
      title: 'Manufacturer Inferred (Warning.SUSPICIOUS_MANUFACTURER)',
      desc: 'European Authorized Representative (EC REP) was suppressed from the manufacturer field; legal manufacturer was inferred from corporate entity naming.',
      severity: 'info',
    },
    [Warning.ARABIC_INDIC_NORMALIZED]: {
      title: 'Arabic-Indic Numerals Normalized',
      desc: 'Arabic-Indic characters (e.g. ٢٠٢١/٠٣) were detected, normalized to Western digits, and successfully parsed into standard date/serial objects.',
      severity: 'info',
    },
    [Warning.GTIN_CHECKSUM_INVALID]: {
      title: 'GTIN Checksum Invalid',
      desc: 'The modulo-10 check digit for the 14-digit GTIN failed mathematical verification.',
      severity: 'error',
    },
    [Warning.BARCODE_SYNTAX_ERROR]: {
      title: 'Barcode Syntax Malformed',
      desc: 'A scanned barcode contains invalid character sets or incomplete AI parameters.',
      severity: 'warning',
    },
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col space-y-5 p-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
              Parsed Clinical Entity
            </span>
            {result.warnings.length === 0 ? (
              <span className="text-xs font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verification Clean (0 Warnings)</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{result.warnings.length} Active Warning(s)</span>
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            {result.manufacturer?.value || 'Unspecified Manufacturer'}{' '}
            {result.model?.value ? `— ${result.model.value}` : ''}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => handleCopy(
              `TAG: ${result.serial?.value || 'NOSN'}-${result.lotCode?.value || 'NOLOT'}-${result.gtin || 'NOGTIN'}`,
              'assetTag'
            )}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copiedField === 'assetTag' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Copy Asset Tag</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>{showJson ? 'Hide JSON' : 'Raw JSON'}</span>
            {showJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Warnings & Clinical Discrepancy Banners */}
      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w, idx) => {
            const info = warningMessages[w] || {
              title: w,
              desc: 'Clinical warning triggered by label verifier.',
              severity: 'warning',
            };
            const isError = info.severity === 'error';
            const isInfo = info.severity === 'info';

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start space-x-3 ${
                  isError
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : isInfo
                    ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                }`}
              >
                {isError ? (
                  <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                ) : isInfo ? (
                  <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold">{info.title}</span>
                  <p className="opacity-90 leading-relaxed">{info.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Core Medical Device Attributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Manufacturer */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>🏭 Legal Manufacturer</span>
            </span>
            {result.manufacturer?.guessed ? (
              <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800/80 px-1.5 py-0.2 rounded font-mono">
                Guessed (NLP)
              </span>
            ) : result.manufacturer?.value ? (
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.2 rounded font-mono">
                Verified
              </span>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-slate-100 break-words">
            {result.manufacturer?.value || <span className="text-slate-500 font-normal">Not detected</span>}
          </p>
        </div>

        {/* Model */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>🏷️ Model / REF</span>
            </span>
            {result.model && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                {result.model.source}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-100">
            {result.model?.value || <span className="text-slate-500 font-normal">Not detected</span>}
          </p>
        </div>

        {/* Serial Number (SN) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span>🔢 Serial Number (SN)</span>
            </span>
            {result.serial && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                  result.serial.source === Source.BARCODE
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-teal-950 text-teal-300 border border-teal-800'
                }`}
              >
                {result.serial.source === Source.BARCODE ? 'BARCODE (Priority)' : 'OCR'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-mono font-bold text-slate-100">
              {result.serial?.value || <span className="text-slate-500 font-normal">Not detected</span>}
            </p>
            {result.serial?.value && (
              <button
                onClick={() => handleCopy(result.serial!.value, 'serial')}
                className="text-slate-500 hover:text-slate-200 transition"
              >
                {copiedField === 'serial' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Batch / Lot Code */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>📦 Batch / LOT</span>
            </span>
            {result.lotCode && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  result.lotCode.source === Source.BARCODE
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-teal-950 text-teal-300 border border-teal-800'
                }`}
              >
                {result.lotCode.source}
              </span>
            )}
          </div>
          <p className="text-sm font-mono font-bold text-slate-100">
            {result.lotCode?.value || <span className="text-slate-500 font-normal">Not detected</span>}
          </p>
        </div>

        {/* Manufacture Date */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>📅 Manufacture Date</span>
            </span>
            {result.manufactureDate && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                {result.manufactureDate.source}
              </span>
            )}
          </div>
          <p className="text-sm font-mono font-bold text-slate-100">
            {result.manufactureDate?.value ? (
              result.manufactureDate.value.toString()
            ) : (
              <span className="text-slate-500 font-normal">Not detected</span>
            )}
          </p>
        </div>

        {/* Expiration Date */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Hourglass className="w-3.5 h-3.5 text-cyan-400" />
              <span>⌛ Expiration Date</span>
            </span>
            {result.expirationDate?.value?.isPast() ? (
              <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.2 rounded font-mono">
                EXPIRED
              </span>
            ) : result.expirationDate ? (
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                Valid
              </span>
            ) : null}
          </div>
          <p className="text-sm font-mono font-bold text-slate-100">
            {result.expirationDate?.value ? (
              result.expirationDate.value.toString()
            ) : (
              <span className="text-slate-500 font-normal">Not detected</span>
            )}
          </p>
        </div>

        {/* GTIN / Primary UDI-DI */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>🆔 GTIN / UDI-DI</span>
            </span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
              AI (01)
            </span>
          </div>
          <p className="text-sm font-mono font-bold text-cyan-300">
            {result.gtin || <span className="text-slate-500 font-normal">None</span>}
          </p>
        </div>

        {/* European Authorized Representative (EC REP) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>🇪🇺 EC REP (EU MDR)</span>
            </span>
            <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-mono">
              Non-Manufacturer
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100">
            {result.ecRep?.value || <span className="text-slate-500 font-normal">None</span>}
          </p>
        </div>

        {/* Barcode Candidates (Plain barcodes preserved) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              <span>Unassigned Barcodes</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
              Candidates
            </span>
          </div>
          <div className="text-xs font-mono text-slate-300">
            {result.barcodeCandidates.length > 0 ? (
              result.barcodeCandidates.map((bc, i) => (
                <span
                  key={i}
                  className="inline-block bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-300 mr-1 mb-1"
                >
                  {bc}
                </span>
              ))
            ) : (
              <span className="text-slate-500">None</span>
            )}
          </div>
        </div>
      </div>

      {/* GS1 Elements Breakdown Table (if barcode elements parsed) */}
      {result.elements && result.elements.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              GS1 Application Identifier (AI) Breakdown:
            </span>
            <span className="text-[11px] text-slate-500">
              {result.elements.length} field(s) decoded from barcode carrier
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">AI</th>
                  <th className="pb-2 font-medium">Standard Name</th>
                  <th className="pb-2 font-medium">Raw Payload</th>
                  <th className="pb-2 font-medium">Decoded Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {result.elements.map((el, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2 text-cyan-400 font-bold">({el.ai})</td>
                    <td className="py-2 text-slate-300 font-sans">{el.title}</td>
                    <td className="py-2 text-slate-400">{el.rawValue}</td>
                    <td className="py-2 text-emerald-400">
                      {typeof el.parsedValue === 'object' && el.parsedValue !== null && 'year' in el.parsedValue
                        ? (el.parsedValue as any).toString()
                        : String(el.parsedValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FDA AccessGUDID & EUDAMED Device Registry Match */}
      {registryRecord && (
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-950/60 border border-cyan-800/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                AccessGUDID Regulatory Record
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 font-mono">
                {registryRecord.deviceClass}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              FDA 510(k): {registryRecord.premarketSubmission}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">GMDN Term:</span>
              <span className="text-slate-200 font-medium">{registryRecord.gmdnName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">FDA Listing #:</span>
              <span className="text-slate-200 font-mono">{registryRecord.fdaListingNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">MRI Safety:</span>
              <span className="text-amber-400 font-medium">{registryRecord.mriSafety}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Prescription:</span>
              <span className="text-slate-200">{registryRecord.rxOnly ? 'Rx Only (Hospital)' : 'OTC'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Raw JSON View (Expandable) */}
      {showJson && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">JSON Payload</span>
            <button
              onClick={() => handleCopy(JSON.stringify(result, null, 2), 'fullJson')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              {copiedField === 'fullJson' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy JSON</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-64 p-3 bg-black/60 rounded border border-slate-800">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
