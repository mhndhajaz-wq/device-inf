/**
 * Types and classes for Medical Device Label & UDI Parser
 * Conforms to ISO 15223-1, GS1 General Specifications, and FDA UDI Regulations.
 */

export class PartialDate {
  readonly year: number;
  readonly month: number | null;
  readonly day: number | null;

  constructor(year: number, month?: number | null, day?: number | null) {
    this.year = year;
    this.month = month !== undefined ? month : null;
    this.day = day !== undefined ? day : null;
  }

  equals(other: unknown): boolean {
    if (!other) return false;
    if (other instanceof PartialDate) {
      return (
        this.year === other.year &&
        this.month === other.month &&
        this.day === other.day
      );
    }
    if (typeof other === 'object' && 'year' in other) {
      const o = other as { year: number; month?: number | null; day?: number | null };
      return (
        this.year === o.year &&
        (this.month ?? null) === (o.month ?? null) &&
        (this.day ?? null) === (o.day ?? null)
      );
    }
    return false;
  }

  toString(): string {
    const y = String(this.year).padStart(4, '0');
    if (this.month === null) return y;
    const m = String(this.month).padStart(2, '0');
    if (this.day === null) return `${y}-${m}`;
    const d = String(this.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  toDate(): Date {
    return new Date(this.year, (this.month ?? 1) - 1, this.day ?? 1);
  }

  isPast(referenceDate: Date = new Date()): boolean {
    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth() + 1;
    const refDay = referenceDate.getDate();

    if (this.year < refYear) return true;
    if (this.year > refYear) return false;
    if (this.month !== null) {
      if (this.month < refMonth) return true;
      if (this.month > refMonth) return false;
    }
    if (this.day !== null) {
      if (this.day < refDay) return true;
    }
    return false;
  }
}

export enum Source {
  BARCODE = 'BARCODE',
  OCR = 'OCR',
  MANUAL = 'MANUAL',
}

export enum Warning {
  SERIAL_MISMATCH = 'SERIAL_MISMATCH',
  LOT_MISMATCH = 'LOT_MISMATCH',
  DATE_DISCREPANCY = 'DATE_DISCREPANCY',
  EXPIRED_DEVICE = 'EXPIRED_DEVICE',
  SUSPICIOUS_MANUFACTURER = 'SUSPICIOUS_MANUFACTURER',
  ARABIC_INDIC_NORMALIZED = 'ARABIC_INDIC_NORMALIZED',
  GTIN_CHECKSUM_INVALID = 'GTIN_CHECKSUM_INVALID',
  BARCODE_SYNTAX_ERROR = 'BARCODE_SYNTAX_ERROR',
}

export interface ParsedValue<T> {
  value: T;
  source: Source;
  guessed?: boolean;
  raw?: string;
  confidence?: number;
  ai?: string; // e.g. "01", "21", "10", "11", "17" if from GS1
}

export interface Gs1Element {
  ai: string;
  title: string;
  rawValue: string;
  parsedValue: unknown;
}

export interface ParseResult {
  gtin: string | null;
  serial: ParsedValue<string> | null;
  lotCode: ParsedValue<string> | null;
  manufactureDate: ParsedValue<PartialDate> | null;
  expirationDate: ParsedValue<PartialDate> | null;
  manufacturer: (ParsedValue<string> & { guessed?: boolean }) | null;
  model: ParsedValue<string> | null;
  catalogNumber?: ParsedValue<string> | null;
  ecRep: ParsedValue<string> | null;
  otherDates: ParsedValue<PartialDate>[];
  barcodeCandidates: string[];
  warnings: Warning[];
  rawBarcodes: string[];
  rawText: string;
  normalizedText: string;
  elements?: Gs1Element[];
  udiDi?: string | null;
  udiPi?: {
    lot?: string;
    serial?: string;
    mfgDate?: string;
    expDate?: string;
  };
}
