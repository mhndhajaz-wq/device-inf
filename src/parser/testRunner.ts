/**
 * Test Runner replicating the exact JUnit test suite:
 * com.example.meddevices.scan.LabelParserTest
 */

import { PartialDate, Source, Warning, ParseResult } from '../types/label';
import { Gs1Parser } from './gs1';
import { LabelParser } from './label';

export interface AssertionResult {
  statement: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  kotlinCode: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  error?: string;
  assertions: AssertionResult[];
  inputs: {
    barcodes: string[];
    text: string;
  };
  output: ParseResult;
}

function formatVal(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'null';
  if (v instanceof PartialDate) {
    return `PartialDate(${v.year}${v.month ? `, ${v.month}` : ''}${v.day ? `, ${v.day}` : ''})`;
  }
  if (typeof v === 'object' && v !== null && 'year' in v) {
    const pd = v as PartialDate;
    return `PartialDate(${pd.year}${pd.month ? `, ${pd.month}` : ''}${pd.day ? `, ${pd.day}` : ''})`;
  }
  if (Array.isArray(v)) {
    return `[${v.map(formatVal).join(', ')}]`;
  }
  return JSON.stringify(v);
}

function checkEquals(actual: unknown, expected: unknown): boolean {
  if (expected === null || expected === undefined) {
    return actual === null || actual === undefined;
  }
  if (expected instanceof PartialDate) {
    return expected.equals(actual);
  }
  if (typeof expected === 'object' && expected !== null && 'year' in expected) {
    return new PartialDate((expected as any).year, (expected as any).month, (expected as any).day).equals(actual);
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false;
    return expected.every((item, i) => checkEquals(actual[i], item));
  }
  return actual === expected;
}

