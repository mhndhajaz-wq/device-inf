/**
 * Unified Medical Device Label Parser
 * Combines GS1/UDI Barcode decoding with OCR text parsing,
 * handles priority resolution, and raises ISO/clinical compliance warnings.
 */

import { ParseResult, Source, Warning, Gs1Element } from '../types/label';
import { Gs1Parser, Gs1ParseOutput } from './gs1';
import { TextParser } from './text';

export class LabelParser {
  /**
   * Main entry point conforming to LabelParserTest suite:
   * LabelParser.parse(barcodes: string[], text: string): ParseResult
   */
  static parse(barcodes: string[] = [], text: string = ''): ParseResult {
    const rawBarcodes = [...barcodes];
    const barcodeCandidates: string[] = [];
    const elements: Gs1Element[] = [];
    const warnings: Warning[] = [];

    let gtin: string | null = null;
    let barcodeSerial = null;
    let barcodeLot = null;
    let barcodeMfgDate = null;
    let barcodeExpDate = null;

    // 1. Process Barcodes
    for (const rawBarcode of barcodes) {
      if (!rawBarcode || !rawBarcode.trim()) continue;
      const clean = rawBarcode.trim();
      const parsedGs1: Gs1ParseOutput | null = Gs1Parser.parse(clean);

      if (parsedGs1) {
        if (parsedGs1.gtin && !gtin) gtin = parsedGs1.gtin;
        if (parsedGs1.serial && !barcodeSerial) barcodeSerial = parsedGs1.serial;
        if (parsedGs1.lotCode && !barcodeLot) barcodeLot = parsedGs1.lotCode;
        if (parsedGs1.manufactureDate && !barcodeMfgDate) barcodeMfgDate = parsedGs1.manufactureDate;
        if (parsedGs1.expirationDate && !barcodeExpDate) barcodeExpDate = parsedGs1.expirationDate;

        if (parsedGs1.elements) elements.push(...parsedGs1.elements);
        if (parsedGs1.warnings) {
          for (const w of parsedGs1.warnings) {
            if (!warnings.includes(w)) warnings.push(w);
          }
        }
      } else {
        // Barcode could not be parsed as structured GS1 UDI -> add to candidates
        barcodeCandidates.push(clean);
      }
    }

    // 2. Process OCR text
    const textResult = TextParser.parse(text || '');
    if (textResult.hasArabicIndic && !warnings.includes(Warning.ARABIC_INDIC_NORMALIZED)) {
      warnings.push(Warning.ARABIC_INDIC_NORMALIZED);
    }

    // 3. Resolve conflicts (Barcode has absolute priority over OCR)
    // Serial:
    let serial = barcodeSerial;
    if (textResult.serial) {
      if (barcodeSerial) {
        // Disagreement between barcode and text raises Warning.SERIAL_MISMATCH
        if (barcodeSerial.value !== textResult.serial.value) {
          if (!warnings.includes(Warning.SERIAL_MISMATCH)) {
            warnings.push(Warning.SERIAL_MISMATCH);
          }
        }
        // Barcode has priority
        serial = barcodeSerial;
      } else {
        serial = textResult.serial;
      }
    }

    // Lot:
    let lotCode = barcodeLot;
    if (textResult.lotCode) {
      if (barcodeLot) {
        if (barcodeLot.value !== textResult.lotCode.value) {
          if (!warnings.includes(Warning.LOT_MISMATCH)) {
            warnings.push(Warning.LOT_MISMATCH);
          }
        }
        lotCode = barcodeLot;
      } else {
        lotCode = textResult.lotCode;
      }
    }

    // Manufacture Date:
    let manufactureDate = barcodeMfgDate;
    if (textResult.manufactureDate) {
      if (barcodeMfgDate) {
        if (!barcodeMfgDate.value.equals(textResult.manufactureDate.value)) {
          if (!warnings.includes(Warning.DATE_DISCREPANCY)) {
            warnings.push(Warning.DATE_DISCREPANCY);
          }
        }
        manufactureDate = barcodeMfgDate;
      } else {
        manufactureDate = textResult.manufactureDate;
      }
    }

    // Expiration Date:
    let expirationDate = barcodeExpDate;
    if (textResult.expirationDate) {
      if (barcodeExpDate) {
        if (!barcodeExpDate.value.equals(textResult.expirationDate.value)) {
          if (!warnings.includes(Warning.DATE_DISCREPANCY)) {
            warnings.push(Warning.DATE_DISCREPANCY);
          }
        }
        expirationDate = barcodeExpDate;
      } else {
        expirationDate = textResult.expirationDate;
      }
    }

    // Check device expiration
    if (expirationDate?.value?.isPast() && !warnings.includes(Warning.EXPIRED_DEVICE)) {
      warnings.push(Warning.EXPIRED_DEVICE);
    }

    // Manufacturer & Model
    const manufacturer = textResult.manufacturer;
    if (manufacturer?.guessed && !warnings.includes(Warning.SUSPICIOUS_MANUFACTURER)) {
      warnings.push(Warning.SUSPICIOUS_MANUFACTURER);
    }

    const model = textResult.model;
    const ecRep = textResult.ecRep;

    // Filter otherDates so it excludes manufactureDate and expirationDate
    const otherDates = textResult.otherDates.filter(d => {
      if (manufactureDate && d.value.equals(manufactureDate.value)) return false;
      if (expirationDate && d.value.equals(expirationDate.value)) return false;
      return true;
    });

    // UDI-DI and UDI-PI metadata
    const udiDi = gtin;
    const udiPi = (lotCode || serial || manufactureDate || expirationDate) ? {
      lot: lotCode?.value,
      serial: serial?.value,
      mfgDate: manufactureDate?.value.toString(),
      expDate: expirationDate?.value.toString(),
    } : undefined;

    return {
      gtin,
      serial,
      lotCode,
      manufactureDate,
      expirationDate,
      manufacturer,
      model,
      ecRep,
      otherDates,
      barcodeCandidates,
      warnings,
      rawBarcodes,
      rawText: text || '',
      normalizedText: textResult.normalizedText,
      elements,
      udiDi,
      udiPi,
    };
  }
}
