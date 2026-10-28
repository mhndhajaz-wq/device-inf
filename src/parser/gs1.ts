/**
 * GS1 Application Identifier (AI) Parser
 * Compliant with GS1 General Specifications & FDA UDI standards.
 */

import { PartialDate, Source, Warning, ParsedValue, Gs1Element } from '../types/label';

// Specification of standard GS1 Application Identifiers
interface AiDef {
  ai: string;
  name: string;
  fixedLength?: number;
  minLength?: number;
  maxLength?: number;
  type: 'numeric' | 'alphanumeric' | 'date';
}

const GS1_AI_DEFINITIONS: Record<string, AiDef> = {
  '00': { ai: '00', name: 'SSCC (Serial Shipping Container Code)', fixedLength: 18, type: 'numeric' },
  '01': { ai: '01', name: 'GTIN (Global Trade Item Number)', fixedLength: 14, type: 'numeric' },
  '02': { ai: '02', name: 'GTIN of Contained Items', fixedLength: 14, type: 'numeric' },
  '10': { ai: '10', name: 'Batch / Lot Number', minLength: 1, maxLength: 20, type: 'alphanumeric' },
  '11': { ai: '11', name: 'Production Date (YYMMDD)', fixedLength: 6, type: 'date' },
  '12': { ai: '12', name: 'Due Date (YYMMDD)', fixedLength: 6, type: 'date' },
  '13': { ai: '13', name: 'Packaging Date (YYMMDD)', fixedLength: 6, type: 'date' },
  '15': { ai: '15', name: 'Best Before Date (YYMMDD)', fixedLength: 6, type: 'date' },
  '17': { ai: '17', name: 'Expiration Date (YYMMDD)', fixedLength: 6, type: 'date' },
  '20': { ai: '20', name: 'Internal Product Variant', fixedLength: 2, type: 'numeric' },
  '21': { ai: '21', name: 'Serial Number', minLength: 1, maxLength: 20, type: 'alphanumeric' },
  '22': { ai: '22', name: 'Secondary Data Fields', minLength: 1, maxLength: 20, type: 'alphanumeric' },
  '240': { ai: '240', name: 'Additional Product Identification', minLength: 1, maxLength: 30, type: 'alphanumeric' },
  '241': { ai: '241', name: 'Customer Part Number', minLength: 1, maxLength: 30, type: 'alphanumeric' },
  '30': { ai: '30', name: 'Variable Count', minLength: 1, maxLength: 8, type: 'numeric' },
  '310': { ai: '310', name: 'Net Weight (kg)', fixedLength: 6, type: 'numeric' },
  '320': { ai: '320', name: 'Net Weight (lb)', fixedLength: 6, type: 'numeric' },
  '91': { ai: '91', name: 'Company Internal Information', minLength: 1, maxLength: 30, type: 'alphanumeric' },
};

// Known fixed-length AI prefixes
const FIXED_LENGTH_AIS: Record<string, number> = {
  '00': 18,
  '01': 14,
  '02': 14,
  '03': 14,
  '04': 16,
  '11': 6,
  '12': 6,
  '13': 6,
  '15': 6,
  '17': 6,
  '18': 6,
  '19': 6,
  '20': 2,
  '31': 6,
  '32': 6,
  '33': 6,
  '34': 6,
  '35': 6,
  '36': 6,
};

export interface Gs1ParseOutput {
  gtin: string | null;
  lotCode: ParsedValue<string> | null;
  serial: ParsedValue<string> | null;
  manufactureDate: ParsedValue<PartialDate> | null;
  expirationDate: ParsedValue<PartialDate> | null;
  elements: Gs1Element[];
  warnings: Warning[];
}

export class Gs1Parser {
  /**
   * Parses YYMMDD into a PartialDate.
   * In GS1 specifications:
   * If day is 00, it indicates the last day of the month or just month/year.
   */
  static parseGs1Date(yymmdd: string): PartialDate | null {
    if (!yymmdd || yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) {
      return null;
    }
    const yy = parseInt(yymmdd.substring(0, 2), 10);
    const mm = parseInt(yymmdd.substring(2, 4), 10);
    const dd = parseInt(yymmdd.substring(4, 6), 10);

    // Century rule: 51-99 -> 1900s, 00-50 -> 2000s
    const year = yy >= 51 ? 1900 + yy : 2000 + yy;
    const month = mm >= 1 && mm <= 12 ? mm : null;
    const day = dd >= 1 && dd <= 31 ? dd : null;

    if (month === null) return null;
    return new PartialDate(year, month, day);
  }

