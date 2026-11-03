import React, {useState} from 'react';
import {Check, X} from 'lucide-react';
import {
  getDefaultAlternativeMaterialId,
  getPresetById,
  MATERIAL_PRESETS,
} from '../constants/materials';
import type {
  CalculationResult,
  CostResult,
  DimensionsCm,
  EstimateDraft,
  PriceStrings,
  SavedPriceProfile,
} from '../types';
import {calculateWallCosts, calculateWallMaterials} from '../utils/calculations';
import {
  formatFaNumber,
  formatPriceFieldDisplay,
  formatToman,
  parseNonNegativeNumber,
  parsePositiveNumber,
  sanitizePriceInput,
} from '../utils/formatters';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: EstimateDraft;
  primaryMaterialName: string;
  primaryQuantities: CalculationResult;
  primaryCosts: CostResult;
  prices: PriceStrings;
  priceProfile: SavedPriceProfile;
  presetOverrides: Record<string, DimensionsCm>;
  onUpdateAlternativeUnitPrice: (materialId: string, price: string) => void;
  onSwitchPrimaryMaterial: (presetId: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  draft,
  primaryMaterialName,
  primaryQuantities,
  primaryCosts,
  prices,
  priceProfile,
  presetOverrides,
  onUpdateAlternativeUnitPrice,
  onSwitchPrimaryMaterial,
}) => {
  const [altId, setAltId] = useState<string>(() =>
    getDefaultAlternativeMaterialId(draft.selectedMaterialId)
  );

  if (!isOpen) return null;

  const availablePresets = MATERIAL_PRESETS.filter(
    (m) => m.id !== 'custom' && m.id !== draft.selectedMaterialId
  );
  const effectiveAltId =
    altId === draft.selectedMaterialId
      ? getDefaultAlternativeMaterialId(draft.selectedMaterialId)
      : altId;

  const altPreset = getPresetById(effectiveAltId);
  const altDims = presetOverrides[altPreset.id] ?? altPreset.actualCm;

  const lengthNum = parsePositiveNumber(draft.lengthM) ?? 0;
  const heightNum = parsePositiveNumber(draft.heightM) ?? 0;
  const jointNum = parsePositiveNumber(draft.jointThicknessCm) ?? 2;
  const wasteNum = parseNonNegativeNumber(draft.wastePercent) ?? 5;

  const validOpenings = draft.openings
    .map((o) => ({
      widthM: parsePositiveNumber(o.widthM) ?? 0,
      heightM: parsePositiveNumber(o.heightM) ?? 0,
    }))
    .filter((o) => o.widthM > 0 && o.heightM > 0);

  const altQuantities = calculateWallMaterials({
    lengthM: lengthNum,
    heightM: heightNum,
    wallThicknessCm: altPreset.recommendedWallThicknessCm,
    openings: validOpenings,
    unitLengthCm: altDims.l,
    unitHeightCm: altDims.h,
    unitThicknessCm: altDims.t,
    jointThicknessCm: jointNum,
    mixRatio: draft.mixRatio,
    wastePercent: wasteNum,
  });

  const altUnitPriceRaw = priceProfile.unitPricesByMaterialId[altPreset.id] ?? '';
  const altCosts = calculateWallCosts(altQuantities, {
    pricePerUnit: altUnitPriceRaw,
    pricePerCementBag: prices.pricePerCementBag,
    pricePerKgSand: prices.pricePerKgSand,
    laborPerM2: prices.laborPerM2,
  });

  const bothHaveUnitPrices = primaryCosts.pricePerUnit > 0 && altCosts.pricePerUnit > 0;
  const costDiff = altCosts.totalCost - primaryCosts.totalCost;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">مقایسه دو مصالح کنار هم</h2>
            <p className="text-xs text-slate-500 tabular-nums-fa">
              مساحت خالص دیوار: {formatFaNumber(primaryQuantities.netAreaM2, 2)} متر مربع
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن مقایسه"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Alternative Selector */}
          <div className="space-y-2">
            <label htmlFor="alt-material-select" className="block text-sm font-bold text-slate-800">
              انتخاب مصالح جایگزین برای مقایسه با «{primaryMaterialName}»:
            </label>
            <select
              id="alt-material-select"
              value={effectiveAltId}
              onChange={(e) => setAltId(e.target.value)}
              className="w-full min-h-[50px] rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-base font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              {availablePresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ضخامت {formatFaNumber(p.recommendedWallThicknessCm, 0)} سانت)
                </option>
              ))}
            </select>
          </div>

          {/* Alternative Unit Price Input (never hardcoded; reuses saved profile if user typed before) */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
            <label htmlFor="alt-unit-price" className="block text-sm font-bold text-slate-800">
              قیمت هر عدد «{altPreset.name}» (برای مقایسه هزینه کل):
            </label>
            <div className="relative">
              <input
                id="alt-unit-price"
                type="text"
                inputMode="decimal"
                value={formatPriceFieldDisplay(altUnitPriceRaw)}
                onChange={(e) =>
                  onUpdateAlternativeUnitPrice(altPreset.id, sanitizePriceInput(e.target.value))
                }
                placeholder="مبلغ هر عدد به تومان"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 pl-16 text-base font-bold text-slate-900 tabular-nums-fa placeholder:font-normal placeholder:text-slate-400"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                تومان
              </span>
            </div>
            <p className="text-xs text-slate-500">
              قیمت سیمان، ماسه و دستمزد برای هر دو ستون یکسان در نظر گرفته می‌شود.
            </p>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden tabular-nums-fa">
            <div className="grid grid-cols-3 bg-slate-900 text-white text-xs sm:text-sm font-bold p-3.5 gap-2">
              <div>شاخص</div>
              <div className="text-center">{primaryMaterialName}</div>
              <div className="text-center text-blue-300">{altPreset.name}</div>
            </div>

            <div className="divide-y divide-slate-200 text-sm">
              <div className="grid grid-cols-3 p-3.5 items-center gap-2">
                <div className="text-slate-600 font-medium">ضخامت دیوار</div>
                <div className="text-center font-bold text-slate-900">
                  {formatFaNumber(Number(draft.wallThicknessCm), 1)} سانت
                </div>
                <div className="text-center font-bold text-slate-900">
                  {formatFaNumber(altPreset.recommendedWallThicknessCm, 1)} سانت
                </div>
              </div>

              <div className="grid grid-cols-3 p-3.5 items-center gap-2 bg-slate-50/70">
                <div className="text-slate-600 font-medium">تعداد واحد</div>
                <div className="text-center font-extrabold text-base text-slate-900">
                  {formatFaNumber(primaryQuantities.finalUnits, 0)} عدد
                </div>
                <div className="text-center font-extrabold text-base text-blue-800">
                  {formatFaNumber(altQuantities.finalUnits, 0)} عدد
                </div>
              </div>

              <div className="grid grid-cols-3 p-3.5 items-center gap-2">
                <div className="text-slate-600 font-medium">سیمان (کیسه ۵۰ک)</div>
                <div className="text-center font-bold text-slate-900">
                  {formatFaNumber(primaryQuantities.cementBags, 0)} کیسه
                  <div className="text-[11px] font-normal text-slate-500">
                    ({formatFaNumber(primaryQuantities.cementKg, 0)} کیلو)
                  </div>
                </div>
                <div className="text-center font-bold text-slate-900">
                  {formatFaNumber(altQuantities.cementBags, 0)} کیسه
                  <div className="text-[11px] font-normal text-slate-500">
                    ({formatFaNumber(altQuantities.cementKg, 0)} کیلو)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 p-3.5 items-center gap-2 bg-slate-50/70">
                <div className="text-slate-600 font-medium">ماسه مورد نیاز</div>
                <div className="text-center font-bold text-slate-900">
                  {formatFaNumber(primaryQuantities.sandKg, 0)} کیلو
                </div>
                <div className="text-center font-bold text-slate-900">
                  {formatFaNumber(altQuantities.sandKg, 0)} کیلو
                </div>
              </div>

              <div className="grid grid-cols-3 p-3.5 items-center gap-2">
                <div className="text-slate-600 font-medium">هزینه آجر/بلوک</div>
                <div className="text-center font-bold text-slate-900">
                  {primaryCosts.pricePerUnit > 0
                    ? formatToman(primaryCosts.materialCost)
                    : 'بدون قیمت'}
                </div>
                <div className="text-center font-bold text-slate-900">
                  {altCosts.pricePerUnit > 0 ? formatToman(altCosts.materialCost) : 'بدون قیمت'}
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center gap-2 bg-blue-50/70">
                <div className="text-slate-900 font-bold">جمع کل هزینه</div>
                <div className="text-center font-extrabold text-slate-900">
                  {primaryCosts.hasAnyPrice ? formatToman(primaryCosts.totalCost) : '—'}
                </div>
                <div className="text-center font-extrabold text-blue-800">
                  {altCosts.hasAnyPrice ? formatToman(altCosts.totalCost) : '—'}
                </div>
              </div>
            </div>
          </div>

          {bothHaveUnitPrices && (
            <div className="rounded-xl bg-slate-100 border border-slate-200 p-3.5 text-sm font-semibold text-slate-800 text-center tabular-nums-fa">
              {costDiff === 0
                ? 'هزینه کل هر دو مصالح یکسان است.'
                : costDiff < 0
                ? `«${altPreset.name}» حدود ${formatToman(Math.abs(costDiff))} ارزان‌تر تمام می‌شود.`
                : `«${primaryMaterialName}» حدود ${formatToman(costDiff)} ارزان‌تر تمام می‌شود.`}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onSwitchPrimaryMaterial(altPreset.id);
              onClose();
            }}
            className="flex-1 min-h-[50px] px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>جایگزینی با «{altPreset.name}»</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[50px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            بستن مقایسه
          </button>
        </div>
      </div>
    </div>
  );
};
