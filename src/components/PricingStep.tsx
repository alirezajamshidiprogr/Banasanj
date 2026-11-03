import React, {useState} from 'react';
import {ArrowLeft, ArrowRight, Calculator, Eraser} from 'lucide-react';
import type {
  CalculationResult,
  CostResult,
  MaterialPreset,
  PriceStrings,
} from '../types';
import {
  formatFaNumber,
  formatPriceFieldDisplay,
  formatToman,
  formatTomanScaleHint,
  parseNonNegativeNumber,
  parsePositiveNumber,
  sanitizePriceInput,
  toPersianDigits,
} from '../utils/formatters';

interface PricingStepProps {
  materialPreset: MaterialPreset;
  materialDisplayName: string;
  quantities: CalculationResult;
  prices: PriceStrings;
  costs: CostResult;
  hasPrefilledProfilePrices: boolean;
  onChangePrice: (field: keyof PriceStrings, rawValue: string) => void;
  onClearCurrentPrices: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const PricingStep: React.FC<PricingStepProps> = ({
  materialPreset,
  materialDisplayName,
  quantities,
  prices,
  costs,
  hasPrefilledProfilePrices,
  onChangePrice,
  onClearCurrentPrices,
  onBack,
  onNext,
}) => {
  const [showTonConverter, setShowTonConverter] = useState(false);
  const [tonSandInput, setTonSandInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTonChange = (raw: string) => {
    const clean = sanitizePriceInput(raw);
    setTonSandInput(clean);
    const tonVal = parsePositiveNumber(clean);
    if (tonVal) {
      const perKg = Math.round((tonVal / 1000) * 100) / 100;
      onChangePrice('pricePerKgSand', String(perKg));
    } else if (!clean) {
      onChangePrice('pricePerKgSand', '');
    }
  };

  const handleProceed = () => {
    // Validate that any entered number is positive (no negative values)
    const fields: Array<{val: string; label: string}> = [
      {val: prices.pricePerUnit, label: `قیمت هر عدد ${materialDisplayName}`},
      {val: prices.pricePerCementBag, label: 'قیمت کیسه سیمان'},
      {val: prices.pricePerKgSand, label: 'قیمت هر کیلو ماسه'},
      {val: prices.laborPerM2, label: 'دستمزد اجرا'},
    ];

    for (const f of fields) {
      if (f.val.trim() !== '') {
        const parsed = parseNonNegativeNumber(f.val);
        if (parsed === null || (f.label !== 'دستمزد اجرا' && parsed <= 0)) {
          setErrorMsg(`لطفاً مقدار «${f.label}» را به صورت عدد مثبت به تومان وارد کنید.`);
          return;
        }
      }
    }

    setErrorMsg(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">قیمت واحد مصالح (به تومان)</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              قیمت روز شهر یا مصالح‌فروشی خودتان را وارد کنید. قیمت‌های وارد شده برای دفعات بعد در گوشی شما ذخیره می‌شوند.
            </p>
          </div>

          {costs.hasAnyPrice && (
            <button
              type="button"
              onClick={() => {
                setTonSandInput('');
                onClearCurrentPrices();
              }}
              className="min-h-[42px] px-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eraser className="w-4 h-4" />
              <span>پاک کردن کادرها</span>
            </button>
          )}
        </div>

        {hasPrefilledProfilePrices && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-600">
            قیمت‌های قبلی که خودتان ثبت کرده بودید جایگذاری شدند؛ در صورت تغییر قیمت بازار، ویرایش کنید.
          </div>
        )}

        {/* 1. Price per Brick / Block */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="price-unit" className="text-sm font-bold text-slate-900">
              قیمت هر عدد {materialDisplayName}
            </label>
            <span className="text-xs text-slate-500 tabular-nums-fa">
              تعداد کل: {formatFaNumber(quantities.finalUnits, 0)} {materialPreset.unitLabel}
            </span>
          </div>
          <div className="relative">
            <input
              id="price-unit"
              type="text"
              inputMode="decimal"
              value={formatPriceFieldDisplay(prices.pricePerUnit)}
              onChange={(e) => {
                onChangePrice('pricePerUnit', sanitizePriceInput(e.target.value));
                setErrorMsg(null);
              }}
              placeholder="مبلغ هر عدد به تومان"
              className="w-full min-h-[54px] rounded-xl border border-slate-300 bg-white px-4 pl-16 text-lg font-bold text-slate-900 tabular-nums-fa placeholder:text-slate-400 placeholder:font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
              تومان
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 tabular-nums-fa min-h-[18px]">
            <span>{formatTomanScaleHint(prices.pricePerUnit)}</span>
            {costs.materialCost > 0 && (
              <span className="font-semibold text-slate-800">
                جمع این ردیف: {formatToman(costs.materialCost)}
              </span>
            )}
          </div>
        </div>

        {/* 2. Price per 50kg Cement Bag */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="price-cement" className="text-sm font-bold text-slate-900">
              قیمت هر کیسه ۵۰ کیلویی سیمان
            </label>
            <span className="text-xs text-slate-500 tabular-nums-fa">
              تعداد کل: {formatFaNumber(quantities.cementBags, 0)} کیسه
            </span>
          </div>
          <div className="relative">
            <input
              id="price-cement"
              type="text"
              inputMode="decimal"
              value={formatPriceFieldDisplay(prices.pricePerCementBag)}
              onChange={(e) => {
                onChangePrice('pricePerCementBag', sanitizePriceInput(e.target.value));
                setErrorMsg(null);
              }}
              placeholder="مبلغ هر کیسه به تومان"
              className="w-full min-h-[54px] rounded-xl border border-slate-300 bg-white px-4 pl-16 text-lg font-bold text-slate-900 tabular-nums-fa placeholder:text-slate-400 placeholder:font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
              تومان
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 tabular-nums-fa min-h-[18px]">
            <span>{formatTomanScaleHint(prices.pricePerCementBag)}</span>
            {costs.cementCost > 0 && (
              <span className="font-semibold text-slate-800">
                جمع این ردیف: {formatToman(costs.cementCost)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Price per Kg of Sand */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="price-sand" className="text-sm font-bold text-slate-900">
              قیمت هر کیلوگرم ماسه
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 tabular-nums-fa">
                مقدار کل: {formatFaNumber(quantities.sandKg, 0)} کیلوگرم
              </span>
              <button
                type="button"
                onClick={() => setShowTonConverter((v) => !v)}
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>تبدیل از قیمت هر تن</span>
              </button>
            </div>
          </div>

          {showTonConverter && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                اگر قیمت ماسه را به «تُن» می‌دانید وارد کنید تا قیمت هر کیلو خودکار حساب شود:
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatPriceFieldDisplay(tonSandInput)}
                  onChange={(e) => handleTonChange(e.target.value)}
                  placeholder="مبلغ یک تن ماسه به تومان"
                  className="w-full min-h-[46px] rounded-lg border border-slate-300 bg-white px-3 pl-20 text-base font-bold text-slate-900 tabular-nums-fa"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  تومان/تن
                </span>
              </div>
            </div>
          )}

          <div className="relative">
            <input
              id="price-sand"
              type="text"
              inputMode="decimal"
              value={
                prices.pricePerKgSand.includes('.')
                  ? toPersianDigits(prices.pricePerKgSand)
                  : formatPriceFieldDisplay(prices.pricePerKgSand)
              }
              onChange={(e) => {
                onChangePrice('pricePerKgSand', sanitizePriceInput(e.target.value));
                setErrorMsg(null);
              }}
              placeholder="مبلغ هر کیلوگرم ماسه به تومان"
              className="w-full min-h-[54px] rounded-xl border border-slate-300 bg-white px-4 pl-16 text-lg font-bold text-slate-900 tabular-nums-fa placeholder:text-slate-400 placeholder:font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
              تومان
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 tabular-nums-fa min-h-[18px]">
            <span>{formatTomanScaleHint(prices.pricePerKgSand)}</span>
            {costs.sandCost > 0 && (
              <span className="font-semibold text-slate-800">
                جمع این ردیف: {formatToman(costs.sandCost)}
              </span>
            )}
          </div>
        </div>

        {/* 4. Optional Labor Cost per m2 */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="price-labor" className="text-sm font-bold text-slate-900">
              دستمزد بنّایی هر متر مربع (اختیاری)
            </label>
            <span className="text-xs text-slate-500 tabular-nums-fa">
              مساحت: {formatFaNumber(quantities.netAreaM2, 2)} متر مربع
            </span>
          </div>
          <div className="relative">
            <input
              id="price-labor"
              type="text"
              inputMode="decimal"
              value={formatPriceFieldDisplay(prices.laborPerM2)}
              onChange={(e) => {
                onChangePrice('laborPerM2', sanitizePriceInput(e.target.value));
                setErrorMsg(null);
              }}
              placeholder="اختیاری — مبلغ دستمزد هر متر مربع"
              className="w-full min-h-[54px] rounded-xl border border-slate-300 bg-white px-4 pl-16 text-lg font-bold text-slate-900 tabular-nums-fa placeholder:text-slate-400 placeholder:font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
              تومان
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 tabular-nums-fa min-h-[18px]">
            <span>{formatTomanScaleHint(prices.laborPerM2)}</span>
            {costs.laborCost > 0 && (
              <span className="font-semibold text-slate-800">
                جمع دستمزد: {formatToman(costs.laborCost)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Running Total Preview */}
      <section className="rounded-2xl bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-3 tabular-nums-fa">
        <span className="text-sm text-slate-300">جمع کل تا این لحظه:</span>
        <span className="text-2xl font-extrabold">
          {costs.hasAnyPrice ? formatToman(costs.totalCost) : '۰ تومان'}
        </span>
      </section>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-900"
        >
          {errorMsg}
        </div>
      )}

      {/* Navigation Buttons */}
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
          <span>مشاهده پیش‌فاکتور نهایی</span>
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
