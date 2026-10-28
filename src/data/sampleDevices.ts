/**
 * Preset Medical Device Label Fixtures for Testing & Demonstration
 */

export interface SampleDevice {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  barcodes: string[];
  text: string;
  description: string;
  badge: string;
}

export const SAMPLE_DEVICES: SampleDevice[] = [
  {
    id: 'mindray-n17',
    name: 'Mindray BeneVision N17 Patient Monitor',
    category: 'Patient Monitoring',
    manufacturer: 'Shenzhen Mindray Bio-Medical Electronics Co., Ltd.',
    barcodes: ['(01)06944983000012(11)220801(10)20230A1(21)FA-12345678'],
    text: `Mindray
Manufacturer: Shenzhen Mindray Bio-Medical Electronics Co., Ltd.
Model: BeneVision N17
SN: FA-12345678
LOT 20230A1
Date of manufacture: 2022-08
EXP: 2027-08`,
    description: 'Standard full ICU monitor label from LabelParserTest with matching GS1 DataMatrix UDI and OCR text.',
    badge: 'Full Test Case #4',
  },
  {
    id: 'gs1-bracketed',
    name: 'GS1 Bracketed UDI Test Fixture',
    category: 'UDI Verification',
    manufacturer: 'Acme Medical Devices',
    barcodes: ['(01)04012345678901(11)230115(10)LOT4821(21)SN998877'],
    text: `Acme Medical Inc.
Model: Cardinal Series
LOT: LOT4821
Serial Number: SN998877`,
    description: 'GS1-128 / DataMatrix bracketed format with GTIN (01), Prod Date (11), Lot (10), and SN (21).',
    badge: 'Test Case #1',
  },
  {
    id: 'gs1-raw-gs',
    name: 'Raw GS1 DataMatrix with Group Separator',
    category: '2D Barcode',
    manufacturer: 'Surgical Precision Corp',
    barcodes: ['01040123456789011123011510LOT4821\u001D21SN998877'],
    text: `Model: Precision Scalpel
Serial Number: SN998877`,
    description: 'Raw scanner output with ASCII 29 (\\u001D) Group Separator between variable length AI (10) and (21).',
    badge: 'Test Case #2',
  },
  {
    id: 'conflict-warning',
    name: 'Discrepancy Conflict Alert (Warning.SERIAL_MISMATCH)',
    category: 'Safety Warning',
    manufacturer: 'Apex Medical Systems',
    barcodes: ['(01)04012345678901(21)ABC12345'],
    text: `Apex Medical Systems
Model: Defibrillator D3
SN: XYZ99999
Date of manufacture: 2024-02`,
    description: 'Tests clinical disagreement: Barcode SN is ABC12345 while OCR label is XYZ99999. Barcode wins, warning raised.',
    badge: 'Test Case #10',
  },
  {
    id: 'arabic-indic',
    name: 'Middle East Device Label (Arabic-Indic Digits)',
    category: 'Internationalization',
    manufacturer: 'Gulf Health Tech',
    barcodes: ['(01)06281001234567(21)12345'],
    text: `Gulf Health Tech
MFG: ٢٠٢١/٠٣
SN: 12345
Model: PulseOximeter PO-200`,
    description: 'Arabic-Indic numerals (٢٠٢١/٠٣) normalized to 2021/03 and parsed into PartialDate(2021, 3).',
    badge: 'Test Case #6',
  },
  {
    id: 'philips-mfg-name',
    name: 'Philips IntelliVue MX800 (MFG Disambiguation)',
    category: 'Patient Monitoring',
    manufacturer: 'Philips Medical Systems',
    barcodes: ['(01)08712281000543(21)PH-883921(11)210610'],
    text: `MFG: Philips Medical Systems
Model: IntelliVue MX800
REF: M8105A
SN: PH-883921`,
    description: 'Tests that "MFG: Philips Medical Systems" is parsed as legal manufacturer name, not a manufacture date.',
    badge: 'Test Case #7',
  },
  {
    id: 'ce-mdr-ecrep',
    name: 'European MDR Label with EC REP',
    category: 'Regulatory (EU MDR)',
    manufacturer: 'Acme Medical Inc.',
    barcodes: ['(01)00840192837465(10)BATCH9921(21)ACME-4455'],
    text: `EC REP Medical Partner GmbH
Acme Medical Inc.
Model: Endoscope Camera
SN: ACME-4455
Date of manufacture: 2023-11`,
    description: 'Suppresses EC REP (Medical Partner GmbH) and accurately guesses legal manufacturer (Acme Medical Inc.).',
    badge: 'Test Case #9',
  },
  {
    id: 'multiline-header',
    name: 'Multi-line Label (Header On Line 1, Value On Line 2)',
    category: 'OCR Formatting',
    manufacturer: 'Stryker Surgical',
    barcodes: [],
    text: `Manufacturer: Stryker Corporation
Model: System 8 Drill
Serial Number
AB123456
LOT
BATCH-902
Year of Manufacture: 2019`,
    description: 'Tests "valueOnNextLine" and "yearOnlyStaysYearOnly" (PartialDate(2019)).',
    badge: 'Test Case #5 & #8',
  },
  {
    id: 'plain-barcode',
    name: 'Internal Hospital Asset Tag (Plain Barcode)',
    category: 'Inventory Tag',
    manufacturer: 'General Hospital BioMed Department',
    barcodes: ['2100123456'],
    text: `General Hospital Biomedical Engineering
Asset ID: 2100123456
Device: Infusion Pump
Location: ICU Room 4`,
    description: 'Guarantees that a plain barcode "2100123456" is NOT mistaken for GS1 AI 21, and is saved in barcodeCandidates.',
    badge: 'Test Case #3',
  },
];
