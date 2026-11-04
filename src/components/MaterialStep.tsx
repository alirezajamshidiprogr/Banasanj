import React, {useState} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {getAllMaterials, getMaterialById} from '../constants/materials';
import type {
  DimensionsCm,
  EstimateDraft,
  MaterialCategory,
  MaterialPreset,
  MaterialUsageRecord,
  MixRatioValue,
} from '../types';
import {
  formatFaNumber,
  parseNonNegativeNumber,
  parsePositiveNumber,
  sanitizeDecimalInput,
  toPersianDigits,
} from '../utils/formatters';
import {MaterialThumbnail} from './MaterialThumbnail';

interface MaterialStepProps {
  draft: EstimateDraft;
  userMaterials: MaterialPreset[];
  usageStats: Record<string, MaterialUsageRecord>;
  presetOverrides: Record<string, DimensionsCm>;
  onChangeDraft: (updater: (prev: EstimateDraft) => EstimateDraft) => void;
  onSavePresetOverride: (presetId: string, dims: DimensionsCm) => void;
  onResetPresetOverride: (presetId: string) => void;
  onOpenAddMaterialModal: () => void;
  onDeleteUserMaterial: (materialId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const JOINT_QUICK_OPTIONS = ['1', '1.5', '2', '2.5'];
const WASTE_QUICK_OPTIONS = ['0', '3', '5', '10'];
const MIX_RATIO_OPTIONS: Array<{value: MixRatioValue; label: string; desc: string}> = [
  {value: 4, label: '۱ به ۴', desc: 'پرسی‌تر و قوی‌تر'},
  {value: 5, label: '۱ به ۵', desc: 'معمولی استاندارد'},
  {value: 6, label: '۱ به ۶', desc: 'کم‌سیمان'},
];

export const MaterialStep: React.FC<MaterialStepProps> = ({
  draft,
  userMaterials,
  usageStats,
  presetOverrides,
  onChangeDraft,
  onSavePresetOverride,
  onResetPresetOverride,
  onOpenAddMaterialModal,
  onDeleteUserMaterial,
  onBack,
  onNext,
}) => {
  const [filterCat, setFilterCat] = useState<'all' | MaterialCategory | 'user'>('all');
  const [showDimensionEditor, setShowDimensionEditor] = useState<boolean>(false);
  const [confirmDeleteMat, setConfirmDeleteMat] = useState<MaterialPreset | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allMaterials = getAllMaterials(userMaterials);
  const selectedPreset = getMaterialById(draft.selectedMaterialId, userMaterials);
  const hasCustomOverride = Boolean(presetOverrides[selectedPreset.id]);

  // Smart sort: show user's custom materials at the top when viewing 'all' or 'user',
  // and boost recently used materials cleanly
  const filteredPresets = allMaterials
    .filter((m) => {
      if (filterCat === 'all') return true;
      if (filterCat === 'user') return !m.isBuiltIn;
      return m.category === filterCat;
    })
    .sort((a, b) => {
      if (a.isBuiltIn !== b.isBuiltIn) {
        return a.isBuiltIn ? 1 : -1; // User-defined materials shown prominently first
      }
      const countDiff = (usageStats[b.id]?.count ?? 0) - (usageStats[a.id]?.count ?? 0);
      if (countDiff !== 0) return countDiff;
      return 0;
    });

  const handleSelectMaterial = (preset: MaterialPreset) => {
    const savedDims = presetOverrides[preset.id] ?? preset.actualCm;
    onChangeDraft((prev) => ({
      ...prev,
      selectedMaterialId: preset.id,
      customMaterialName: preset.name,
      wallThicknessCm: String(preset.recommendedWallThicknessCm),
      activeDimensionsCm: {
        l: String(savedDims.l),
        h: String(savedDims.h),
        t: String(savedDims.t),
      },
    }));
    setErrorMsg(null);
  };

  const handleDimensionChange = (axis: 'l' | 'h' | 't', rawValue: string) => {
    const clean = sanitizeDecimalInput(rawValue);
    onChangeDraft((prev) => {
      const nextDims = {...prev.activeDimensionsCm, [axis]: clean};
      const lNum = parsePositiveNumber(nextDims.l);
      const hNum = parsePositiveNumber(nextDims.h);
      const tNum = parsePositiveNumber(nextDims.t);
      if (lNum && hNum && tNum) {
        onSavePresetOverride(prev.selectedMaterialId, {l: lNum, h: hNum, t: tNum});
      }
      return {
        ...prev,
        activeDimensionsCm: nextDims,
      };
    });
    setErrorMsg(null);
  };

  const handleResetDimensions = () => {
    onResetPresetOverride(selectedPreset.id);
    onChangeDraft((prev) => ({
      ...prev,
      activeDimensionsCm: {
        l: String(selectedPreset.actualCm.l),
        h: String(selectedPreset.actualCm.h),
        t: String(selectedPreset.actualCm.t),
      },
    }));
    setErrorMsg(null);
  };

  const wallThickNum = parsePositiveNumber(draft.wallThicknessCm) ?? 0;
  const unitThickNum = parsePositiveNumber(draft.activeDimensionsCm.t) ?? 0;
  const thicknessWarning =
    wallThickNum > 0 && unitThickNum > 0 && wallThickNum < unitThickNum;

  const handleProceed = () => {
    const uL = parsePositiveNumber(draft.activeDimensionsCm.l);
    const uH = parsePositiveNumber(draft.activeDimensionsCm.h);
    const uT = parsePositiveNumber(draft.activeDimensionsCm.t);
    const joint = parsePositiveNumber(draft.jointThicknessCm);
    const waste = parseNonNegativeNumber(draft.wastePercent);

    if (!uL || !uH || !uT) {
      setErrorMsg('لطفاً طول، ارتفاع و ضخامت مصالح را به صورت اعداد مثبت (سانتی‌متر) وارد کنید.');
      setShowDimensionEditor(true);
      return;
    }
    if (!joint) {
      setErrorMsg(
        'لطفاً ضخامت بند ملات را به صورت عدد مثبت (مثلاً ۲ یا ۱٫۵ سانتی‌متر) وارد کنید.'
      );
      return;
    }
    if (waste === null || waste > 100) {
      setErrorMsg('درصد پرت مصالح باید عددی بین ۰ تا ۱۰۰ باشد.');
      return;
    }

    setErrorMsg(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Material Preset & User Materials Selection */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">۱. انتخاب آجر یا بلوک</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              مصالح ثابت استاندارد قابل حذف نیستند؛ می‌توانید مصالح جدید با ابعاد دلخواه اضافه کنید تا برای همیشه بماند.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddMaterialModal}
            className="min-h-[44px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>معرفی مصالح جدید</span>
          </button>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {(
            [
              {id: 'all', label: 'همه مصالح'},
              {id: 'brick', label: 'آجر و سفال'},
              {id: 'block', label: 'بلوک'},
              {
                id: 'user',
                label:
                  userMaterials.length > 0
                    ? `مصالح من (${formatFaNumber(userMaterials.length, 0)})`
                    : 'مصالح من',
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCat(tab.id)}
              className={`min-h-[40px] flex-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                filterCat === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty state when user clicks 'مصالح من' before adding any */}
        {filteredPresets.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              هنوز مصالح اختصاصی جدیدی معرفی نکرده‌اید.
            </p>
            <button
              type="button"
              onClick={onOpenAddMaterialModal}
              className="min-h-[46px] px-5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اولین مصالح اختصاصی</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPresets.map((preset) => {
              const isSelected = draft.selectedMaterialId === preset.id;
              const currentActual = presetOverrides[preset.id] ?? preset.actualCm;
              const usedCount = usageStats[preset.id]?.count ?? 0;

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectMaterial(preset)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectMaterial(preset);
                    }
                  }}
                  className={`text-right rounded-2xl p-3.5 border transition flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/50 ring-1 ring-blue-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Real Studio Photo Thumbnail (bricks & blocks only) */}
                    <MaterialThumbnail
                      material={{
                        ...preset,
                        thicknessCm: currentActual.t,
                      }}
                      sizeClass="w-16 h-16 rounded-2xl"
                    />

                    <div className="min-w-0 space-y-1">
                      <div className="font-bold text-base text-slate-900 leading-snug">
                        {preset.name}
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1">
                        <span>{preset.isBuiltIn ? 'مصالح ثابت استاندارد' : 'مصالح ثبت‌شده شما'}</span>
                        {usedCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-blue-700 font-medium">پراستفاده شما</span>
                          </>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 pt-0.5 space-y-0.5 tabular-nums-fa">
                        {preset.isBuiltIn && (
                          <div>
                            اسمی: {formatFaNumber(preset.nominalCm.l, 1)}×
                            {formatFaNumber(preset.nominalCm.h, 1)}×
                            {formatFaNumber(preset.nominalCm.t, 1)} سانت
                          </div>
                        )}
                        <div className="text-slate-800 font-semibold">
                          ابعاد واقعی: {formatFaNumber(currentActual.l, 1)}×
                          {formatFaNumber(currentActual.h, 1)}×
                          {formatFaNumber(currentActual.t, 1)} سانت
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Column: Checkmark + Delete button ONLY for user-defined materials */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6" />
                    )}

                    {/* Strictly NO delete button on built-in presets! */}
                    {!preset.isBuiltIn && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteMat(preset);
                        }}
                        aria-label={`حذف ${preset.name}`}
                        className="min-h-[38px] min-w-[38px] -mb-1 -ml-1 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Editable Dimensions Box for Selected Material */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-slate-900 tabular-nums-fa">
              ابعاد محاسبه «{selectedPreset.name}»:{' '}
              {toPersianDigits(draft.activeDimensionsCm.l)} ×{' '}
              {toPersianDigits(draft.activeDimensionsCm.h)} ×{' '}
              {toPersianDigits(draft.activeDimensionsCm.t)} سانتی‌متر
            </div>

            <button
              type="button"
              onClick={() => setShowDimensionEditor((v) => !v)}
              className="min-h-[42px] px-3 rounded-lg text-sm font-semibold text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{showDimensionEditor ? 'بستن ویرایش ابعاد' : 'ویرایش ابعاد این مصالح'}</span>
            </button>
          </div>

          {showDimensionEditor && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    طول (سانت)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={toPersianDigits(draft.activeDimensionsCm.l)}
                    onChange={(e) => handleDimensionChange('l', e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 tabular-nums-fa focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ارتفاع (سانت)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={toPersianDigits(draft.activeDimensionsCm.h)}
                    onChange={(e) => handleDimensionChange('h', e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 tabular-nums-fa focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ضخامت (سانت)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={toPersianDigits(draft.activeDimensionsCm.t)}
                    onChange={(e) => handleDimensionChange('t', e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 tabular-nums-fa focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {hasCustomOverride && (
                <button
                  type="button"
                  onClick={handleResetDimensions}
                  className="min-h-[42px] px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازگرداندن به ابعاد اولیه</span>
                </button>
              )}
            </div>
          )}

          {thicknessWarning && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-amber-950">
              <span>
                توجه: ضخامت دیوار ({toPersianDigits(draft.wallThicknessCm)} سانت) از ضخامت مصالح (
                {toPersianDigits(draft.activeDimensionsCm.t)} سانت) کمتر است.
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeDraft((prev) => ({
                    ...prev,
                    wallThicknessCm: prev.activeDimensionsCm.t,
                  }))
                }
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-900 text-white font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                اصلاح ضخامت دیوار به {toPersianDigits(draft.activeDimensionsCm.t)} سانت
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mortar Joint, Mix Ratio, and Waste Settings */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">۲. مشخصات ملات و پرت مصالح</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            مقادیر پیش‌فرض طبق عرف دیوارچینی تنظیم شده‌اند؛ در صورت نیاز تغییر دهید.
          </p>
        </div>

        {/* Joint Thickness (cm) */}
        <div>
          <label htmlFor="joint-thickness" className="block text-sm font-bold text-slate-800 mb-2">
            ضخامت بند ملات (سانتی‌متر)
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2.5">
            {JOINT_QUICK_OPTIONS.map((val) => {
              const active = Number(draft.jointThicknessCm) === Number(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    onChangeDraft((prev) => ({...prev, jointThicknessCm: val}));
                    setErrorMsg(null);
                  }}
                  className={`min-h-[46px] rounded-xl text-sm sm:text-base font-bold tabular-nums-fa transition whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {toPersianDigits(val)} سانت
                </button>
              );
            })}
          </div>
          <div className="relative">
            <input
              id="joint-thickness"
              type="text"
              inputMode="decimal"
              value={toPersianDigits(draft.jointThicknessCm)}
              onChange={(e) => {
                onChangeDraft((prev) => ({
                  ...prev,
                  jointThicknessCm: sanitizeDecimalInput(e.target.value),
                }));
                setErrorMsg(null);
              }}
              className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 pl-24 text-base font-bold text-slate-900 tabular-nums-fa focus:border-blue-600 focus:outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 pointer-events-none">
              سانتی‌متر
            </span>
          </div>
        </div>

        {/* Mortar Mix Ratio */}
        <div>
          <span className="block text-sm font-bold text-slate-800 mb-2">
            عیار ملات (نسبت سیمان به ماسه)
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {MIX_RATIO_OPTIONS.map((opt) => {
              const active = draft.mixRatio === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangeDraft((prev) => ({...prev, mixRatio: opt.value}))}
                  className={`min-h-[58px] rounded-xl p-2.5 border text-center transition cursor-pointer ${
                    active
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-base tabular-nums-fa">{opt.label}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      active ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Waste Percentage */}
        <div>
          <label htmlFor="waste-percent" className="block text-sm font-bold text-slate-800 mb-2">
            درصد پرت و شکستگی آجر / بلوک
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2.5">
            {WASTE_QUICK_OPTIONS.map((val) => {
              const active = Number(draft.wastePercent) === Number(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    onChangeDraft((prev) => ({...prev, wastePercent: val}));
                    setErrorMsg(null);
                  }}
                  className={`min-h-[46px] rounded-xl text-sm sm:text-base font-bold tabular-nums-fa transition whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {toPersianDigits(val)}٪
                </button>
              );
            })}
          </div>
          <div className="relative">
            <input
              id="waste-percent"
              type="text"
              inputMode="decimal"
              value={toPersianDigits(draft.wastePercent)}
              onChange={(e) => {
                onChangeDraft((prev) => ({
                  ...prev,
                  wastePercent: sanitizeDecimalInput(e.target.value),
                }));
                setErrorMsg(null);
              }}
              className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 pl-16 text-base font-bold text-slate-900 tabular-nums-fa focus:border-blue-600 focus:outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 pointer-events-none">
              درصد
            </span>
          </div>
        </div>
      </section>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-900"
        >
          {errorMsg}
        </div>
      )}

      {/* Navigation Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[56px] px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-base flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowRight className="w-5 h-5" />
          <span>قبلی</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="flex-1 min-h-[56px] rounded-2xl bg-blue-700 hover:bg-blue-600 active:scale-[0.99] transition text-white font-bold text-lg flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>محاسبه مقدار مصالح</span>
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Delete User Material Confirmation Modal */}
      {confirmDeleteMat && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setConfirmDeleteMat(null)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">حذف مصالح ثبت‌شده</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              آیا از حذف «{confirmDeleteMat.name}» از فهرست مصالح خودتان مطمئن هستید؟
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onDeleteUserMaterial(confirmDeleteMat.id);
                  setConfirmDeleteMat(null);
                }}
                className="flex-1 min-h-[48px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm cursor-pointer"
              >
                بله، حذف شود
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteMat(null)}
                className="flex-1 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
