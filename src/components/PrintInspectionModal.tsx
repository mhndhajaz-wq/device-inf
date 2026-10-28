import React from 'react';
import { X, Printer, Stethoscope, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ParseResult } from '../types/label';

interface PrintInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ParseResult;
}

export const PrintInspectionModal: React.FC<PrintInspectionModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Clinical Engineering Inspection & Asset Work-Order
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-8 space-y-6 print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-6 h-6 text-cyan-600" />
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  CLINICAL ENGINEERING DEPARTMENT
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Medical Device Incoming Inspection & UDI Verification Tag
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-500 block">Form ID: BME-UDI-2026</span>
              <span className="text-xs font-bold text-slate-800">
                DATE: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Asset Badge & Barcode Simulation */}
          <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Hospital Asset Tracking Tag
              </span>
              <div className="text-lg font-mono font-bold text-slate-900 tracking-wider">
                AST-{result.serial?.value || 'UNASSIGNED'}
              </div>
              <span className="text-xs text-slate-600 font-medium">
                {result.manufacturer?.value || 'Unknown Manufacturer'} — {result.model?.value || 'Medical Device'}
              </span>
            </div>

            <div className="text-right font-mono text-xs">
              <span className="text-[10px] text-slate-500 block">PRIMARY UDI-DI (GTIN)</span>
              <span className="font-bold text-slate-900">{result.gtin || 'NOT APPLICABLE'}</span>
              <span className="text-[10px] text-slate-500 block mt-1">LOT / BATCH</span>
              <span className="font-bold text-slate-900">{result.lotCode?.value || 'N/A'}</span>
            </div>
          </div>

          {/* Technical Verification Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
              1. Regulatory & Label Identification (ISO 15223-1)
            </h3>
            <table className="w-full text-xs border border-slate-200">
              <tbody>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-2 font-medium text-slate-600 w-1/3">Legal Manufacturer</td>
                  <td className="p-2 font-bold text-slate-900">{result.manufacturer?.value || 'N/A'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 font-medium text-slate-600">Model / Product Family</td>
                  <td className="p-2 font-bold text-slate-900">{result.model?.value || 'N/A'}</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-2 font-medium text-slate-600">Serial Number (SN)</td>
                  <td className="p-2 font-mono font-bold text-slate-900">
                    {result.serial?.value || 'N/A'} ({result.serial?.source || 'UNSPECIFIED'})
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 font-medium text-slate-600">Manufacture Date</td>
                  <td className="p-2 font-mono font-bold text-slate-900">
                    {result.manufactureDate?.value ? result.manufactureDate.value.toString() : 'N/A'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-2 font-medium text-slate-600">Expiration Date</td>
                  <td className="p-2 font-mono font-bold text-slate-900">
                    {result.expirationDate?.value ? result.expirationDate.value.toString() : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-slate-600">European Authorized Rep (EC REP)</td>
                  <td className="p-2 text-slate-800">{result.ecRep?.value || 'None'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification Status & Warnings */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
              2. Clinical Discrepancy & Safety Audit
            </h3>
            {result.warnings.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification passed. No discrepancies between physical barcode and OCR label text.</span>
              </div>
            ) : (
              <div className="space-y-1">
                {result.warnings.map((w, i) => (
                  <div key={i} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{w}</span>
                      <p className="text-[11px] text-amber-800">
                        Physical audit required prior to patient-connected clinical release.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Biomedical Sign-Off Section */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
            <div>
              <span className="font-bold text-slate-800 block mb-4">Inspected & Verified By:</span>
              <div className="border-b border-slate-400 pb-1 font-mono text-slate-700">
                ainalhayat.bme@gmail.com
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Biomedical Engineering Specialist</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 block mb-4">Clinical Department Release:</span>
              <div className="border-b border-slate-400 pb-1 text-slate-400">
                [ APPROVED & TAGGED ]
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Signature & Date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
