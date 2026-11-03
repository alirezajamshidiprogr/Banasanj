import React, {useState} from 'react';
import {
  ArrowLeft,
  BookmarkCheck,
  Calculator,
  Download,
  FileSpreadsheet,
  Info,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import {MANDATORY_DISCLAIMER} from '../constants/materials';
import type {SavedEstimate, SavedPriceProfile} from '../types';
import {formatFaNumber, formatJalaliDate, formatToman} from '../utils/formatters';
import {BrickIcon, CementBagIcon, SandPileIcon} from './MaterialIcons';

interface HomeScreenProps {
  savedEstimates: SavedEstimate[];
  priceProfile: SavedPriceProfile;
  hasActiveDraft: boolean;
  onStartNewEstimate: (resetDraft: boolean) => void;
  onOpenSavedList: () => void;
  onOpenSavedEstimate: (estimate: SavedEstimate) => void;
  onOpenPriceProfile: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstallApp: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  savedEstimates,
  priceProfile,
  hasActiveDraft,
  onStartNewEstimate,
  onOpenSavedList,
  onOpenSavedEstimate,
  onOpenPriceProfile,
  isInstallable,
  isInstalled,
  isIOS,
  onInstallApp,
}) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const savedPricesCount =
    Object.values(priceProfile.unitPricesByMaterialId).filter(Boolean).length +
    (priceProfile.pricePerCementBag ? 1 : 0) +
    (priceProfile.pricePerKgSand ? 1 : 0) +
    (priceProfile.laborPerM2 ? 1 : 0);

  const recentSaved = savedEstimates.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero Primary Action Card */}
      <section className="rounded-3xl bg-slate-900 p-6 sm:p-8 text-white">
        <p className="text-sm text-slate-300 mb-2">
          ویژه بنّا، سرکارگر و مالک · کارکرد کاملاً آفلاین
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance mb-3">
          برآورد دقیق آجر، بلوک، سیمان، ماسه و هزینه دیوارچینی
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mb-6">
          ابعاد دیوار را وارد کنید، نوع آجر یا بلوک را انتخاب کنید و لیست کامل مصالح و پیش‌فاکتور ریالی (تومان) را آماده دریافت و اشتراک‌گذاری کنید.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => onStartNewEstimate(true)}
            className="min-h-[52px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition text-white font-bold text-base flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calculator className="w-5 h-5" />
            <span>محاسبه جدید دیوار</span>
          </button>

          {hasActiveDraft && (
            <button
              type="button"
              onClick={() => onStartNewEstimate(false)}
              className="min-h-[52px] px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.99] transition text-white font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ادامه محاسبه قبلی</span>
            </button>
          )}
        </div>
      </section>

      {/* Main Navigation Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saved Estimates Card */}
        <button
          type="button"
          onClick={onOpenSavedList}
          className="text-right rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-300 active:scale-[0.99] transition flex flex-col justify-between min-h-[132px] cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">محاسبه‌های ذخیره‌شده</h2>
            <p className="text-sm text-slate-600 tabular-nums-fa">
              {savedEstimates.length > 0
                ? `${formatFaNumber(savedEstimates.length, 0)} پروژه ذخیره‌شده در گوشی`
                : 'هنوز پروژه‌ای ذخیره نکرده‌اید'}
            </p>
          </div>
        </button>

        {/* Saved Price Profile Card */}
        <button
          type="button"
          onClick={onOpenPriceProfile}
          className="text-right rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-300 active:scale-[0.99] transition flex flex-col justify-between min-h-[132px] cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">دفترچه قیمت مصالح</h2>
            <p className="text-sm text-slate-600 tabular-nums-fa">
              {savedPricesCount > 0
                ? `${formatFaNumber(savedPricesCount, 0)} ردیف قیمت ذخیره‌شده توسط شما`
                : 'ثبت قیمت آجر، سیمان و ماسه برای استفاده بعدی'}
            </p>
          </div>
        </button>

        {/* About & Disclaimer Card */}
        <button
          type="button"
          onClick={() => setShowAboutModal(true)}
          className="text-right rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-300 active:scale-[0.99] transition flex flex-col justify-between min-h-[132px] cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">درباره بناسنج و راهنما</h2>
            <p className="text-sm text-slate-600">
              روش محاسبه مصالح و نکات مهم اجرایی
            </p>
          </div>
        </button>
      </section>

      {/* Optional PWA Install Card when not yet installed */}
      {!isInstalled && (isInstallable || isIOS) && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              نصب بناسنج روی صفحه اصلی گوشی
            </h2>
            <p className="text-sm text-slate-600">
              بدون نیاز به اینترنت سر ساختمان، همیشه به محاسبه‌گر مصالح دسترسی داشته باشید.
            </p>
          </div>
          {isInstallable ? (
            <button
              type="button"
              onClick={onInstallApp}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>نصب اپلیکیشن</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-900 text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>راهنمای نصب در آیفون</span>
            </button>
          )}
        </section>
      )}

      {/* Recent Saved Projects Quick Access */}
      {recentSaved.length > 0 && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">آخرین پروژه‌های شما</h2>
            <button
              type="button"
              onClick={onOpenSavedList}
              className="min-h-[44px] px-2 text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              مشاهده همه
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSaved.map((est) => (
              <button
                key={est.id}
                type="button"
                onClick={() => onOpenSavedEstimate(est)}
                className="w-full py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 text-right hover:bg-slate-50 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="font-bold text-base text-slate-900 truncate">
                    {est.projectTitle || `دیوار با ${est.materialName}`}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 tabular-nums-fa">
                    <span>{est.materialName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatFaNumber(est.quantities.netAreaM2, 1)} متر مربع</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatJalaliDate(est.updatedAt)}</span>
                  </div>
                </div>
                <div className="text-left shrink-0 tabular-nums-fa">
                  <div className="text-sm font-bold text-slate-900">
                    {est.costs.hasAnyPrice
                      ? formatToman(est.costs.totalCost)
                      : `${formatFaNumber(est.quantities.finalUnits, 0)} عدد`}
                  </div>
                  <div className="text-xs text-blue-700 mt-0.5">باز کردن</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Quick Visual Guide of Supported Materials */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          چیزی که بناسنج در ۵ گام ساده برایتان حساب می‌کند
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3.5 flex items-center gap-3">
            <BrickIcon className="w-6 h-6 text-blue-700 shrink-0" />
            <span className="font-semibold text-slate-800">تعداد آجر و بلوک</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5 flex items-center gap-3">
            <CementBagIcon className="w-6 h-6 text-blue-700 shrink-0" />
            <span className="font-semibold text-slate-800">کیسه سیمان ۵۰ کیلویی</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5 flex items-center gap-3">
            <SandPileIcon className="w-6 h-6 text-blue-700 shrink-0" />
            <span className="font-semibold text-slate-800">ماسه به کیلو و تن</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5 flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-blue-700 shrink-0" />
            <span className="font-semibold text-slate-800">پیش‌فاکتور PDF و واتساپ</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {MANDATORY_DISCLAIMER}
        </div>
      </section>

      {/* About / Disclaimer Modal */}
      {showAboutModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <h3 className="text-xl font-bold text-slate-900">درباره بناسنج</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              «بناسنج» ابزاری ساده و آفلاین برای بنّاها، سرکارگران و مالکان در ایران است تا پیش از خرید مصالح، تعداد دقیق آجر یا بلوک، مقدار ماسه و کیسه‌های سیمان و جمع کل هزینه دیوارچینی را به تومان محاسبه کنند.
            </p>
            <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">مبنای محاسبات استاندارد برنامه:</p>
              <p>۱. مساحت خالص پس از کسر در و پنجره‌ها محاسبه می‌شود.</p>
              <p>۲. تعداد واحد مصالح بر اساس ابعاد واقعی آجر یا بلوک، ضخامت بند ملات و درصد پرت (پیش‌فرض ۵٪) به بالا گرد می‌شود.</p>
              <p>۳. حجم ملات خشک با ضریب تراکم ۱٫۳۳ نسبت به ملات تر و وزن مخصوص سیمان ۱۴۴۰ و ماسه ۱۶۰۰ کیلوگرم بر متر مکعب حساب می‌شود.</p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm font-medium text-amber-950 leading-relaxed">
              {MANDATORY_DISCLAIMER}
            </div>
            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* iOS Install Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">نصب بناسنج در آیفون و آیپد</h3>
            <ol className="space-y-2 text-sm text-slate-700 leading-relaxed list-decimal list-inside">
              <li>در نوار پایین مرورگر سافاری روی دکمه اشتراک‌گذاری (Share) بزنید.</li>
              <li>گزینه Add to Home Screen را انتخاب کنید.</li>
              <li>دکمه Add در بالای صفحه را بزنید تا اپ نصب شود.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
