import React, {useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {
  ArrowLeft,
  BookmarkCheck,
  Calculator,
  Clock,
  Download,
  HardHat,
  Info,
  Layers,
  PaintBucket,
  Plus,
  RotateCcw,
  Smartphone,
  Wallet,
} from 'lucide-react';
import {
  BUILT_IN_MATERIAL_PRESETS,
  CONSTRUCTION_SERVICES,
  MANDATORY_DISCLAIMER,
} from '../constants/materials';
import type {
  ConstructionServiceDef,
  MaterialPreset,
  SavedEstimate,
  SavedPriceProfile,
} from '../types';
import {formatFaNumber, formatJalaliDate, formatToman} from '../utils/formatters';
import {WallAreaIcon} from './MaterialIcons';
import {MaterialThumbnail} from './MaterialThumbnail';

interface HomeScreenProps {
  savedEstimates: SavedEstimate[];
  priceProfile: SavedPriceProfile;
  userMaterials: MaterialPreset[];
  hasActiveDraft: boolean;
  onStartNewEstimate: (resetDraft: boolean) => void;
  onOpenSavedList: () => void;
  onOpenSavedEstimate: (estimate: SavedEstimate) => void;
  onOpenPriceProfile: () => void;
  onOpenAddMaterialModal: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstallApp: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  savedEstimates,
  priceProfile,
  userMaterials,
  hasActiveDraft,
  onStartNewEstimate,
  onOpenSavedList,
  onOpenSavedEstimate,
  onOpenPriceProfile,
  onOpenAddMaterialModal,
  isInstallable,
  isInstalled,
  isIOS,
  onInstallApp,
}) => {
  const isNativePlatform = Capacitor.isNativePlatform();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [selectedUpcomingService, setSelectedUpcomingService] =
    useState<ConstructionServiceDef | null>(null);

  const savedPricesCount =
    Object.values(priceProfile.unitPricesByMaterialId).filter(Boolean).length +
    (priceProfile.pricePerCementBag ? 1 : 0) +
    (priceProfile.pricePerKgSand ? 1 : 0) +
    (priceProfile.laborPerM2 ? 1 : 0);

  const recentSaved = savedEstimates.slice(0, 3);
  const upcomingServices = CONSTRUCTION_SERVICES.filter((s) => !s.isActive);
  const showcaseMaterials = [
    BUILT_IN_MATERIAL_PRESETS[3], // آجر فشاری
    BUILT_IN_MATERIAL_PRESETS[4], // آجر لفتون
    BUILT_IN_MATERIAL_PRESETS[0], // آجر سفال ۱۰
    BUILT_IN_MATERIAL_PRESETS[7], // بلوک سیمانی ۲۰
  ];

  const getUpcomingIcon = (id: string) => {
    switch (id) {
      case 'plaster-undercoat':
      case 'whitewash-finish':
        return <PaintBucket className="w-5 h-5" />;
      case 'roofing-slab':
        return <Layers className="w-5 h-5" />;
      default:
        return <HardHat className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Construction Services Hub (انتخاب نوع خدمات بنّایی) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              انتخاب خدمات بنّایی
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              نوع عملیات ساختمانی را برای برآورد دقیق مصالح و هزینه انتخاب کنید.
            </p>
          </div>
          <span className="text-xs text-slate-500">کارکرد کاملاً آفلاین</span>
        </div>

        {/* Phase 1 Active Service: Wall Masonry (دیوارکشی و تیغه‌چینی) */}
        <div className="rounded-3xl bg-slate-900 p-6 sm:p-7 text-white space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="text-xs text-blue-300 font-semibold flex items-center gap-1.5">
                <WallAreaIcon className="w-4 h-4" />
                <span>خدمات فعال · فاز اول بناسنج</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug text-balance">
                دیوارکشی و تیغه‌چینی (آجر و بلوک)
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                محاسبه تعداد آجر سفال، فشاری، لفتون، بلوک سیمانی یا مصالح دلخواه شما، به همراه سیمان، ماسه و پیش‌فاکتور کامل به تومان.
              </p>
            </div>

            {/* Visual Preview of Masonry Material Photos */}
            <div className="flex items-center gap-2 shrink-0">
              {showcaseMaterials.map((mat) => (
                <MaterialThumbnail
                  key={mat.id}
                  material={mat}
                  sizeClass="w-12 h-12 sm:w-14 sm:h-14 rounded-xl"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onStartNewEstimate(true)}
              className="min-h-[52px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition text-white font-bold text-base flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Calculator className="w-5 h-5" />
              <span>شروع محاسبه دیوارکشی</span>
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

            <button
              type="button"
              onClick={onOpenAddMaterialModal}
              className="min-h-[52px] px-4 py-3 rounded-2xl border border-white/20 hover:bg-white/10 transition text-slate-200 font-semibold text-sm flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>معرفی مصالح جدید</span>
            </button>
          </div>
        </div>

        {/* Upcoming Phases: Other Masonry Services (در حال توسعه) */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              سایر خدمات بنّایی (فازهای بعدی)
            </h2>
            <span className="text-xs text-slate-500">در حال توسعه</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingServices.map((srv) => (
              <button
                key={srv.id}
                type="button"
                onClick={() => setSelectedUpcomingService(srv)}
                className="text-right rounded-2xl bg-white border border-slate-200 p-4 hover:border-slate-300 active:scale-[0.99] transition flex items-start gap-3.5 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  {getUpcomingIcon(srv.id)}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 truncate">
                      {srv.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {srv.shortDesc}
                  </p>
                  <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1 pt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>در حال توسعه · مشاهده جزئیات</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Utility Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saved Estimates Card */}
        <button
          type="button"
          onClick={onOpenSavedList}
          className="text-right rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-300 active:scale-[0.99] transition flex flex-col justify-between min-h-[126px] cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">پروژه‌های ذخیره‌شده</h2>
            <p className="text-xs sm:text-sm text-slate-600 tabular-nums-fa">
              {savedEstimates.length > 0
                ? `${formatFaNumber(savedEstimates.length, 0)} پروژه ذخیره‌شده در گوشی`
                : 'هنوز پروژه‌ای ذخیره نکرده‌اید'}
            </p>
          </div>
        </button>

        {/* Saved Price Profile & Custom Materials Card */}
        <button
          type="button"
          onClick={onOpenPriceProfile}
          className="text-right rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-300 active:scale-[0.99] transition flex flex-col justify-between min-h-[126px] cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">دفترچه قیمت و مصالح من</h2>
            <p className="text-xs sm:text-sm text-slate-600 tabular-nums-fa">
              {userMaterials.length > 0 || savedPricesCount > 0
                ? `${formatFaNumber(userMaterials.length, 0)} مصالح سفارشی · ${formatFaNumber(
                    savedPricesCount,
                    0
                  )} قیمت ثبت‌شده`
                : 'ثبت مصالح اختصاصی و قیمت روز مصالح'}
            </p>
          </div>
        </button>

        {/* About & Disclaimer Card */}
        <button
          type="button"
          onClick={() => setShowAboutModal(true)}
          className="text-right rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-300 active:scale-[0.99] transition flex flex-col justify-between min-h-[126px] cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">درباره بناسنج و راهنما</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              روش محاسبه مصالح و نکات مهم اجرایی
            </p>
          </div>
        </button>
      </section>

      {/* Direct Android APK Download + Optional PWA Install Section (hidden inside installed native APK) */}
      {!isNativePlatform && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                دانلود فایل نصب اندروید (APK) بناسنج
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                فایل نصبی آماده گوشی‌های اندروید؛ پس از نصب کاملاً آفلاین و بدون نیاز به اینترنت کار می‌کند.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
            <a
              href="/apk/BannaSanj-v1.1.apk"
              download="BannaSanj-v1.1.apk"
              className="flex-1 sm:flex-initial min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود مستقیم فایل APK</span>
            </a>

            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={onInstallApp}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>نصب وب‌اپ</span>
              </button>
            )}

            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>راهنمای آیفون</span>
              </button>
            )}
          </div>
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
                    <span>دیوارکشی</span>
                    <span aria-hidden="true">·</span>
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

      {/* Disclaimer Footer Box */}
      <section className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {MANDATORY_DISCLAIMER}
      </section>

      {/* Upcoming Service Details Modal (در حال توسعه) */}
      {selectedUpcomingService && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedUpcomingService(null)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>این بخش در حال توسعه است (فازهای بعدی بناسنج)</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{selectedUpcomingService.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {selectedUpcomingService.upcomingDetails}
            </p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 leading-relaxed">
              در حال حاضر بخش <strong>«دیوارکشی و تیغه‌چینی (آجر و بلوک)»</strong> به طور کامل فعال و آماده محاسبه است.
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedUpcomingService(null);
                  onStartNewEstimate(true);
                }}
                className="flex-1 min-h-[48px] rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm cursor-pointer"
              >
                ورود به محاسبه دیوارکشی
              </button>
              <button
                type="button"
                onClick={() => setSelectedUpcomingService(null)}
                className="min-h-[48px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

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
              «بناسنج» دستیار آفلاین برآورد خدمات بنّایی برای بنّاها، سرکارگران و مالکان است. در فاز اول، محاسبه کامل دیوارکشی فعال است و در فازهای بعدی گچ‌کشی، سفیدکاری، سقف‌زنی، سیمان‌کاری و کف‌سازی اضافه می‌شوند.
            </p>
            <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">مبنای محاسبات دیوارکشی:</p>
              <p>۱. مساحت خالص پس از کسر در و پنجره‌ها محاسبه می‌شود.</p>
              <p>۲. تعداد واحد مصالح بر اساس ابعاد واقعی آجر یا بلوک (پیش‌فرض یا مصالح جدیدی که خودتان معرفی کرده‌اید)، ضخامت بند ملات و درصد پرت به بالا گرد می‌شود.</p>
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
