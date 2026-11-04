import React, {useState} from 'react';
import {ArrowLeft, Loader2, Plus, Sparkles, Trash2, Wand2} from 'lucide-react';
import {getMaterialById} from '../constants/materials';
import type {DimensionsCm, EstimateDraft, MaterialPreset, OpeningItem} from '../types';
import {
  formatFaNumber,
  parsePositiveNumber,
  sanitizeDecimalInput,
  toPersianDigits,
} from '../utils/formatters';
import {parseNaturalLanguageWall} from '../utils/nlpParser';

interface DimensionsStepProps {
  draft: EstimateDraft;
  userMaterials: MaterialPreset[];
  presetOverrides: Record<string, DimensionsCm>;
  onChangeDraft: (updater: (prev: EstimateDraft) => EstimateDraft) => void;
  onNextStep: () => void;
  onBackToServices: () => void;
}

const THICKNESS_QUICK_OPTIONS = [10, 15, 20, 35];

export const DimensionsStep: React.FC<DimensionsStepProps> = ({
  draft,
  userMaterials,
  presetOverrides,
  onChangeDraft,
  onNextStep,
  onBackToServices,
}) => {
  const [nlText, setNlText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [nlFeedback, setNlFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const lengthVal = parsePositiveNumber(draft.lengthM);
  const heightVal = parsePositiveNumber(draft.heightM);
  const thicknessVal = parsePositiveNumber(draft.wallThicknessCm);

  const grossArea = lengthVal && heightVal ? lengthVal * heightVal : 0;

  const openingsTotalArea = draft.openings.reduce((acc, item) => {
    const w = parsePositiveNumber(item.widthM) ?? 0;
    const h = parsePositiveNumber(item.heightM) ?? 0;
    return acc + w * h;
  }, 0);

  const netArea = Math.max(0, grossArea - openingsTotalArea);

  const handleSmartParse = async () => {
    const trimmed = nlText.trim();
    if (!trimmed) {
      setNlFeedback({
        type: 'info',
        message: 'لطفاً ابتدا جمله‌ای مثل نمونه بالا بنویسید و سپس دکمه تشخیص را بزنید.',
      });
      return;
    }

    setIsParsing(true);
    setNlFeedback(null);
    setValidationError(null);

    const result = await parseNaturalLanguageWall(trimmed, userMaterials);
    setIsParsing(false);

    if (!result.parsed) {
      setNlFeedback({
        type: 'info',
        message:
          'نتوانستیم ابعاد را از این جمله تشخیص دهیم. کادرهای دستی بدون تغییر ماندند؛ لطفاً اعداد را پایین وارد کنید.',
      });
      return;
    }

    onChangeDraft((prev) => {
      const next = {...prev};
      if (result.lengthM && result.lengthM > 0) {
        next.lengthM = String(result.lengthM);
      }
      if (result.heightM && result.heightM > 0) {
        next.heightM = String(result.heightM);
      }
      if (result.materialPresetId) {
        const preset = getMaterialById(result.materialPresetId, userMaterials);
        const dims = presetOverrides[preset.id] ?? preset.actualCm;
        next.selectedMaterialId = preset.id;
        next.customMaterialName = preset.name;
        next.activeDimensionsCm = {
          l: String(dims.l),
          h: String(dims.h),
          t: String(dims.t),
        };
        if (!result.wallThicknessCm) {
          next.wallThicknessCm = String(preset.recommendedWallThicknessCm);
        }
      }
      if (result.wallThicknessCm && result.wallThicknessCm > 0) {
        next.wallThicknessCm = String(result.wallThicknessCm);
      }
      if (result.openings && result.openings.length > 0) {
        next.openings = result.openings.map((op, i) => ({
          id: `nl-${Date.now()}-${i}`,
          label: op.label || 'بازشو',
          widthM: String(op.widthM),
          heightM: String(op.heightM),
        }));
      }
      return next;
    });

    const parts: string[] = [];
    if (result.lengthM) parts.push(`طول ${formatFaNumber(result.lengthM, 2)} متر`);
    if (result.heightM) parts.push(`ارتفاع ${formatFaNumber(result.heightM, 2)} متر`);
    if (result.wallThicknessCm) {
      parts.push(`ضخامت ${formatFaNumber(result.wallThicknessCm, 1)} سانتی‌متر`);
    }
    if (result.materialPresetId) {
      parts.push(`مصالح ${getMaterialById(result.materialPresetId, userMaterials).name}`);
    }

    setNlFeedback({
      type: 'success',
      message: `با موفقیت پر شد: ${parts.join(' · ')}. می‌توانید مقادیر زیر را بررسی یا ویرایش کنید.`,
    });
  };

  const addOpening = (defaultLabel: 'در' | 'پنجره') => {
    const newItem: OpeningItem = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: defaultLabel,
      widthM: '',
      heightM: '',
    };
    onChangeDraft((prev) => ({
      ...prev,
      openings: [...prev.openings, newItem],
    }));
    setValidationError(null);
  };

  const updateOpening = (id: string, field: keyof OpeningItem, value: string) => {
    onChangeDraft((prev) => ({
      ...prev,
      openings: prev.openings.map((op) =>
        op.id === id
          ? {
              ...op,
              [field]: field === 'label' ? value : sanitizeDecimalInput(value),
            }
          : op
      ),
    }));
    setValidationError(null);
  };

  const removeOpening = (id: string) => {
    onChangeDraft((prev) => ({
      ...prev,
      openings: prev.openings.filter((op) => op.id !== id),
    }));
    setValidationError(null);
  };

  const handleContinue = () => {
    if (!lengthVal) {
      setValidationError('لطفاً طول دیوار را به صورت عدد مثبت (بزرگ‌تر از صفر) وارد کنید.');
      return;
    }
    if (!heightVal) {
      setValidationError('لطفاً ارتفاع دیوار را به صورت عدد مثبت (بزرگ‌تر از صفر) وارد کنید.');
      return;
    }
    if (!thicknessVal) {
      setValidationError('لطفاً ضخامت دیوار را به صورت عدد مثبت به سانتی‌متر وارد کنید.');
      return;
    }

    for (let i = 0; i < draft.openings.length; i++) {
      const op = draft.openings[i];
      const w = parsePositiveNumber(op.widthM);
      const h = parsePositiveNumber(op.heightM);
      if (!w || !h) {
        setValidationError(
          `لطفاً عرض و ارتفاع «${op.label || 'بازشو'}» ردیف ${formatFaNumber(
            i + 1,
            0
          )} را کامل و مثبت وارد کنید یا آن را حذف کنید.`
        );
        return;
      }
    }

    if (openingsTotalArea >= grossArea) {
      setValidationError(
        'مجموع مساحت در و پنجره‌ها نمی‌تواند بیشتر یا مساوی مساحت کل دیوار باشد.'
      );
      return;
    }

    setValidationError(null);
    onNextStep();
  };

  return (
    <div className="space-y-6">
      {/* Active Service Context Bar */}
      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-slate-600 px-1">
        <div>
          نوع خدمات بنّایی: <strong className="text-slate-900">دیوارکشی و تیغه‌چینی</strong>
        </div>
        <button
          type="button"
          onClick={onBackToServices}
          className="text-blue-700 font-semibold hover:underline cursor-pointer"
        >
          مشاهده سایر خدمات
        </button>
      </div>

      {/* AI Natural Language Input Box */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="nl-wall-input"
            className="text-base font-bold text-slate-900 flex items-center gap-2"
          >
            <Wand2 className="w-5 h-5 text-blue-700 shrink-0" />
            <span>ورود سریع با جمله فارسی (اختیاری)</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="nl-wall-input"
            type="text"
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSmartParse();
              }
            }}
            placeholder="مثلاً ۴ متر دیوار با ارتفاع ۲ متر آجر سفال ۱۰ سانتی"
            className="flex-1 min-h-[50px] rounded-xl border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
          <button
            type="button"
            onClick={handleSmartParse}
            disabled={isParsing}
            className="min-h-[50px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال تشخیص...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>پر کردن خودکار</span>
              </>
            )}
          </button>
        </div>

        {nlFeedback && (
          <div
            role="status"
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed border ${
              nlFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {nlFeedback.message}
          </div>
        )}
      </section>

      {/* Manual Wall Dimensions Card */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">۱. ابعاد دیوار</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            طول و ارتفاع را به متر و ضخامت دیوار را به سانتی‌متر وارد کنید.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wall Length */}
          <div>
            <label htmlFor="wall-length" className="block text-sm font-bold text-slate-800 mb-1.5">
              طول دیوار (متر)
            </label>
            <div className="relative">
              <input
                id="wall-length"
                type="text"
                inputMode="decimal"
                value={toPersianDigits(draft.lengthM)}
                onChange={(e) => {
                  const clean = sanitizeDecimalInput(e.target.value);
                  onChangeDraft((prev) => ({...prev, lengthM: clean}));
                  setValidationError(null);
                }}
                placeholder="مثلاً ۴"
                className="w-full min-h-[54px] rounded-xl border border-slate-300 bg-white px-4 pl-14 text-xl font-bold text-slate-900 tabular-nums-fa placeholder:text-slate-300 placeholder:font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 pointer-events-none">
                متر
              </span>
            </div>
          </div>

          {/* Wall Height */}
          <div>
            <label htmlFor="wall-height" className="block text-sm font-bold text-slate-800 mb-1.5">
              ارتفاع دیوار (متر)
            </label>
            <div className="relative">
              <input
                id="wall-height"
                type="text"
                inputMode="decimal"
                value={toPersianDigits(draft.heightM)}
                onChange={(e) => {
                  const clean = sanitizeDecimalInput(e.target.value);
                  onChangeDraft((prev) => ({...prev, heightM: clean}));
                  setValidationError(null);
                }}
                placeholder="مثلاً ۲"
                className="w-full min-h-[54px] rounded-xl border border-slate-300 bg-white px-4 pl-14 text-xl font-bold text-slate-900 tabular-nums-fa placeholder:text-slate-300 placeholder:font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 pointer-events-none">
                متر
              </span>
            </div>
          </div>
        </div>

        {/* Wall Thickness */}
        <div>
          <label
            htmlFor="wall-thickness"
            className="block text-sm font-bold text-slate-800 mb-1.5"
          >
            ضخامت دیوار (سانتی‌متر)
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2.5">
            {THICKNESS_QUICK_OPTIONS.map((cm) => {
              const active = Number(draft.wallThicknessCm) === cm;
              return (
                <button
                  key={cm}
                  type="button"
                  onClick={() => {
                    onChangeDraft((prev) => ({...prev, wallThicknessCm: String(cm)}));
                    setValidationError(null);
                  }}
                  className={`min-h-[46px] rounded-xl text-base font-bold tabular-nums-fa transition whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {formatFaNumber(cm, 0)} سانت
                </button>
              );
            })}
          </div>
          <div className="relative">
            <input
              id="wall-thickness"
              type="text"
              inputMode="decimal"
              value={toPersianDigits(draft.wallThicknessCm)}
              onChange={(e) => {
                const clean = sanitizeDecimalInput(e.target.value);
                onChangeDraft((prev) => ({...prev, wallThicknessCm: clean}));
                setValidationError(null);
              }}
              placeholder="ضخامت دلخواه به سانتی‌متر"
              className="w-full min-h-[50px] rounded-xl border border-slate-300 bg-white px-4 pl-24 text-lg font-bold text-slate-900 tabular-nums-fa focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 pointer-events-none">
              سانتی‌متر
            </span>
          </div>
        </div>
      </section>

      {/* Openings (Doors / Windows) Section */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">۲. کسر در و پنجره (اختیاری)</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              اگر در یا پنجره‌ای داخل دیوار هست اضافه کنید تا از متراژ کم شود.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addOpening('در')}
              className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن در</span>
            </button>
            <button
              type="button"
              onClick={() => addOpening('پنجره')}
              className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن پنجره</span>
            </button>
          </div>
        </div>

        {draft.openings.length > 0 && (
          <div className="space-y-3 pt-1">
            {draft.openings.map((op, index) => {
              const w = parsePositiveNumber(op.widthM);
              const h = parsePositiveNumber(op.heightM);
              const opArea = w && h ? w * h : 0;

              return (
                <div
                  key={op.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {op.label} {formatFaNumber(index + 1, 0)}
                      </span>
                      {opArea > 0 && (
                        <span className="text-xs text-slate-500 tabular-nums-fa">
                          · مساحت: {formatFaNumber(opArea, 2)} متر مربع
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOpening(op.id)}
                      aria-label="حذف بازشو"
                      className="min-h-[44px] min-w-[44px] rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        عرض (متر)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={toPersianDigits(op.widthM)}
                        onChange={(e) => updateOpening(op.id, 'widthM', e.target.value)}
                        placeholder="مثلاً ۱"
                        className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 tabular-nums-fa focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ارتفاع (متر)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={toPersianDigits(op.heightM)}
                        onChange={(e) => updateOpening(op.id, 'heightM', e.target.value)}
                        placeholder="مثلاً ۲٫۱"
                        className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 tabular-nums-fa focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Net Area Summary Strip */}
        {grossArea > 0 && (
          <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 tabular-nums-fa">
            <div className="text-sm text-slate-300">
              مساحت کل: {formatFaNumber(grossArea, 2)} متر مربع
              {openingsTotalArea > 0 && (
                <span> · کسر بازشو: {formatFaNumber(openingsTotalArea, 2)} متر مربع</span>
              )}
            </div>
            <div className="text-base font-bold">
              مساحت خالص: {formatFaNumber(netArea, 2)} متر مربع
            </div>
          </div>
        )}
      </section>

      {/* Validation Error */}
      {validationError && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-900 leading-relaxed"
        >
          {validationError}
        </div>
      )}

      {/* Primary Step Action */}
      <button
        type="button"
        onClick={handleContinue}
        className="w-full min-h-[56px] rounded-2xl bg-blue-700 hover:bg-blue-600 active:scale-[0.99] transition text-white font-bold text-lg flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <span>ادامه: انتخاب آجر یا بلوک</span>
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );
};
