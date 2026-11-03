import type {CalculationResult, CostResult, MixRatioValue, PriceStrings} from '../types';
import {parseNonNegativeNumber, parsePositiveNumber} from './formatters';

export interface DeterministicWallParams {
  lengthM: number;
  heightM: number;
  wallThicknessCm: number;
  openings: Array<{widthM: number; heightM: number}>;
  unitLengthCm: number;
  unitHeightCm: number;
  unitThicknessCm: number;
  jointThicknessCm: number;
  mixRatio: MixRatioValue;
  wastePercent: number;
}

/**
 * Pure deterministic masonry calculation strictly following the BannaSanj engineering formulas.
 * Never uses AI.
 */
export function calculateWallMaterials(params: DeterministicWallParams): CalculationResult {
  const grossAreaM2 = params.lengthM * params.heightM;
  const openingsAreaM2 = params.openings.reduce(
    (sum, item) => sum + item.widthM * item.heightM,
    0
  );
  const netAreaM2 = Math.max(0, grossAreaM2 - openingsAreaM2);

  const jointM = params.jointThicknessCm / 100;
  const unitLM = params.unitLengthCm / 100;
  const unitHM = params.unitHeightCm / 100;
  const unitTM = params.unitThicknessCm / 100;

  // unitsPerM2 = 1 / ((unitL + joint) * (unitH + joint))
  const unitsPerM2 = 1 / ((unitLM + jointM) * (unitHM + jointM));

  // theoreticalUnits = netArea * unitsPerM2
  const theoreticalUnits = netAreaM2 * unitsPerM2;

  // finalUnits = ceil(theoreticalUnits * (1 + waste/100))
  const finalUnits = Math.ceil(theoreticalUnits * (1 + params.wastePercent / 100));

  // wallVolume = netArea * (wallThicknessCm / 100)
  const wallThicknessM = params.wallThicknessCm / 100;
  const wallVolumeM3 = netAreaM2 * wallThicknessM;

  // solidUnitVolumePerM2 = unitsPerM2 * unitL * unitH * unitT
  const solidUnitVolumePerM2 = unitsPerM2 * unitLM * unitHM * unitTM;

  // wetMortarPerM2 = max(0, (wallThicknessCm / 100) - solidUnitVolumePerM2)
  const wetMortarPerM2 = Math.max(0, wallThicknessM - solidUnitVolumePerM2);

  // wetMortarTotal = wetMortarPerM2 * netArea
  const wetMortarTotalM3 = wetMortarPerM2 * netAreaM2;

  // dryMortarTotal = wetMortarTotal * 1.33
  const dryMortarTotalM3 = wetMortarTotalM3 * 1.33;

  // mixRatio = 5 for 1:5 (options 4, 5, 6)
  const mixRatio = params.mixRatio;

  // cementVolume = dryMortarTotal / (1 + mixRatio)
  const cementVolumeM3 = dryMortarTotalM3 / (1 + mixRatio);

  // sandVolume = dryMortarTotal * mixRatio / (1 + mixRatio)
  const sandVolumeM3 = (dryMortarTotalM3 * mixRatio) / (1 + mixRatio);

  // cementKg = cementVolume * 1440
  const cementKg = cementVolumeM3 * 1440;

  // sandKg = sandVolume * 1600
  const sandKg = sandVolumeM3 * 1600;

  // cementBags = ceil(cementKg / 50)
  const cementBags = Math.ceil(cementKg / 50);

  return {
    grossAreaM2,
    openingsAreaM2,
    netAreaM2,
    wallThicknessM,
    wallVolumeM3,
    jointM,
    unitLM,
    unitHM,
    unitTM,
    unitsPerM2,
    theoreticalUnits,
    wastePercent: params.wastePercent,
    finalUnits,
    solidUnitVolumePerM2,
    wetMortarPerM2,
    wetMortarTotalM3,
    dryMortarTotalM3,
    mixRatio,
    cementVolumeM3,
    sandVolumeM3,
    cementKg,
    sandKg,
    cementBags,
  };
}

/**
 * Deterministic cost calculation in Toman using user-entered unit prices.
 */
export function calculateWallCosts(
  quantities: CalculationResult,
  prices: PriceStrings
): CostResult {
  const pricePerUnit = parsePositiveNumber(prices.pricePerUnit) ?? 0;
  const pricePerCementBag = parsePositiveNumber(prices.pricePerCementBag) ?? 0;
  const pricePerKgSand = parsePositiveNumber(prices.pricePerKgSand) ?? 0;
  const laborPerM2 = parseNonNegativeNumber(prices.laborPerM2) ?? 0;

  const hasAnyPrice =
    pricePerUnit > 0 || pricePerCementBag > 0 || pricePerKgSand > 0 || laborPerM2 > 0;

  const materialCost = Math.round(quantities.finalUnits * pricePerUnit);
  const cementCost = Math.round(quantities.cementBags * pricePerCementBag);
  const sandCost = Math.round(quantities.sandKg * pricePerKgSand);
  const laborCost = Math.round(quantities.netAreaM2 * laborPerM2);
  const totalCost = materialCost + cementCost + sandCost + laborCost;

  return {
    hasAnyPrice,
    pricePerUnit,
    pricePerCementBag,
    pricePerKgSand,
    laborPerM2,
    materialCost,
    cementCost,
    sandCost,
    laborCost,
    totalCost,
  };
}
