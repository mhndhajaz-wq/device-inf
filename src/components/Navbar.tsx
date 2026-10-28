import React from 'react';
import {
  Stethoscope,
  Scan,
  CheckCircle2,
  BookOpen,
  Database,
  Printer,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export type TabType = 'scanner' | 'tests' | 'symbols' | 'registry';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  passedCount: number;
  totalCount: number;
  onOpenPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  passedCount,
  totalCount,
  onOpenPrint,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinical Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  MedLabel
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-mono font-medium">
                  UDI & OCR v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                ISO 15223-1 & FDA UDI Medical Device Label Verifier
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onSelectTab('scanner')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'scanner'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Scanner & Parser</span>
            </button>

            <button
              onClick={() => onSelectTab('tests')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tests'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Unit Tests</span>
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-full font-mono">
                {passedCount}/{totalCount}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('symbols')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'symbols'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">ISO 15223-1</span>
              <span>Symbols</span>
            </button>

            <button
              onClick={() => onSelectTab('registry')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'registry'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">GUDID</span>
              <span>Registry</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenPrint}
              title="Print Clinical Asset Tag & Work Order"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Asset Tag</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
