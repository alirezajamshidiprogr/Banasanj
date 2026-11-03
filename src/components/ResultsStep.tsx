import React, {useState} from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {MANDATORY_DISCLAIMER} from '../constants/materials';
import type {CalculationResult, EstimateDraft, MaterialPreset} from '../types';
import {formatFaNumber} from '../utils/formatters';
import {
  BlockIcon,
  BrickIcon,
  CementBagIcon,
  MortarTubIcon,
  SandPileIcon,
  WallAreaIcon,
} from './MaterialIcons';

interface ResultsStepProps {
  draft: EstimateDraft;
  materialPreset: MaterialPreset;
  materialDisplayName: string;
  quantities: CalculationResult;
  onOpenCompare: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const ResultsStep: React.FC<ResultsStepProps> = ({
  draft,
  materialPreset,
  materialDisplayName,
  quantities,
  onOpenCompare,
  onBack,
  onNext,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Summary Strip */}
      <section className="rounded-2xl bg-slate-900 text-white p-5">
        <div className="text-xs text-slate-300 mb-1 tabular-nums-fa">
          دیوار {formatFaNumber(Number(draft.lengthM), 2)} × {formatFaNumber(Number(draft.heightM), 2)} متر
          {' · '}ضخامت {formatFaNumber(Number(draft.wallThicknessCm), 1)} سانتی‌متر
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{materialDisplayName}</h2>
          <div className="text-sm text-slate-300 tabular-nums-fa">
            بند ملات {formatFaNumber(quantities.jointM * 100, 1)} سانت · عیار ۱:
            {formatFaNumber(quantities.mixRatio, 0)} · پرت {formatFaNumber(quantities.wastePercent, 1)}٪
          </div>
        </div>
      </section>

      {/* Big Quantity Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Brick / Block Count */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            {materialPreset.category === 'block' ? (
              <BlockIcon className="w-7 h-7" />
            ) : (
              <BrickIcon className="w-7 h-7" />
            )}
          </div>
          <div className="min-w-0 tabular-nums-fa">
            <div className="text-sm font-semibold text-slate-600">
              تعداد {materialPreset.unitLabel} مورد نیاز
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatFaNumber(quantities.finalUnits, 0)}{' '}
              <span className="text-base font-bold text-slate-600">عدد</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              با احتساب {formatFaNumber(quantities.wastePercent, 1)}٪ پرت (گرد شده به بالا)
            </div>
          </div>
        </div>

        {/* 2. Cement Bags & Kg */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <CementBagIcon className="w-7 h-7" />
          </div>
          <div className="min-w-0 tabular-nums-fa">
            <div className="text-sm font-semibold text-slate-600">سیمان مورد نیاز</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatFaNumber(quantities.cementBags, 0)}{' '}
              <span className="text-base font-bold text-slate-600">کیسه ۵۰ کیلویی</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              وزن دقیق سیمان: {formatFaNumber(quantities.cementKg, 1)} کیلوگرم
            </div>
          </div>
        </div>

        {/* 3. Sand (Kg & Ton) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <SandPileIcon className="w-7 h-7" />
          </div>
          <div className="min-w-0 tabular-nums-fa">
            <div className="text-sm font-semibold text-slate-600">ماسه شسته / ملاتی</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatFaNumber(quantities.sandKg, 0)}{' '}
              <span className="text-base font-bold text-slate-600">کیلوگرم</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              معادل تقریبی {formatFaNumber(quantities.sandKg / 1000, 2)} تن
            </div>
          </div>
        </div>

        {/* 4. Net Wall Area */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <WallAreaIcon className="w-7 h-7" />
          </div>
          <div className="min-w-0 tabular-nums-fa">
            <div className="text-sm font-semibold text-slate-600">مساحت خالص دیوار</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatFaNumber(quantities.netAreaM2, 2)}{' '}
              <span className="text-base font-bold text-slate-600">متر مربع</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {quantities.openingsAreaM2 > 0
                ? `پس از کسر ${formatFaNumber(quantities.openingsAreaM2, 2)} متر مربع بازشو`
                : 'بدون بازشو (در و پنجره)'}
            </div>
          </div>
        </div>

        {/* 5. Wet & Dry Mortar Volume (Full Width) */}
        <div className="sm:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <MortarTubIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-600">حجم ملات مصرفی</div>
              <div className="text-xs text-slate-500 mt-0.5">
                محاسبه شده با ضریب افت و تراکم ۱٫۳۳
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-8 tabular-nums-fa border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div>
              <div className="text-xs text-slate-500">حجم ملات تر</div>
              <div className="text-lg font-extrabold text-slate-900">
                {formatFaNumber(quantities.wetMortarTotalM3, 3)}{' '}
                <span className="text-xs font-semibold text-slate-600">متر مکعب</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">حجم ملات خشک</div>
              <div className="text-lg font-extrabold text-slate-900">
                {formatFaNumber(quantities.dryMortarTotalM3, 3)}{' '}
                <span className="text-xs font-semibold text-slate-600">متر مکعب</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare Mode Secondary Button */}
      <button
        type="button"
        onClick={onOpenCompare}
        className="w-full min-h-[50px] rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-sm sm:text-base flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <ArrowLeftRight className="w-5 h-5 text-blue-700" />
        <span>مقایسه این مصالح با گزینه دیگر (آجر در برابر بلوک)</span>
      </button>

