import React, {useState} from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  BookmarkCheck,
  Copy,
  FileDown,
  Loader2,
  MessageCircle,
  PlusCircle,
  Share2,
} from 'lucide-react';
import {MANDATORY_DISCLAIMER} from '../constants/materials';
import type {CalculationResult, CostResult, EstimateDraft, MaterialPreset} from '../types';
import {formatFaNumber, formatToman} from '../utils/formatters';
import {
  buildInvoicePlainText,
  buildWhatsAppUrl,
  generateInvoicePdfFile,
  shareOrSavePdfFile,
  sharePlainText,
} from '../utils/shareAndPdf';

interface InvoiceStepProps {
  draft: EstimateDraft;
  materialPreset: MaterialPreset;
  materialDisplayName: string;
  quantities: CalculationResult;
  costs: CostResult;
  isSavedAlready: boolean;
  onChangeProjectTitle: (title: string) => void;
  onSaveEstimate: () => void;
  onOpenCompare: () => void;
  onStartNewEstimate: () => void;
  onBackToPrices: () => void;
  onShowToast: (msg: string) => void;
}

export const InvoiceStep: React.FC<InvoiceStepProps> = ({
  draft,
  materialPreset,
  materialDisplayName,
  quantities,
  costs,
  isSavedAlready,
  onChangeProjectTitle,
  onSaveEstimate,
  onOpenCompare,
  onStartNewEstimate,
  onBackToPrices,
  onShowToast,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const exportPayload = {
    projectTitle: draft.projectTitle,
    dateIso: new Date().toISOString(),
    draft,
    materialName: materialDisplayName,
    unitLabel: materialPreset.unitLabel,
    quantities,
    costs,
  };

  const plainTextSummary = buildInvoicePlainText(exportPayload);
  const whatsAppHref = buildWhatsAppUrl(plainTextSummary);

  const handleShareText = async () => {
    const result = await sharePlainText(
      'پیش‌فاکتور مصالح دیوارچینی — بناسنج',
      plainTextSummary
    );
    if (result === 'copied') {
      onShowToast('متن پیش‌فاکتور کپی شد؛ در هر پیام‌رسانی می‌توانید جایگذاری کنید.');
    } else if (result === 'failed') {
      onShowToast('امکان اشتراک خودکار نبود؛ از دکمه واتساپ یا PDF استفاده کنید.');
    }
  };

  const handleShareOrDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfFile = await generateInvoicePdfFile(exportPayload);
      const outcome = await shareOrSavePdfFile(pdfFile);
      if (outcome === 'downloaded') {
        onShowToast('فایل PDF پیش‌فاکتور با موفقیت دانلود شد.');
      }
    } catch {
      onShowToast('خطا در ساخت فایل PDF. لطفاً از اشتراک متنی استفاده کنید.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const rows = [
    {
      title: `خرید ${materialDisplayName}`,
      qtyText: `${formatFaNumber(quantities.finalUnits, 0)} عدد`,
      unitPriceText:
        costs.pricePerUnit > 0 ? `${formatFaNumber(costs.pricePerUnit, 0)} تومان` : 'وارد نشده',
      rowTotal: costs.pricePerUnit > 0 ? formatToman(costs.materialCost) : '—',
    },
    {
      title: 'سیمان (کیسه ۵۰ کیلویی)',
      qtyText: `${formatFaNumber(quantities.cementBags, 0)} کیسه (${formatFaNumber(
        quantities.cementKg,
        1
      )} کیلو)`,
      unitPriceText:
        costs.pricePerCementBag > 0
          ? `${formatFaNumber(costs.pricePerCementBag, 0)} تومان`
          : 'وارد نشده',
      rowTotal: costs.pricePerCementBag > 0 ? formatToman(costs.cementCost) : '—',
    },
    {
      title: 'ماسه ملاتی',
      qtyText: `${formatFaNumber(quantities.sandKg, 0)} کیلوگرم`,
      unitPriceText:
        costs.pricePerKgSand > 0
          ? `${formatFaNumber(costs.pricePerKgSand, 2)} تومان`
          : 'وارد نشده',
      rowTotal: costs.pricePerKgSand > 0 ? formatToman(costs.sandCost) : '—',
    },
    {
      title: 'دستمزد اجرا و بنّایی',
      qtyText: `${formatFaNumber(quantities.netAreaM2, 2)} متر مربع`,
      unitPriceText:
        costs.laborPerM2 > 0
          ? `${formatFaNumber(costs.laborPerM2, 0)} تومان`
          : 'اختیاری (۰)',
      rowTotal: costs.laborPerM2 > 0 ? formatToman(costs.laborCost) : '۰ تومان',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Project Name Input */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-2">
        <label htmlFor="project-title" className="block text-sm font-bold text-slate-900">
          عنوان پروژه (برای ذخیره و بالای فاکتور)
        </label>
        <input
          id="project-title"
          type="text"
          value={draft.projectTitle}
          onChange={(e) => onChangeProjectTitle(e.target.value)}
          placeholder={`مثلاً دیوار حیاط شمالی (${materialDisplayName})`}
          className="w-full min-h-[50px] rounded-xl border border-slate-300 bg-slate-50 px-4 text-base font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
        />
      </section>

      {/* Main Invoice Card */}
      <section className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
        {/* Invoice Header */}
        <div className="bg-slate-900 text-white p-6 space-y-2">
          <div className="text-xs text-slate-300 tabular-nums-fa">
            ابعاد دیوار: {formatFaNumber(Number(draft.lengthM), 2)} ×{' '}
            {formatFaNumber(Number(draft.heightM), 2)} متر · مساحت خالص:{' '}
            {formatFaNumber(quantities.netAreaM2, 2)} متر مربع
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold">جدول ریز مصالح و هزینه‌ها</h2>
            <span className="text-xs text-slate-300 tabular-nums-fa">
              بند {formatFaNumber(quantities.jointM * 100, 1)} سانت · ملات ۱:
              {formatFaNumber(quantities.mixRatio, 0)}
            </span>
          </div>
        </div>

        {/* Itemized Cost Table */}
        <div className="divide-y divide-slate-200">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 tabular-nums-fa"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-base text-slate-900">{row.title}</div>
                <div className="text-xs text-slate-500">
                  مقدار: {row.qtyText} · فی واحد: {row.unitPriceText}
                </div>
              </div>
              <div className="text-left sm:text-left font-extrabold text-lg text-slate-900">
                {row.rowTotal}
              </div>
            </div>
          ))}
        </div>

        {/* Final Grand Total */}
        <div className="bg-blue-700 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 tabular-nums-fa">
          <div>
            <div className="text-sm text-blue-100">جمع کل قابل پرداخت</div>
            {!costs.hasAnyPrice && (
              <button
                type="button"
                onClick={onBackToPrices}
                className="text-xs underline text-white mt-1 cursor-pointer"
              >
                برای محاسبه جمع ریالی، قیمت واحدها را در مرحله قبل وارد کنید
              </button>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold">
            {costs.hasAnyPrice ? formatToman(costs.totalCost) : 'بدون قیمت واحد'}
          </div>
        </div>
      </section>

      {/* Primary Action: Save Estimate */}
      <button
        type="button"
        onClick={onSaveEstimate}
        className="w-full min-h-[56px] rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition text-white font-bold text-lg flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <BookmarkCheck className="w-5 h-5" />
        <span>{isSavedAlready ? 'به‌روزرسانی پروژه ذخیره‌شده' : 'ذخیره در لیست پروژه‌ها'}</span>
      </button>

      {/* Share & Export Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleShareOrDownloadPdf}
          disabled={isGeneratingPdf}
          className="min-h-[52px] px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-slate-900 font-bold text-sm sm:text-base flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-700" />
              <span>در حال ساخت PDF...</span>
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5 text-blue-700" />
              <span>دانلود و اشتراک PDF</span>
            </>
          )}
        </button>

        <a
          href={whatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[52px] px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <MessageCircle className="w-5 h-5" />
          <span>ارسال به واتساپ</span>
        </a>

        <button
          type="button"
          onClick={handleShareText}
          className="min-h-[50px] px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <>
              <Share2 className="w-4 h-4 text-slate-700" />
              <span>اشتراک‌گذاری متنی</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-700" />
              <span>کپی متن پیش‌فاکتور</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenCompare}
          className="min-h-[50px] px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeftRight className="w-4 h-4 text-blue-700" />
          <span>مقایسه با مصالح دیگر</span>
        </button>
      </div>

      {/* Bottom Secondary Controls */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onBackToPrices}
          className="min-h-[50px] px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>ویرایش قیمت‌ها</span>
        </button>

        <button
          type="button"
          onClick={onStartNewEstimate}
          className="flex-1 min-h-[50px] px-5 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>شروع محاسبه جدید</span>
        </button>
      </div>

      <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {MANDATORY_DISCLAIMER}
      </div>
    </div>
  );
};
