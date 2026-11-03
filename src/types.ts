export type MaterialCategory = 'brick' | 'block' | 'custom';

export interface DimensionsCm {
  l: number; // طول (سانتی‌متر)
  h: number; // ارتفاع (سانتی‌متر)
  t: number; // ضخامت (سانتی‌متر)
}

export interface MaterialPreset {
  id: string;
  name: string;
  shortName: string;
  category: MaterialCategory;
  unitLabel: 'آجر' | 'بلوک' | 'واحد';
  nominalCm: DimensionsCm;
  actualCm: DimensionsCm;
  recommendedWallThicknessCm: number;
  subtitle: string;
}

export interface OpeningItem {
  id: string;
  label: string;
  widthM: string;
  heightM: string;
}

export type MixRatioValue = 4 | 5 | 6;

export interface EstimateDraft {
  id?: string;
  projectTitle: string;
  lengthM: string;
  heightM: string;
  wallThicknessCm: string;
  openings: OpeningItem[];
  selectedMaterialId: string;
  customMaterialName: string;
  // Editable actual dimensions for whichever material is active (in cm)
  activeDimensionsCm: {
    l: string;
    h: string;
    t: string;
  };
  jointThicknessCm: string;
  mixRatio: MixRatioValue;
  wastePercent: string;
}

export interface PriceStrings {
  pricePerUnit: string;
  pricePerCementBag: string;
  pricePerKgSand: string;
  laborPerM2: string;
}

export interface SavedPriceProfile {
  unitPricesByMaterialId: Record<string, string>;
  pricePerCementBag: string;
  pricePerKgSand: string;
  laborPerM2: string;
  updatedAt?: string;
}

export interface CalculationResult {
  grossAreaM2: number;
  openingsAreaM2: number;
  netAreaM2: number;
  wallThicknessM: number;
  wallVolumeM3: number;
  jointM: number;
  unitLM: number;
  unitHM: number;
  unitTM: number;
  unitsPerM2: number;
  theoreticalUnits: number;
  wastePercent: number;
  finalUnits: number;
  solidUnitVolumePerM2: number;
  wetMortarPerM2: number;
  wetMortarTotalM3: number;
  dryMortarTotalM3: number;
  mixRatio: MixRatioValue;
  cementVolumeM3: number;
  sandVolumeM3: number;
  cementKg: number;
  sandKg: number;
  cementBags: number;
}

export interface CostResult {
  hasAnyPrice: boolean;
  pricePerUnit: number;
  pricePerCementBag: number;
  pricePerKgSand: number;
  laborPerM2: number;
  materialCost: number;
  cementCost: number;
  sandCost: number;
  laborCost: number;
  totalCost: number;
}

export interface SavedEstimate {
  id: string;
  createdAt: string;
  updatedAt: string;
  projectTitle: string;
  draft: EstimateDraft;
  materialName: string;
  prices: PriceStrings;
  quantities: CalculationResult;
  costs: CostResult;
}

export type AppTab = 'home' | 'estimate' | 'saved' | 'settings';
export type EstimateStep = 1 | 2 | 3 | 4 | 5;
