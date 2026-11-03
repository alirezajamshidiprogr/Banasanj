import React, {useState} from 'react';
import {Check, Download, Trash2} from 'lucide-react';
import {MANDATORY_DISCLAIMER, MATERIAL_PRESETS} from '../constants/materials';
import type {MixRatioValue, SavedPriceProfile} from '../types';
import {
  formatPriceFieldDisplay,
  sanitizeDecimalInput,
  sanitizePriceInput,
  toPersianDigits,
} from '../utils/formatters';
import type {DefaultMortarSettings} from '../utils/storage';

interface SettingsScreenProps {
  priceProfile: SavedPriceProfile;
  defaultMortar: DefaultMortarSettings;
  onUpdatePriceProfile: (next: SavedPriceProfile) => void;
  onClearAllPrices: () => void;
  onUpdateDefaultMortar: (next: DefaultMortarSettings) => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstallApp: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  priceProfile,
  defaultMortar,
  onUpdatePriceProfile,
  onClearAllPrices,
  onUpdateDefaultMortar,
  isInstallable,
  isInstalled,
  isIOS,
  onInstallApp,
  onShowToast,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const standardPresets = MATERIAL_PRESETS.filter((p) => p.id !== 'custom');

  const handleMaterialUnitPrice = (presetId: string, rawVal: string) => {
    const clean = sanitizePriceInput(rawVal);
    onUpdatePriceProfile({
      ...priceProfile,
      unitPricesByMaterialId: {
        ...priceProfile.unitPricesByMaterialId,
        [presetId]: clean,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تنظیمات و دفترچه قیمت</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          قیمت مصالح منطقه خودتان را اینجا ثبت کنید تا در محاسبه‌های بعدی آماده باشد.
        </p>
      </div>

      {/* Saved Price Profile Section */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">دفترچه قیمت مصالح شما (تومان)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تمام تغییرات به صورت خودکار در حافظه گوشی ذخیره می‌شود.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="min-h-[42px] px-3.5 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>پاک کردن همه قیمت‌ها</span>
          </button>
        </div>

        {/* Shared Mortar & Labor Prices */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              کیسه ۵۰ کیلویی سیمان
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={formatPriceFieldDisplay(priceProfile.pricePerCementBag)}
                onChange={(e) =>
                  onUpdatePriceProfile({
                    ...priceProfile,
                    pricePerCementBag: sanitizePriceInput(e.target.value),
                  })
                }
                placeholder="مبلغ به تومان"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 pl-14 text-base font-bold text-slate-900 tabular-nums-fa placeholder:font-normal placeholder:text-slate-400"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                تومان
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              هر کیلوگرم ماسه
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={
                  priceProfile.pricePerKgSand.includes('.')
                    ? toPersianDigits(priceProfile.pricePerKgSand)
                    : formatPriceFieldDisplay(priceProfile.pricePerKgSand)
                }
                onChange={(e) =>
                  onUpdatePriceProfile({
                    ...priceProfile,
                    pricePerKgSand: sanitizePriceInput(e.target.value),
                  })
                }
                placeholder="مبلغ به تومان"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 pl-14 text-base font-bold text-slate-900 tabular-nums-fa placeholder:font-normal placeholder:text-slate-400"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                تومان
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              دستمزد اجرا (هر متر مربع)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={formatPriceFieldDisplay(priceProfile.laborPerM2)}
                onChange={(e) =>
                  onUpdatePriceProfile({
                    ...priceProfile,
                    laborPerM2: sanitizePriceInput(e.target.value),
                  })
                }
                placeholder="اختیاری"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 pl-14 text-base font-bold text-slate-900 tabular-nums-fa placeholder:font-normal placeholder:text-slate-400"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                تومان
              </span>
            </div>
          </div>
        </div>

        {/* Unit Prices per Brick / Block Preset */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h3 className="text-sm font-bold text-slate-800">قیمت تک‌فروشی هر عدد آجر و بلوک</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {standardPresets.map((preset) => {
              const val = priceProfile.unitPricesByMaterialId[preset.id] ?? '';
              return (
                <div
                  key={preset.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5"
                >
                  <label
                    htmlFor={`profile-price-${preset.id}`}
                    className="text-sm font-semibold text-slate-800 whitespace-nowrap"
                  >
                    {preset.name}
                  </label>
                  <div className="relative w-40">
                    <input
                      id={`profile-price-${preset.id}`}
                      type="text"
                      inputMode="decimal"
                      value={formatPriceFieldDisplay(val)}
                      onChange={(e) => handleMaterialUnitPrice(preset.id, e.target.value)}
                      placeholder="تومان"
                      className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 tabular-nums-fa placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Default Mortar & Waste Settings */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">مقادیر پیش‌فرض ملات و پرت</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            در شروع هر محاسبه جدید این اعداد به صورت پیش‌فرض قرار می‌گیرند.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              ضخامت پیش‌فرض بند ملات (سانت)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={toPersianDigits(defaultMortar.jointThicknessCm)}
              onChange={(e) =>
                onUpdateDefaultMortar({
                  ...defaultMortar,
                  jointThicknessCm: sanitizeDecimalInput(e.target.value) || '2',
                })
              }
              className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-base font-bold text-slate-900 tabular-nums-fa"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              عیار پیش‌فرض ملات
            </label>
            <select
              value={defaultMortar.mixRatio}
              onChange={(e) =>
                onUpdateDefaultMortar({
                  ...defaultMortar,
                  mixRatio: Number(e.target.value) as MixRatioValue,
                })
              }
              className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-base font-bold text-slate-900"
            >
              <option value={4}>۱ به ۴ (پرسی‌تر)</option>
              <option value={5}>۱ به ۵ (معمولی)</option>
              <option value={6}>۱ به ۶ (کم‌سیمان)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              درصد پیش‌فرض پرت مصالح
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={toPersianDigits(defaultMortar.wastePercent)}
              onChange={(e) =>
                onUpdateDefaultMortar({
                  ...defaultMortar,
                  wastePercent: sanitizeDecimalInput(e.target.value) || '5',
                })
              }
              className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-base font-bold text-slate-900 tabular-nums-fa"
            />
          </div>
        </div>
      </section>

      {/* PWA Installation Status */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">نسخه آفلاین و نصب روی گوشی</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isInstalled
              ? 'اپلیکیشن بناسنج روی دستگاه شما نصب است و آفلاین کار می‌کند.'
              : isIOS
              ? 'در مرورگر سافاری آیفون از گزینه Share و سپس Add to Home Screen استفاده کنید.'
              : 'می‌توانید بناسنج را مثل برنامه مستقل روی صفحه اصلی گوشی نصب کنید.'}
          </p>
        </div>

        {isInstalled ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
            <Check className="w-4 h-4" />
            <span>نصب شده</span>
          </span>
        ) : (
          isInstallable && (
            <button
              type="button"
              onClick={onInstallApp}
              className="min-h-[48px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>نصب برنامه</span>
            </button>
          )
        )}
      </section>

      {/* About & Mandatory Disclaimer */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="text-base font-bold text-slate-900">درباره بناسنج و سلب مسئولیت</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          بناسنج برای ساده‌تر شدن برآورد اولیه خرید آجر، بلوک، سیمان و ماسه طراحی شده است. هیچ نیازی به ثبت‌نام یا اینترنت دائمی ندارد و تمام اطلاعات شما فقط در حافظه گوشی خودتان نگهداری می‌شود.
        </p>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm font-medium text-amber-950 leading-relaxed">
          {MANDATORY_DISCLAIMER}
        </div>
      </section>

      {/* Confirm Clear Modal */}
      {confirmClear && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setConfirmClear(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">پاک کردن دفترچه قیمت</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              آیا می‌خواهید تمام قیمت‌های ذخیره‌شده آجر، بلوک، سیمان و ماسه پاک شوند؟
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClearAllPrices();
                  setConfirmClear(false);
                  onShowToast('تمام قیمت‌های ذخیره‌شده پاک شدند.');
                }}
                className="flex-1 min-h-[48px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm cursor-pointer"
              >
                بله، پاک شود
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
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