      {/* Expandable Calculation Details («جزئیات محاسبه») */}
      <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className="w-full min-h-[54px] px-5 py-3.5 flex items-center justify-between text-right hover:bg-slate-50 transition cursor-pointer"
        >
          <span className="font-bold text-base text-slate-900">جزئیات محاسبه و فرمول‌ها</span>
          {showDetails ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {showDetails && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3 text-sm text-slate-700 tabular-nums-fa leading-relaxed">
            <div className="grid grid-cols-1 gap-2.5 bg-slate-50 rounded-xl p-4">
              <div>
                <span className="font-bold text-slate-900">۱. مساحت خالص دیوار: </span>
                ({formatFaNumber(Number(draft.lengthM), 2)} ×{' '}
                {formatFaNumber(Number(draft.heightM), 2)}) −{' '}
                {formatFaNumber(quantities.openingsAreaM2, 2)} ={' '}
                <strong>{formatFaNumber(quantities.netAreaM2, 2)} متر مربع</strong>
              </div>

              <div>
                <span className="font-bold text-slate-900">۲. تعداد در هر متر مربع: </span>
                ۱ ÷ (({formatFaNumber(quantities.unitLM, 3)} +{' '}
                {formatFaNumber(quantities.jointM, 3)}) × ({formatFaNumber(quantities.unitHM, 3)} +{' '}
                {formatFaNumber(quantities.jointM, 3)})) ={' '}
                <strong>{formatFaNumber(quantities.unitsPerM2, 2)} عدد</strong>
              </div>

              <div>
                <span className="font-bold text-slate-900">۳. تعداد کل با پرت: </span>
                سقف( {formatFaNumber(quantities.theoreticalUnits, 2)} × (۱ +{' '}
                {formatFaNumber(quantities.wastePercent, 1)}٪) ) ={' '}
                <strong>{formatFaNumber(quantities.finalUnits, 0)} عدد</strong>
              </div>

              <div>
                <span className="font-bold text-slate-900">۴. حجم خالص آجر/بلوک در متر مربع: </span>
                {formatFaNumber(quantities.unitsPerM2, 2)} × {formatFaNumber(quantities.unitLM, 3)} ×{' '}
                {formatFaNumber(quantities.unitHM, 3)} × {formatFaNumber(quantities.unitTM, 3)} ={' '}
                <strong>{formatFaNumber(quantities.solidUnitVolumePerM2, 4)} متر مکعب</strong>
              </div>

              <div>
                <span className="font-bold text-slate-900">۵. ملات تر و خشک کل: </span>
                ملات تر هر متر مربع ({formatFaNumber(quantities.wetMortarPerM2, 4)}) ×{' '}
                {formatFaNumber(quantities.netAreaM2, 2)} ={' '}
                <strong>{formatFaNumber(quantities.wetMortarTotalM3, 3)} متر مکعب</strong> · ملات خشک
                (× ۱٫۳۳) ={' '}
                <strong>{formatFaNumber(quantities.dryMortarTotalM3, 3)} متر مکعب</strong>
              </div>

              <div>
                <span className="font-bold text-slate-900">۶. وزن سیمان و ماسه (عیار ۱:{formatFaNumber(quantities.mixRatio, 0)}): </span>
                سیمان = ({formatFaNumber(quantities.dryMortarTotalM3, 3)} ÷{' '}
                {formatFaNumber(1 + quantities.mixRatio, 0)}) × ۱۴۴۰ ={' '}
                <strong>{formatFaNumber(quantities.cementKg, 1)} کیلوگرم</strong> (
                {formatFaNumber(quantities.cementBags, 0)} کیسه ۵۰ کیلویی) · ماسه ={' '}
                ({formatFaNumber(quantities.sandVolumeM3, 3)} × ۱۶۰۰) ={' '}
                <strong>{formatFaNumber(quantities.sandKg, 1)} کیلوگرم</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Mandatory Disclaimer */}
      <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {MANDATORY_DISCLAIMER}
      </div>

      {/* Step Navigation */}
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
          onClick={onNext}
          className="flex-1 min-h-[56px] rounded-2xl bg-blue-700 hover:bg-blue-600 active:scale-[0.99] transition text-white font-bold text-lg flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>ادامه: وارد کردن قیمت‌ها</span>
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
