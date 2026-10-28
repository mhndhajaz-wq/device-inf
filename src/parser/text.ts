/**
 * OCR Medical Device Label Parser
 * Extracts manufacturer, model, serial, lot, manufacture date, expiration date,
 * and EC REP according to ISO 15223-1 and medical device standards.
 */

import { PartialDate, Source, ParsedValue, Warning } from '../types/label';

export interface TextParseOutput {
  manufacturer: (ParsedValue<string> & { guessed?: boolean }) | null;
  model: ParsedValue<string> | null;
  serial: ParsedValue<string> | null;
  lotCode: ParsedValue<string> | null;
  manufactureDate: ParsedValue<PartialDate> | null;
  expirationDate: ParsedValue<PartialDate> | null;
  ecRep: ParsedValue<string> | null;
  otherDates: ParsedValue<PartialDate>[];
  normalizedText: string;
  hasArabicIndic: boolean;
}

// Arabic-Indic digit normalization map
const ARABIC_INDIC_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

// Corporate entity suffixes indicating a company name
const COMPANY_INDICATORS = [
  /\bco\.?,\s*ltd\.?/i,
  /\bco\.?\s+ltd\.?/i,
  /\bltd\.?/i,
  /\binc\.?/i,
  /\bcorp\.?/i,
  /\bcorporation\b/i,
  /\bgmbh\b/i,
  /\bag\b/i,
  /\bllc\b/i,
  /\bs\.a\b/i,
  /\bs\.p\.a\b/i,
  /\bb\.v\b/i,
  /\bmedical systems\b/i,
  /\bbio-medical\b/i,
  /\bhealthcare\b/i,
  /\blaboratories\b/i,
  /\bdevices\b/i,
  /\btechnologies\b/i,
];

