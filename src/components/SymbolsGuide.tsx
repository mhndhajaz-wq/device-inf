import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Plus,
  Tag,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Factory,
  Hourglass,
  Box,
  Hash,
  QrCode,
  Ban,
} from 'lucide-react';
import { ISO_SYMBOLS, IsoSymbol } from '../data/isoSymbols';

interface SymbolsGuideProps {
  onInsertSymbolToLabel: (symbolText: string) => void;
}

export const SymbolsGuide: React.FC<SymbolsGuideProps> = ({ onInsertSymbolToLabel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const categories = ['all', 'Identification', 'Dates', 'Regulatory', 'Safety'];

  const filteredSymbols = ISO_SYMBOLS.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.clinicalSignificance.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.isoReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
            Medical Device Regulatory Standard
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ISO 15223-1:2021 / EN ISO 15223-1
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1.5">
          ISO 15223-1 Labeling Symbols Reference
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Standardized symbols for medical device labeling under EU MDR 2017/745, IVDR 2017/746, and US FDA 21 CFR 801.15.
          Clinical and biomedical engineers rely on these exact symbols to prevent misidentification during asset onboarding.
        </p>

        {/* Search & Filters */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbols by name, clause, or clinical use..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Symbols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSymbols.map((s) => (
          <div
            key={s.code}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {s.glyph.split(' ')[0]}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{s.name}</h3>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {s.isoReference}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {s.category}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {s.description}
              </p>

              <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300 block mb-0.5">
                  Clinical & Biomedical Significance:
                </span>
                {s.clinicalSignificance}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400">
                Label Format: <code className="text-cyan-300">{s.glyph.split(' ')[1] || s.glyph}</code>
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handleCopy(s.glyph.split(' ')[1] || s.name, s.code)}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                  title="Copy symbol text"
                >
                  {copiedCode === s.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => onInsertSymbolToLabel(`${s.glyph.split(' ')[1] || s.name}: `)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium rounded-lg transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Insert to OCR</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