  /**
   * Validates standard GTIN check digit (modulo 10 algorithm)
   */
  static validateGtinCheckDigit(gtin: string): boolean {
    if (!/^\d{8,14}$/.test(gtin)) return false;
    const digits = gtin.split('').map(d => parseInt(d, 10));
    const checkDigit = digits[digits.length - 1];
    const dataDigits = digits.slice(0, digits.length - 1);

    let sum = 0;
    let weight = 3;
    for (let i = dataDigits.length - 1; i >= 0; i--) {
      sum += dataDigits[i] * weight;
      weight = weight === 3 ? 1 : 3;
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  /**
   * Main entry point to parse a raw or bracketed GS1 barcode string.
   * Returns null if the string is not a valid GS1 barcode (e.g. plain barcodes).
   */
  static parse(rawInput: string): Gs1ParseOutput | null {
    if (!rawInput) return null;
    let input = rawInput.trim();

    // Strip Symbology Identifiers if present (e.g. ]C1 for GS1-128, ]e0 for GS1 DataMatrix)
    if (input.startsWith(']C1') || input.startsWith(']e0') || input.startsWith(']d2')) {
      input = input.substring(3);
    }

    const hasBrackets = input.includes('(') && input.includes(')');
    const hasGroupSeparator = input.includes('\u001D') || input.includes('^]') || input.includes('<GS>');

    // GUARD: Plain barcode check.
    // If it lacks brackets, group separators, and symbology identifiers,
    // it MUST start with primary GS1 AI '01' (GTIN 14 digits) or '00' (SSCC 18 digits).
    // Standalone numbers like "2100123456" must NOT be misinterpreted as GS1!
    if (!hasBrackets && !hasGroupSeparator) {
      if (!input.startsWith('01') && !input.startsWith('00')) {
        return null;
      }
      // If it starts with 01, it must have at least 16 digits (AI 01 + 14 digit GTIN)
      if (input.startsWith('01')) {
        if (input.length < 16 || !/^\d{16}/.test(input)) {
          return null;
        }
      }
      if (input.startsWith('00')) {
        if (input.length < 20 || !/^\d{20}/.test(input)) {
          return null;
        }
      }
    }

    if (hasBrackets) {
      return this.parseBracketed(input);
    } else {
      return this.parseRaw(input);
    }
  }

  /**
   * Parses bracketed GS1 format, e.g.:
   * (01)04012345678901(11)230115(10)LOT4821(21)SN998877
   */
  private static parseBracketed(input: string): Gs1ParseOutput | null {
    const regex = /\((\d{2,4})\)([^()]+)/g;
    const elements: Gs1Element[] = [];
    const warnings: Warning[] = [];

    let match: RegExpExecArray | null;
    let matchCount = 0;

    let gtin: string | null = null;
    let lotCode: ParsedValue<string> | null = null;
    let serial: ParsedValue<string> | null = null;
    let manufactureDate: ParsedValue<PartialDate> | null = null;
    let expirationDate: ParsedValue<PartialDate> | null = null;

    while ((match = regex.exec(input)) !== null) {
      matchCount++;
      const ai = match[1];
      const rawVal = match[2].trim();
      const def = GS1_AI_DEFINITIONS[ai];
      const title = def?.name ?? `AI (${ai})`;

      let parsedVal: unknown = rawVal;

      if (ai === '01' || ai === '02') {
        gtin = rawVal;
        parsedVal = rawVal;
        if (!this.validateGtinCheckDigit(rawVal)) {
          warnings.push(Warning.GTIN_CHECKSUM_INVALID);
        }
      } else if (ai === '10') {
        lotCode = {
          value: rawVal,
          source: Source.BARCODE,
          raw: rawVal,
          ai: '10',
        };
      } else if (ai === '21') {
        serial = {
          value: rawVal,
          source: Source.BARCODE,
          raw: rawVal,
          ai: '21',
        };
      } else if (ai === '11') {
        const pd = this.parseGs1Date(rawVal);
        if (pd) {
          manufactureDate = {
            value: pd,
            source: Source.BARCODE,
            raw: rawVal,
            ai: '11',
          };
          parsedVal = pd;
        }
      } else if (ai === '17') {
        const pd = this.parseGs1Date(rawVal);
        if (pd) {
          expirationDate = {
            value: pd,
            source: Source.BARCODE,
            raw: rawVal,
            ai: '17',
          };
          parsedVal = pd;
        }
      }

      elements.push({
        ai,
        title,
        rawValue: rawVal,
        parsedValue: parsedVal,
      });
    }

    if (matchCount === 0) return null;

    return {
      gtin,
      lotCode,
      serial,
      manufactureDate,
      expirationDate,
      elements,
      warnings,
    };
  }

  /**
   * Parses unbracketed raw GS1 format with group separator \u001D or FNC1
   * Example: 01040123456789011123011510LOT4821\u001D21SN998877
   */
  private static parseRaw(input: string): Gs1ParseOutput | null {
    // Normalize alternate GS representations
    const normalized = input.replace(/\^\]|<GS>/g, '\u001D');
    let idx = 0;
    const len = normalized.length;

    const elements: Gs1Element[] = [];
    const warnings: Warning[] = [];

    let gtin: string | null = null;
    let lotCode: ParsedValue<string> | null = null;
    let serial: ParsedValue<string> | null = null;
    let manufactureDate: ParsedValue<PartialDate> | null = null;
    let expirationDate: ParsedValue<PartialDate> | null = null;

    while (idx < len) {
      // Skip group separators between AIs
      if (normalized[idx] === '\u001D') {
        idx++;
        continue;
      }

      // Try matching AI of length 2, 3, or 4
      let matchedAi: string | null = null;
      let matchedDef: AiDef | null = null;

      // Check standard 2-digit AI
      const ai2 = normalized.substring(idx, idx + 2);
      if (GS1_AI_DEFINITIONS[ai2] || FIXED_LENGTH_AIS[ai2]) {
        matchedAi = ai2;
        matchedDef = GS1_AI_DEFINITIONS[ai2] ?? null;
      } else {
        // Check 3-digit AI
        const ai3 = normalized.substring(idx, idx + 3);
        if (GS1_AI_DEFINITIONS[ai3] || FIXED_LENGTH_AIS[ai3.substring(0, 2)]) {
          matchedAi = ai3;
          matchedDef = GS1_AI_DEFINITIONS[ai3] ?? null;
        } else {
          // Check 4-digit AI
          const ai4 = normalized.substring(idx, idx + 4);
          if (GS1_AI_DEFINITIONS[ai4]) {
            matchedAi = ai4;
            matchedDef = GS1_AI_DEFINITIONS[ai4] ?? null;
          }
        }
      }

      if (!matchedAi) {
        // Cannot identify valid AI
        break;
      }

      idx += matchedAi.length;

      // Determine value length
      const fixedLen = matchedDef?.fixedLength ?? FIXED_LENGTH_AIS[matchedAi] ?? null;
      let val = '';

      if (fixedLen !== null) {
        // Fixed length AI
        val = normalized.substring(idx, idx + fixedLen);
        idx += fixedLen;
      } else {
        // Variable length AI: terminates at \u001D or end of string
        const nextGs = normalized.indexOf('\u001D', idx);
        const maxLen = matchedDef?.maxLength ?? 30;
        if (nextGs !== -1) {
          val = normalized.substring(idx, nextGs);
          idx = nextGs + 1; // skip separator
        } else {
          val = normalized.substring(idx, Math.min(len, idx + maxLen));
          idx = len;
        }
      }

      const title = matchedDef?.name ?? `AI (${matchedAi})`;
      let parsedVal: unknown = val;

      if (matchedAi === '01' || matchedAi === '02') {
        gtin = val;
        parsedVal = val;
        if (!this.validateGtinCheckDigit(val)) {
          warnings.push(Warning.GTIN_CHECKSUM_INVALID);
        }
      } else if (matchedAi === '10') {
        lotCode = {
          value: val,
          source: Source.BARCODE,
          raw: val,
          ai: '10',
        };
      } else if (matchedAi === '21') {
        serial = {
          value: val,
          source: Source.BARCODE,
          raw: val,
          ai: '21',
        };
      } else if (matchedAi === '11') {
        const pd = this.parseGs1Date(val);
        if (pd) {
          manufactureDate = {
            value: pd,
            source: Source.BARCODE,
            raw: val,
            ai: '11',
          };
          parsedVal = pd;
        }
      } else if (matchedAi === '17') {
        const pd = this.parseGs1Date(val);
        if (pd) {
          expirationDate = {
            value: pd,
            source: Source.BARCODE,
            raw: val,
            ai: '17',
          };
          parsedVal = pd;
        }
      }

      elements.push({
        ai: matchedAi,
        title,
        rawValue: val,
        parsedValue: parsedVal,
      });
    }

    if (elements.length === 0) return null;

    return {
      gtin,
      lotCode,
      serial,
      manufactureDate,
      expirationDate,
      elements,
      warnings,
    };
  }
}