export class TextParser {
  /**
   * Normalizes Arabic-Indic digits to Western Arabic digits (0-9)
   */
  static normalizeNumerals(text: string): { normalized: string; converted: boolean } {
    let converted = false;
    const normalized = text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (ch) => {
      converted = true;
      return ARABIC_INDIC_MAP[ch] || ch;
    });
    return { normalized, converted };
  }

  /**
   * Attempts to parse a date string into a PartialDate
   */
  static parseDateString(raw: string): PartialDate | null {
    if (!raw) return null;
    const clean = raw.trim();

    // Year-only: e.g. "2019"
    if (/^(19\d\d|20\d\d)$/.test(clean)) {
      return new PartialDate(parseInt(clean, 10));
    }

    // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const ymdMatch = clean.match(/^(19\d\d|20\d\d)[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])$/);
    if (ymdMatch) {
      return new PartialDate(
        parseInt(ymdMatch[1], 10),
        parseInt(ymdMatch[2], 10),
        parseInt(ymdMatch[3], 10)
      );
    }

    // YYYY-MM or YYYY/MM or YYYY.MM
    const ymMatch = clean.match(/^(19\d\d|20\d\d)[-/.](0?[1-9]|1[0-2])$/);
    if (ymMatch) {
      return new PartialDate(
        parseInt(ymMatch[1], 10),
        parseInt(ymMatch[2], 10)
      );
    }

    // MM/YYYY or MM-YYYY
    const myMatch = clean.match(/^(0?[1-9]|1[0-2])[-/.](19\d\d|20\d\d)$/);
    if (myMatch) {
      return new PartialDate(
        parseInt(myMatch[2], 10),
        parseInt(myMatch[1], 10)
      );
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = clean.match(/^(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](19\d\d|20\d\d)$/);
    if (dmyMatch) {
      return new PartialDate(
        parseInt(dmyMatch[3], 10),
        parseInt(dmyMatch[2], 10),
        parseInt(dmyMatch[1], 10)
      );
    }

    return null;
  }

  /**
   * Extracts date substring from a given line
   */
  static extractDateFromText(text: string): { date: PartialDate; rawDateStr: string } | null {
    // Match potential date strings like 2022-08, 2021/03, 2023-01-15, 2019
    const regex = /\b(19\d\d|20\d\d)(?:[-/.](0?[1-9]|1[0-2])(?:[-/.](0?[1-9]|[12]\d|3[01]))?)?\b|\b(0?[1-9]|1[0-2])[-/.](19\d\d|20\d\d)\b/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const candidate = match[0];
      const parsed = this.parseDateString(candidate);
      if (parsed) {
        return { date: parsed, rawDateStr: candidate };
      }
    }
    return null;
  }

  /**
   * Checks if text contains company identifiers
   */
  static isCompanyName(text: string): boolean {
    return COMPANY_INDICATORS.some(regex => regex.test(text));
  }

  /**
   * Parses full label OCR text
   */
  static parse(rawText: string): TextParseOutput {
    const { normalized, converted: hasArabicIndic } = this.normalizeNumerals(rawText || '');
    const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let manufacturer: (ParsedValue<string> & { guessed?: boolean }) | null = null;
    let model: ParsedValue<string> | null = null;
    let serial: ParsedValue<string> | null = null;
    let lotCode: ParsedValue<string> | null = null;
    let manufactureDate: ParsedValue<PartialDate> | null = null;
    let expirationDate: ParsedValue<PartialDate> | null = null;
    let ecRep: ParsedValue<string> | null = null;

    const allDetectedDates: { date: PartialDate; raw: string; isMfg?: boolean; isExp?: boolean }[] = [];
    const guessedManufacturerCandidates: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

      // 1. EC REP (Authorized Representative in the European Community)
      // Must NOT be mistaken for the manufacturer!
      const ecRepMatch = line.match(/(?:EC\s*REP|EC\s*\|\s*REP|EU\s*REP|Authorized\s*Representative)\s*[:：]?\s*(.*)/i);
      if (ecRepMatch) {
        let repVal = ecRepMatch[1].trim();
        if (!repVal && nextLine && !nextLine.includes(':')) {
          repVal = nextLine;
          i++; // consumed next line
        }
        if (repVal) {
          ecRep = {
            value: repVal,
            source: Source.OCR,
            raw: line,
          };
          continue; // Don't parse this line as manufacturer
        }
      }

      // 2. Manufacturer explicitly labeled
      // "Manufacturer:", "Fabriquant:", "Hersteller:", "Manufactured by:"
      const mfgExplicitMatch = line.match(/^(?:Manufacturer|Manufactured\s*by|Fabriqué\s*par|Hersteller)\s*[:：]\s*(.+)$/i);
      if (mfgExplicitMatch) {
        manufacturer = {
          value: mfgExplicitMatch[1].trim(),
          source: Source.OCR,
          guessed: false,
          raw: line,
        };
        continue;
      }

      // 2b. "MFG:" prefix disambiguation:
      // In medical labels, "MFG:" could mean "Manufacturer" or "Manufacturing Date".
      // Example 1: "MFG: Philips Medical Systems" -> Manufacturer!
      // Example 2: "MFG: 2021/03" -> Manufacture Date!
      const mfgPrefixMatch = line.match(/^MFG\s*[:：]\s*(.+)$/i);
      if (mfgPrefixMatch) {
        const afterMfg = mfgPrefixMatch[1].trim();
        const dateMatch = this.extractDateFromText(afterMfg);

        // If it starts with letters and looks like a company name or has no date
        const hasLetters = /[A-Za-z]/.test(afterMfg);
        const looksLikeCompany = this.isCompanyName(afterMfg) || (hasLetters && !dateMatch);

        if (looksLikeCompany && !dateMatch) {
          manufacturer = {
            value: afterMfg,
            source: Source.OCR,
            guessed: false,
            raw: line,
          };
          continue;
        } else if (dateMatch) {
          manufactureDate = {
            value: dateMatch.date,
            source: Source.OCR,
            raw: line,
          };
          allDetectedDates.push({ date: dateMatch.date, raw: dateMatch.rawDateStr, isMfg: true });
          continue;
        }
      }

      // 3. Manufacture Date explicitly labeled
      // "Date of manufacture:", "Manufacturing Date:", "DOM:", "Year of Manufacture: 2019"
      const mfgDateMatch = line.match(/(?:Date\s*of\s*manufacture|Manufacturing\s*Date|Manufacture\s*Date|Year\s*of\s*Manufacture|DOM)\s*[:：]\s*(.+)/i);
      if (mfgDateMatch) {
        const valText = mfgDateMatch[1].trim();
        const parsedDate = this.parseDateString(valText) || this.extractDateFromText(valText)?.date;
        if (parsedDate) {
          manufactureDate = {
            value: parsedDate,
            source: Source.OCR,
            raw: line,
          };
          allDetectedDates.push({ date: parsedDate, raw: valText, isMfg: true });
          continue;
        }
      }

      // 4. Expiration Date
      // "EXP:", "Expiry:", "Use by:", "Expiration Date:"
      const expMatch = line.match(/(?:EXP(?:IRY)?|Expiration\s*Date|Use\s*by|Verwendbar\s*bis)\s*[:：]\s*(.+)/i);
      if (expMatch) {
        const valText = expMatch[1].trim();
        const parsedDate = this.parseDateString(valText) || this.extractDateFromText(valText)?.date;
        if (parsedDate) {
          expirationDate = {
            value: parsedDate,
            source: Source.OCR,
            raw: line,
          };
          allDetectedDates.push({ date: parsedDate, raw: valText, isExp: true });
          continue;
        }
      }

      // 5. Model extraction
      // Example: "Model: BeneVision N17" -> model = "BeneVision"
      const modelMatch = line.match(/(?:Model|REF|Type)\s*[:：]\s*([A-Za-z0-9_-]+)(?:\s+([A-Za-z0-9_-]+))?/i);
      if (modelMatch && !model) {
        const familyName = modelMatch[1].trim();
        model = {
          value: familyName,
          source: Source.OCR,
          raw: line,
        };
        continue;
      }

      // 6. Serial Number
      // Example 1: "SN: FA-12345678"
      // Example 2 (valueOnNextLine):
      // "Serial Number"
      // "AB123456"
      const snInlineMatch = line.match(/(?:SN|S\/N|Serial\s*(?:No\.?|Number)?)\s*[:：]\s*([A-Za-z0-9_-]+)/i);
      if (snInlineMatch) {
        serial = {
          value: snInlineMatch[1].trim(),
          source: Source.OCR,
          raw: line,
        };
        continue;
      }

      const snHeaderMatch = line.match(/^(?:SN|S\/N|Serial\s*(?:No\.?|Number)?)\s*[:：]?$/i);
      if (snHeaderMatch && nextLine && /^[A-Za-z0-9_-]+$/.test(nextLine)) {
        serial = {
          value: nextLine.trim(),
          source: Source.OCR,
          raw: `${line} ${nextLine}`,
        };
        i++; // skip nextLine
        continue;
      }

      // 7. LOT / Batch Code
      // "LOT 20230A1" or "LOT: 20230A1" or "Batch: 20230A1"
      const lotMatch = line.match(/(?:LOT|BATCH)\s*[:：]?\s*([A-Za-z0-9_-]+)/i);
      if (lotMatch) {
        lotCode = {
          value: lotMatch[1].trim(),
          source: Source.OCR,
          raw: line,
        };
        continue;
      }

      const lotHeaderMatch = line.match(/^(?:LOT|BATCH)\s*[:：]?$/i);
      if (lotHeaderMatch && nextLine && /^[A-Za-z0-9_-]+$/.test(nextLine)) {
        lotCode = {
          value: nextLine.trim(),
          source: Source.OCR,
          raw: `${line} ${nextLine}`,
        };
        i++;
        continue;
      }

      // Collect unassigned company names for manufacturer guessing
      // (Used when EC REP is present or manufacturer header was omitted)
      if (this.isCompanyName(line)) {
        guessedManufacturerCandidates.push(line);
      }

      // Detect general dates on line if any
      const genDate = this.extractDateFromText(line);
      if (genDate) {
        allDetectedDates.push({ date: genDate.date, raw: genDate.rawDateStr });
      }
    }

    // If manufacturer wasn't explicitly found, guess from candidates (e.g. Acme Medical Inc.)
    if (!manufacturer && guessedManufacturerCandidates.length > 0) {
      manufacturer = {
        value: guessedManufacturerCandidates[0],
        source: Source.OCR,
        guessed: true,
        raw: guessedManufacturerCandidates[0],
      };
    }

    // Determine otherDates: Dates that are NOT the manufactureDate or expirationDate
    const otherDates: ParsedValue<PartialDate>[] = [];
    for (const d of allDetectedDates) {
      const isMfg = manufactureDate && d.date.equals(manufactureDate.value);
      const isExp = expirationDate && d.date.equals(expirationDate.value);
      if (!isMfg && !isExp) {
        otherDates.push({
          value: d.date,
          source: Source.OCR,
          raw: d.raw,
        });
      }
    }

    return {
      manufacturer,
      model,
      serial,
      lotCode,
      manufactureDate,
      expirationDate,
      ecRep,
      otherDates,
      normalizedText: normalized,
      hasArabicIndic,
    };
  }
}