export function runAllTests(): TestCaseResult[] {
  const tests: TestCaseResult[] = [];

  // 1. gs1Bracketed
  {
    const start = performance.now();
    const barcodes = ['(01)04012345678901(11)230115(10)LOT4821(21)SN998877'];
    const text = '';
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals("LOT4821", r.lotCode?.value)',
        expected: '"LOT4821"',
        actual: formatVal(r.lotCode?.value),
        passed: checkEquals(r.lotCode?.value, 'LOT4821'),
      },
      {
        statement: 'assertEquals("SN998877", r.serial?.value)',
        expected: '"SN998877"',
        actual: formatVal(r.serial?.value),
        passed: checkEquals(r.serial?.value, 'SN998877'),
      },
      {
        statement: 'assertEquals(PartialDate(2023, 1, 15), r.manufactureDate?.value)',
        expected: 'PartialDate(2023, 1, 15)',
        actual: formatVal(r.manufactureDate?.value),
        passed: checkEquals(r.manufactureDate?.value, new PartialDate(2023, 1, 15)),
      },
      {
        statement: 'assertEquals(Source.BARCODE, r.serial?.source)',
        expected: 'Source.BARCODE',
        actual: formatVal(r.serial?.source),
        passed: checkEquals(r.serial?.source, Source.BARCODE),
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'gs1Bracketed',
      name: 'GS1 Bracketed AIs',
      description: 'Parses bracketed GS1 string with GTIN (01), Prod Date (11), Lot (10), and Serial (21)',
      kotlinCode: `@Test
fun gs1Bracketed() {
    val r = LabelParser.parse(listOf("(01)04012345678901(11)230115(10)LOT4821(21)SN998877"), "")
    assertEquals("LOT4821", r.lotCode?.value)
    assertEquals("SN998877", r.serial?.value)
    assertEquals(PartialDate(2023, 1, 15), r.manufactureDate?.value)
    assertEquals(Source.BARCODE, r.serial?.source)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 2. gs1RawWithGroupSeparator
  {
    const start = performance.now();
    const raw = '0104012345678901' + '11230115' + '10LOT4821' + '\u001D' + '21SN998877';
    const barcodes = [raw];
    const text = '';
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals("LOT4821", r.lotCode?.value)',
        expected: '"LOT4821"',
        actual: formatVal(r.lotCode?.value),
        passed: checkEquals(r.lotCode?.value, 'LOT4821'),
      },
      {
        statement: 'assertEquals("SN998877", r.serial?.value)',
        expected: '"SN998877"',
        actual: formatVal(r.serial?.value),
        passed: checkEquals(r.serial?.value, 'SN998877'),
      },
      {
        statement: 'assertEquals("04012345678901", r.gtin)',
        expected: '"04012345678901"',
        actual: formatVal(r.gtin),
        passed: checkEquals(r.gtin, '04012345678901'),
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'gs1RawWithGroupSeparator',
      name: 'GS1 Raw with Group Separator (FNC1)',
      description: 'Parses raw unbracketed GS1 with ASCII Group Separator (\\u001D) between variable fields',
      kotlinCode: `@Test
fun gs1RawWithGroupSeparator() {
    val raw = "0104012345678901" + "11230115" + "10LOT4821" + "\\u001D" + "21SN998877"
    val r = LabelParser.parse(listOf(raw), "")
    assertEquals("LOT4821", r.lotCode?.value)
    assertEquals("SN998877", r.serial?.value)
    assertEquals("04012345678901", r.gtin)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 3. plainBarcodeIsNotMistakenForGs1
  {
    const start = performance.now();
    const rawVal = '2100123456';
    const gs1Parsed = Gs1Parser.parse(rawVal);
    const barcodes = [rawVal];
    const text = '';
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertNull(Gs1Parser.parse("2100123456"))',
        expected: 'null',
        actual: formatVal(gs1Parsed),
        passed: gs1Parsed === null,
      },
      {
        statement: 'assertNull(r.serial)',
        expected: 'null',
        actual: formatVal(r.serial),
        passed: r.serial === null,
      },
      {
        statement: 'assertEquals(listOf("2100123456"), r.barcodeCandidates)',
        expected: '["2100123456"]',
        actual: formatVal(r.barcodeCandidates),
        passed: checkEquals(r.barcodeCandidates, ['2100123456']),
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'plainBarcodeIsNotMistakenForGs1',
      name: 'Plain Barcode Guard',
      description: 'Ensures standard Code 128 / Code 39 barcodes starting with 21 are not falsely parsed as GS1',
      kotlinCode: `@Test
fun plainBarcodeIsNotMistakenForGs1() {
    assertNull(Gs1Parser.parse("2100123456"))
    val r = LabelParser.parse(listOf("2100123456"), "")
    assertNull(r.serial)
    assertEquals(listOf("2100123456"), r.barcodeCandidates)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 4. ocrFullLabel
  {
    const start = performance.now();
    const text = `Mindray
Manufacturer: Shenzhen Mindray Bio-Medical Electronics Co., Ltd.
Model: BeneVision N17
SN: FA-12345678
LOT 20230A1
Date of manufacture: 2022-08
EXP: 2027-08`;
    const barcodes: string[] = [];
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals("Shenzhen Mindray Bio-Medical Electronics Co., Ltd.", r.manufacturer?.value)',
        expected: '"Shenzhen Mindray Bio-Medical Electronics Co., Ltd."',
        actual: formatVal(r.manufacturer?.value),
        passed: checkEquals(r.manufacturer?.value, 'Shenzhen Mindray Bio-Medical Electronics Co., Ltd.'),
      },
      {
        statement: 'assertEquals(false, r.manufacturer?.guessed)',
        expected: 'false',
        actual: formatVal(r.manufacturer?.guessed),
        passed: checkEquals(r.manufacturer?.guessed, false),
      },
      {
        statement: 'assertEquals("BeneVision", r.model?.value)',
        expected: '"BeneVision"',
        actual: formatVal(r.model?.value),
        passed: checkEquals(r.model?.value, 'BeneVision'),
      },
      {
        statement: 'assertEquals("FA-12345678", r.serial?.value)',
        expected: '"FA-12345678"',
        actual: formatVal(r.serial?.value),
        passed: checkEquals(r.serial?.value, 'FA-12345678'),
      },
      {
        statement: 'assertEquals("20230A1", r.lotCode?.value)',
        expected: '"20230A1"',
        actual: formatVal(r.lotCode?.value),
        passed: checkEquals(r.lotCode?.value, '20230A1'),
      },
      {
        statement: 'assertEquals(PartialDate(2022, 8), r.manufactureDate?.value)',
        expected: 'PartialDate(2022, 8)',
        actual: formatVal(r.manufactureDate?.value),
        passed: checkEquals(r.manufactureDate?.value, new PartialDate(2022, 8)),
      },
      {
        statement: 'assertTrue(r.otherDates.isEmpty())',
        expected: 'true (empty list)',
        actual: `${r.otherDates.length === 0} (length: ${r.otherDates.length})`,
        passed: r.otherDates.length === 0,
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'ocrFullLabel',
      name: 'Full OCR Label Extraction',
      description: 'Extracts Mindray BeneVision label with manufacturer, model, SN, LOT, MFG date, and EXP',
      kotlinCode: `@Test
fun ocrFullLabel() {
    val text = """
        Mindray
        Manufacturer: Shenzhen Mindray Bio-Medical Electronics Co., Ltd.
        Model: BeneVision N17
        SN: FA-12345678
        LOT 20230A1
        Date of manufacture: 2022-08
        EXP: 2027-08
    """.trimIndent()
    val r = LabelParser.parse(emptyList(), text)
    assertEquals("Shenzhen Mindray Bio-Medical Electronics Co., Ltd.", r.manufacturer?.value)
    assertEquals(false, r.manufacturer?.guessed)
    assertEquals("BeneVision", r.model?.value)
    assertEquals("FA-12345678", r.serial?.value)
    assertEquals("20230A1", r.lotCode?.value)
    assertEquals(PartialDate(2022, 8), r.manufactureDate?.value)
    assertTrue(r.otherDates.isEmpty())
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 5. valueOnNextLine
  {
    const start = performance.now();
    const text = 'Serial Number\nAB123456';
    const barcodes: string[] = [];
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals("AB123456", r.serial?.value)',
        expected: '"AB123456"',
        actual: formatVal(r.serial?.value),
        passed: checkEquals(r.serial?.value, 'AB123456'),
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'valueOnNextLine',
      name: 'Value On Next Line (Multi-line Header)',
      description: 'Captures serial number when header label is on one line and value is on the following line',
      kotlinCode: `@Test
fun valueOnNextLine() {
    val r = LabelParser.parse(emptyList(), "Serial Number\\nAB123456")
    assertEquals("AB123456", r.serial?.value)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 6. arabicIndicDigits
  {
    const start = performance.now();
    const text = 'MFG: ٢٠٢١/٠٣\nSN: 12345';
    const barcodes: string[] = [];
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals(PartialDate(2021, 3), r.manufactureDate?.value)',
        expected: 'PartialDate(2021, 3)',
        actual: formatVal(r.manufactureDate?.value),
        passed: checkEquals(r.manufactureDate?.value, new PartialDate(2021, 3)),
      },
      {
        statement: 'assertEquals("12345", r.serial?.value)',
        expected: '"12345"',
        actual: formatVal(r.serial?.value),
        passed: checkEquals(r.serial?.value, '12345'),
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'arabicIndicDigits',
      name: 'Arabic-Indic Digits Normalization',
      description: 'Translates Arabic-Indic numerals (٢٠٢١/٠٣) to 2021/03 and parses manufacture date and serial',
      kotlinCode: `@Test
fun arabicIndicDigits() {
    val r = LabelParser.parse(emptyList(), "MFG: ٢٠٢١/٠٣\\nSN: 12345")
    assertEquals(PartialDate(2021, 3), r.manufactureDate?.value)
    assertEquals("12345", r.serial?.value)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 7. mfgFollowedByNameIsManufacturer
  {
    const start = performance.now();
    const text = 'MFG: Philips Medical Systems';
    const barcodes: string[] = [];
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals("Philips Medical Systems", r.manufacturer?.value)',
        expected: '"Philips Medical Systems"',
        actual: formatVal(r.manufacturer?.value),
        passed: checkEquals(r.manufacturer?.value, 'Philips Medical Systems'),
      },
      {
        statement: 'assertNull(r.manufactureDate)',
        expected: 'null',
        actual: formatVal(r.manufactureDate),
        passed: r.manufactureDate === null,
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'mfgFollowedByNameIsManufacturer',
      name: 'MFG Disambiguation (Company vs Date)',
      description: 'Treats MFG followed by company name as legal manufacturer, keeping manufactureDate null',
      kotlinCode: `@Test
fun mfgFollowedByNameIsManufacturer() {
    val r = LabelParser.parse(emptyList(), "MFG: Philips Medical Systems")
    assertEquals("Philips Medical Systems", r.manufacturer?.value)
    assertNull(r.manufactureDate)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 8. yearOnlyStaysYearOnly
  {
    const start = performance.now();
    const text = 'Year of Manufacture: 2019';
    const barcodes: string[] = [];
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals(PartialDate(2019), r.manufactureDate?.value)',
        expected: 'PartialDate(2019)',
        actual: formatVal(r.manufactureDate?.value),
        passed: checkEquals(r.manufactureDate?.value, new PartialDate(2019)),
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'yearOnlyStaysYearOnly',
      name: 'Year-Only Date Precision',
      description: 'Preserves partial date without fabricating month or day when only manufacture year is given',
      kotlinCode: `@Test
fun yearOnlyStaysYearOnly() {
    val r = LabelParser.parse(emptyList(), "Year of Manufacture: 2019")
    assertEquals(PartialDate(2019), r.manufactureDate?.value)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 9. authorizedRepIsNotTheManufacturer
  {
    const start = performance.now();
    const text = 'EC REP Medical Partner GmbH\nAcme Medical Inc.';
    const barcodes: string[] = [];
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals("Acme Medical Inc.", r.manufacturer?.value)',
        expected: '"Acme Medical Inc."',
        actual: formatVal(r.manufacturer?.value),
        passed: checkEquals(r.manufacturer?.value, 'Acme Medical Inc.'),
      },
      {
        statement: 'assertEquals(true, r.manufacturer?.guessed)',
        expected: 'true',
        actual: formatVal(r.manufacturer?.guessed),
        passed: checkEquals(r.manufacturer?.guessed, true),
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'authorizedRepIsNotTheManufacturer',
      name: 'EC REP Suppression & Manufacturer Guessing',
      description: 'Suppresses EC REP from manufacturer assignment and guesses actual legal manufacturer (Acme Medical Inc.)',
      kotlinCode: `@Test
fun authorizedRepIsNotTheManufacturer() {
    val r = LabelParser.parse(emptyList(), "EC REP Medical Partner GmbH\\nAcme Medical Inc.")
    assertEquals("Acme Medical Inc.", r.manufacturer?.value)
    assertEquals(true, r.manufacturer?.guessed)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  // 10. barcodeAndTextDisagreementRaisesWarning
  {
    const start = performance.now();
    const barcodes = ['(01)04012345678901(21)ABC12345'];
    const text = 'SN: XYZ99999';
    const r = LabelParser.parse(barcodes, text);
    const assertions: AssertionResult[] = [
      {
        statement: 'assertEquals("ABC12345", r.serial?.value)',
        expected: '"ABC12345"',
        actual: formatVal(r.serial?.value),
        passed: checkEquals(r.serial?.value, 'ABC12345'),
      },
      {
        statement: 'assertTrue(Warning.SERIAL_MISMATCH in r.warnings)',
        expected: 'Warning.SERIAL_MISMATCH in warnings',
        actual: `${r.warnings.includes(Warning.SERIAL_MISMATCH)} (${r.warnings.join(', ')})`,
        passed: r.warnings.includes(Warning.SERIAL_MISMATCH),
      },
    ];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    tests.push({
      id: 'barcodeAndTextDisagreementRaisesWarning',
      name: 'Barcode vs OCR Priority & Disagreement Warning',
      description: 'Prioritizes barcode serial (ABC12345) over OCR (XYZ99999) and flags Warning.SERIAL_MISMATCH',
      kotlinCode: `@Test
fun barcodeAndTextDisagreementRaisesWarning() {
    val r = LabelParser.parse(
        listOf("(01)04012345678901(21)ABC12345"),
        "SN: XYZ99999"
    )
    assertEquals("ABC12345", r.serial?.value) // الباركود له الأولوية
    assertTrue(Warning.SERIAL_MISMATCH in r.warnings)
}`,
      status: assertions.every(a => a.passed) ? 'PASSED' : 'FAILED',
      durationMs,
      assertions,
      inputs: { barcodes, text },
      output: r,
    });
  }

  return tests;
}
