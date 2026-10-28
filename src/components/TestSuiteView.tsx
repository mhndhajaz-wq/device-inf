import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  Code2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Terminal,
  FileCode,
} from 'lucide-react';
import { runAllTests, TestCaseResult } from '../parser/testRunner';

interface TestSuiteViewProps {
  onLoadTestCase: (barcodes: string[], text: string) => void;
}

export const TestSuiteView: React.FC<TestSuiteViewProps> = ({ onLoadTestCase }) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>(() => runAllTests());
  const [expandedTestId, setExpandedTestId] = useState<string | null>('gs1Bracketed');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [isReRunning, setIsReRunning] = useState(false);

  const passedCount = testResults.filter(t => t.status === 'PASSED').length;
  const totalCount = testResults.length;
  const allPassed = passedCount === totalCount;
  const totalDuration = Math.round(testResults.reduce((acc, t) => acc + t.durationMs, 0) * 100) / 100;

  const handleReRun = () => {
    setIsReRunning(true);
    setTimeout(() => {
      setTestResults(runAllTests());
      setIsReRunning(false);
    }, 150);
  };

  const filteredTests = testResults.filter(t => {
    if (filter === 'passed') return t.status === 'PASSED';
    if (filter === 'failed') return t.status === 'FAILED';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Test Suite Summary Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
          <CheckCircle2 className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                Kotlin JUnit 4 Test Suite
              </span>
              <span className="text-xs font-mono text-slate-400">
                package com.example.meddevices.scan
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
              <span>LabelParserTest</span>
              {allPassed && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-sans font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  100% Pass Rate
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Verifies all 10 unit test cases for GS1 bracketed identifiers, raw DataMatrix with ASCII 29 group separators,
              plain barcode protection, full Mindray BeneVision OCR extraction, multi-line values, Arabic-Indic numerals,
              MFG company name disambiguation, year-only dates, EC REP exclusion, and barcode priority resolution.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {passedCount} / {totalCount}
              </span>
              <span className="text-[11px] text-slate-400 block">Tests Passing ({totalDuration}ms)</span>
            </div>

            <button
              onClick={handleReRun}
              disabled={isReRunning}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isReRunning ? 'animate-spin' : ''}`} />
              <span>{isReRunning ? 'Executing...' : 'Re-run All Tests'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-3">
          <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(passedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {Math.round((passedCount / totalCount) * 100)}%
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Tests ({testResults.length})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filter === 'passed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            Passed ({passedCount})
          </button>
          {totalCount - passedCount > 0 && (
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                filter === 'failed' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Failed ({totalCount - passedCount})
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Click any test to inspect assertions or load into Scanner
        </span>
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {filteredTests.map((t, idx) => {
          const isExpanded = expandedTestId === t.id;
          const isPassed = t.status === 'PASSED';

          return (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition hover:border-slate-700"
            >
              {/* Row Header */}
              <div
                onClick={() => setExpandedTestId(isExpanded ? null : t.id)}
                className="flex items-center justify-between p-4 cursor-pointer select-none bg-slate-900/90 hover:bg-slate-850"
              >
                <div className="flex items-center space-x-3">
                  {isPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        @{t.id}()
                      </span>
                      <span className="text-xs text-slate-300 font-medium">
                        — {t.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                    {t.durationMs}ms
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                      isPassed
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950/80 text-rose-300 border-rose-800'
                    }`}
                  >
                    {t.status}
                  </span>
                  <button className="text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-4">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      Assertion Breakdown ({t.assertions.length} checks)
                    </span>

                    <button
                      onClick={() => onLoadTestCase(t.inputs.barcodes, t.inputs.text)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium rounded-lg transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Load in Scanner</span>
                    </button>
                  </div>

                  {/* Assertion Items */}
                  <div className="space-y-1.5">
                    {t.assertions.map((a, aIdx) => (
                      <div
                        key={aIdx}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-start justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {a.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                            )}
                            <code className="font-mono text-slate-200">{a.statement}</code>
                          </div>
                          <div className="text-[11px] text-slate-400 pl-5 font-mono">
                            Expected: <span className="text-emerald-400">{a.expected}</span> | Actual:{' '}
                            <span className={a.passed ? 'text-emerald-400' : 'text-rose-400'}>{a.actual}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            a.passed
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border-rose-800'
                          }`}
                        >
                          {a.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Original Kotlin Source Code */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-cyan-400" />
                      Original Kotlin JUnit 4 Code:
                    </span>
                    <pre className="p-3 bg-black/70 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300/90 overflow-x-auto">
                      {t.kotlinCode}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
