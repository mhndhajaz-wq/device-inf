import React, { useState } from 'react';
import { Database, Search, ExternalLink, ShieldCheck, Check, Copy } from 'lucide-react';
import { REGISTRY_DATABASE, RegistryRecord } from '../data/deviceCatalog';

interface GudidLookupViewProps {
  onLoadDeviceToScanner: (gtin: string) => void;
}

export const GudidLookupView: React.FC<GudidLookupViewProps> = ({ onLoadDeviceToScanner }) => {
  const [query, setQuery] = useState('');
  const [copiedGtin, setCopiedGtin] = useState<string | null>(null);

  const records = Object.values(REGISTRY_DATABASE).filter((r) => {
    return (
      r.brandName.toLowerCase().includes(query.toLowerCase()) ||
      r.companyName.toLowerCase().includes(query.toLowerCase()) ||
      r.versionModel.toLowerCase().includes(query.toLowerCase()) ||
      r.gtin.includes(query) ||
      r.gmdnName.toLowerCase().includes(query.toLowerCase())
    );
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGtin(text);
    setTimeout(() => setCopiedGtin(null), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
            FDA & EU Medical Device Database
          </span>
          <span className="text-xs text-slate-400 font-mono">
            AccessGUDID & EUDAMED Sync
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1.5">
          Global UDI Device Registry Database
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Search registered medical equipment by Primary DI (GTIN-14), brand name, model family, or GMDN code.
          Verify FDA risk classifications (Class I, II, III), premarket clearance numbers, and MRI safety before clinical deployment.
        </p>

        {/* Search */}
        <div className="mt-5 pt-4 border-t border-slate-800 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-6" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by GTIN, device name (e.g. Mindray BeneVision, Philips IntelliVue)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3.5">
        {records.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <p className="text-xs">No devices found matching &quot;{query}&quot;.</p>
          </div>
        ) : (
          records.map((rec) => (
            <div
              key={rec.gtin}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      GTIN: {rec.gtin}
                    </span>
                    <button
                      onClick={() => handleCopy(rec.gtin)}
                      className="text-slate-400 hover:text-white"
                      title="Copy GTIN"
                    >
                      {copiedGtin === rec.gtin ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                      {rec.deviceClass}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {rec.brandName} — {rec.versionModel}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {rec.companyName}
                  </p>
                </div>

                <button
                  onClick={() => onLoadDeviceToScanner(rec.gtin)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium rounded-lg transition self-start sm:self-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Load in Scanner</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">GMDN Nomenclature</span>
                  <span className="text-slate-200">{rec.gmdnName}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">FDA 510(k) Clearance</span>
                  <span className="text-cyan-300 font-mono">{rec.premarketSubmission}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">MRI Safety Status</span>
                  <span className="text-amber-400 font-medium">{rec.mriSafety}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Sterility & Dispensing</span>
                  <span className="text-slate-200">
                    {rec.sterile ? 'Sterile' : 'Non-Sterile'} | {rec.rxOnly ? 'Prescription' : 'OTC'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
