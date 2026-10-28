/**
 * Simulated FDA AccessGUDID & European EUDAMED Registry Database
 */

export interface RegistryRecord {
  gtin: string;
  brandName: string;
  versionModel: string;
  companyName: string;
  deviceClass: 'Class I' | 'Class II' | 'Class III';
  gmdnCode: string;
  gmdnName: string;
  fdaListingNumber: string;
  mriSafety: 'MR Safe' | 'MR Conditional' | 'MR Unsafe';
  sterile: boolean;
  rxOnly: boolean;
  premarketSubmission: string;
}

export const REGISTRY_DATABASE: Record<string, RegistryRecord> = {
  // Mindray BeneVision N17
  '06944983000012': {
    gtin: '06944983000012',
    brandName: 'BeneVision N17',
    versionModel: 'N17',
    companyName: 'Shenzhen Mindray Bio-Medical Electronics Co., Ltd.',
    deviceClass: 'Class II',
    gmdnCode: '33586',
    gmdnName: 'Physiological monitoring system, acute care',
    fdaListingNumber: 'D310892',
    mriSafety: 'MR Unsafe',
    sterile: false,
    rxOnly: true,
    premarketSubmission: 'K172159',
  },
  // Philips IntelliVue MX800
  '08712281000543': {
    gtin: '08712281000543',
    brandName: 'IntelliVue Patient Monitor',
    versionModel: 'MX800 / M8105A',
    companyName: 'Philips Medical Systems',
    deviceClass: 'Class II',
    gmdnCode: '33586',
    gmdnName: 'Multi-parameter physiological monitor',
    fdaListingNumber: 'D194821',
    mriSafety: 'MR Unsafe',
    sterile: false,
    rxOnly: true,
    premarketSubmission: 'K110484',
  },
  // Acme Medical / Sample
  '04012345678901': {
    gtin: '04012345678901',
    brandName: 'Cardinal Precision Electrosurgical Unit',
    versionModel: 'Cardinal Series',
    companyName: 'Acme Medical Devices',
    deviceClass: 'Class II',
    gmdnCode: '16187',
    gmdnName: 'Electrosurgical generator, multi-function',
    fdaListingNumber: 'D442109',
    mriSafety: 'MR Conditional',
    sterile: false,
    rxOnly: true,
    premarketSubmission: 'K190241',
  },
  // CE MDR Endoscope
  '00840192837465': {
    gtin: '00840192837465',
    brandName: 'OptiView Endoscopy System',
    versionModel: 'Endoscope Camera EV-3',
    companyName: 'Acme Medical Inc.',
    deviceClass: 'Class II',
    gmdnCode: '37243',
    gmdnName: 'Rigid endoscope camera system',
    fdaListingNumber: 'D901238',
    mriSafety: 'MR Safe',
    sterile: true,
    rxOnly: true,
    premarketSubmission: 'K201884',
  },
};

export function lookupRegistry(gtinOrModel?: string | null): RegistryRecord | null {
  if (!gtinOrModel) return null;
  const clean = gtinOrModel.trim();
  if (REGISTRY_DATABASE[clean]) {
    return REGISTRY_DATABASE[clean];
  }
  // Search by brand or model name
  const match = Object.values(REGISTRY_DATABASE).find(r =>
    r.brandName.toLowerCase().includes(clean.toLowerCase()) ||
    r.versionModel.toLowerCase().includes(clean.toLowerCase())
  );
  return match || null;
}
