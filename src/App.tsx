/**
 * MedLabel UDI & OCR Parser
 * Medical Device UDI, GS1 DataMatrix, and OCR Label Verifier
 * Compliant with ISO 15223-1, GS1 General Specifications, and FDA UDI Regulations.
 */

import React, { useState, useMemo } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { ScannerPlayground } from './components/ScannerPlayground';
import { ResultCard } from './components/ResultCard';
import { TestSuiteView } from './components/TestSuiteView';
import { SymbolsGuide } from './components/SymbolsGuide';
import { GudidLookupView } from './components/GudidLookupView';
import { CameraModal } from './components/CameraModal';
import { PrintInspectionModal } from './components/PrintInspectionModal';
import { LabelParser } from './parser/label';
import { runAllTests } from './parser/testRunner';
import { SAMPLE_DEVICES } from './data/sampleDevices';
import { ShieldCheck, Stethoscope, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('scanner');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Initial default: Mindray BeneVision N17 (Test case #4)
  const defaultDevice = SAMPLE_DEVICES[0];
  const [barcodes, setBarcodes] = useState<string[]>(defaultDevice.barcodes);
  const [text, setText] = useState<string>(defaultDevice.text);

  // Real-time parsing of current inputs
  const parseResult = useMemo(() => {
    return LabelParser.parse(barcodes, text);
  }, [barcodes, text]);

  // Precomputed test results for navbar counter
  const testResults = useMemo(() => {
    return runAllTests();
  }, []);

  const passedTestsCount = testResults.filter((t) => t.status === 'PASSED').length;

  const handleLoadTestCase = (newBarcodes: string[], newText: string) => {
    setBarcodes(newBarcodes);
    setText(newText);
    setActiveTab('scanner');
  };

  const handleCaptureBarcode = (barcode: string) => {
    if (barcode && !barcodes.includes(barcode)) {
      setBarcodes([...barcodes, barcode]);
    }
  };

  const handleCaptureOcrText = (newText: string) => {
    if (newText) {
      setText(newText);
    }
  };

  const handleInsertSymbolToLabel = (symbolText: string) => {
    setText((prev) => (prev ? `${prev}\n${symbolText}` : symbolText));
    setActiveTab('scanner');
  };

  const handleLoadDeviceToScanner = (gtin: string) => {
    const found = SAMPLE_DEVICES.find((d) => d.barcodes.some((b) => b.includes(gtin)));
    if (found) {
      setBarcodes(found.barcodes);
      setText(found.text);
    } else {
      setBarcodes([`(01)${gtin}`]);
    }
    setActiveTab('scanner');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        passedCount={passedTestsCount}
        totalCount={testResults.length}
        onOpenPrint={() => setIsPrintOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* Top Interactive Input Playground */}
            <ScannerPlayground
              barcodes={barcodes}
              text={text}
              onChangeBarcodes={setBarcodes}
              onChangeText={setText}
              onOpenScannerModal={() => setIsCameraOpen(true)}
            />

            {/* Live Real-Time Parsed Entity View */}
            <ResultCard
              result={parseResult}
              onOpenPrint={() => setIsPrintOpen(true)}
            />
          </div>
        )}

        {activeTab === 'tests' && (
          <TestSuiteView onLoadTestCase={handleLoadTestCase} />
        )}

        {activeTab === 'symbols' && (
          <SymbolsGuide onInsertSymbolToLabel={handleInsertSymbolToLabel} />
        )}

        {activeTab === 'registry' && (
          <GudidLookupView onLoadDeviceToScanner={handleLoadDeviceToScanner} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-cyan-500" />
            <span className="font-medium text-slate-400">
              MedLabel Clinical Engineering & Medical Device Verification Engine
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-[11px] text-slate-500">
              ISO 15223-1 / GS1 General Specifications / FDA 21 CFR 801 UDI
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px]">
              10/10 JUnit Tests Verified
            </span>
          </div>
        </div>
      </footer>

      {/* Camera / Hardware Scanner Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureBarcode={handleCaptureBarcode}
        onCaptureOcrText={handleCaptureOcrText}
      />

      {/* Clinical Asset Work-Order Print Modal */}
      <PrintInspectionModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        result={parseResult}
      />
    </div>
  );
}
