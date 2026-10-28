/**
 * ISO 15223-1 Medical Devices - Symbols to be used with medical device labels
 */

export interface IsoSymbol {
  code: string;
  name: string;
  category: 'Identification' | 'Dates' | 'Safety' | 'Regulatory';
  description: string;
  iconName: string; // lucide icon identifier or visual symbol representation
  glyph: string;
  isoReference: string;
  clinicalSignificance: string;
}

export const ISO_SYMBOLS: IsoSymbol[] = [
  {
    code: 'MANUFACTURER',
    name: 'Manufacturer',
    category: 'Identification',
    description: 'Indicates the medical device manufacturer, as defined in EU Directives and MDR/IVDR.',
    iconName: 'Factory',
    glyph: '🏭 [🏭]',
    isoReference: 'ISO 15223-1 Clause 5.1.1',
    clinicalSignificance: 'Legal entity responsible for design, manufacture, packaging, and labeling before placing on market.',
  },
  {
    code: 'EC_REP',
    name: 'Authorized Representative in the European Community',
    category: 'Regulatory',
    description: 'Indicates the authorized representative in the European Community / European Union.',
    iconName: 'ShieldCheck',
    glyph: '🇪🇺 [EC|REP]',
    isoReference: 'ISO 15223-1 Clause 5.1.2',
    clinicalSignificance: 'Non-EU manufacturers must designate an EC REP. Crucial: EC REP is NOT the legal manufacturer!',
  },
  {
    code: 'MFG_DATE',
    name: 'Date of Manufacture',
    category: 'Dates',
    description: 'Indicates the date when the medical device was manufactured.',
    iconName: 'Calendar',
    glyph: '📅 [YYYY-MM-DD]',
    isoReference: 'ISO 15223-1 Clause 5.1.3',
    clinicalSignificance: 'Required for device aging analysis, preventive maintenance scheduling, and MTBF tracking.',
  },
  {
    code: 'EXP_DATE',
    name: 'Use-by Date (Expiry)',
    category: 'Dates',
    description: 'Indicates the date after which the medical device is not to be used.',
    iconName: 'Hourglass',
    glyph: '⌛ [YYYY-MM]',
    isoReference: 'ISO 15223-1 Clause 5.1.4',
    clinicalSignificance: 'Sterile barrier integrity, sensor enzyme degradation, or reagent decay occurs beyond this date.',
  },
  {
    code: 'LOT',
    name: 'Batch / Lot Code',
    category: 'Identification',
    description: 'Indicates the manufacturer’s batch code so that the batch or lot can be identified.',
    iconName: 'Box',
    glyph: '📦 [LOT]',
    isoReference: 'ISO 15223-1 Clause 5.1.5',
    clinicalSignificance: 'Essential for hospital recall management, field safety notices (FSN), and FDA Class I/II recalls.',
  },
  {
    code: 'SERIAL',
    name: 'Serial Number',
    category: 'Identification',
    description: 'Indicates the manufacturer’s serial number so that a specific medical device can be identified.',
    iconName: 'Hash',
    glyph: '🔢 [SN]',
    isoReference: 'ISO 15223-1 Clause 5.1.6',
    clinicalSignificance: 'Unique identifier for high-risk equipment, capital assets, ventilators, monitors, and implantables.',
  },
  {
    code: 'CATALOG_NUMBER',
    name: 'Catalogue / Model Number',
    category: 'Identification',
    description: 'Indicates the manufacturer’s catalogue number or model reference.',
    iconName: 'Tag',
    glyph: '🏷️ [REF]',
    isoReference: 'ISO 15223-1 Clause 5.1.7',
    clinicalSignificance: 'Specifies exact hardware version, module configuration, and spare parts catalog reference.',
  },
  {
    code: 'UDI',
    name: 'Unique Device Identifier',
    category: 'Identification',
    description: 'Indicates a carrier that contains Unique Device Identifier information.',
    iconName: 'QrCode',
    glyph: '🆔 [UDI]',
    isoReference: 'ISO 15223-1 Clause 5.7.10',
    clinicalSignificance: 'Universal barcode/RFID standard mandated by FDA (21 CFR 801) and EU MDR (Article 27).',
  },
  {
    code: 'DO_NOT_REUSE',
    name: 'Do Not Re-use (Single Use)',
    category: 'Safety',
    description: 'Indicates a medical device that is intended for one use, or for use on a single patient during a single procedure.',
    iconName: 'Ban',
    glyph: '🚫 [②]',
    isoReference: 'ISO 15223-1 Clause 5.4.2',
    clinicalSignificance: 'Reuse presents biological cross-contamination, mechanical fatigue, or infection hazard.',
  },
  {
    code: 'CONSULT_IFU',
    name: 'Consult Instructions for Use',
    category: 'Safety',
    description: 'Indicates the need for the user to consult the instructions for use or operator manual.',
    iconName: 'BookOpen',
    glyph: '📖 [🛈]',
    isoReference: 'ISO 15223-1 Clause 5.4.3',
    clinicalSignificance: 'Operating manuals contain essential warnings, electrical safety limits, and calibration protocols.',
  },
];
