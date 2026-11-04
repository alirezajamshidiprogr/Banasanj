import React, {useRef, useState} from 'react';
import {Camera, Check, RotateCcw, Sparkles, X} from 'lucide-react';
import {inferMaterialCategoryFromName} from '../constants/materials';
import type {MaterialCategory, MaterialPreset} from '../types';
import {
  formatFaNumber,
  parsePositiveNumber,
  sanitizeDecimalInput,
  toPersianDigits,
} from '../utils/formatters';
import {MaterialThumbnail} from './MaterialThumbnail';

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNewMaterial: (material: MaterialPreset) => void;
}

/**
 * Compresses an uploaded image from camera/gallery into a tiny 160x160 JPEG DataURL
 * so localStorage / IndexedDB stays fast and never hits storage limits.
 */
function compressImageToThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, size, size);

        // Center-crop square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = String(reader.result ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  isOpen,
  onClose,
  onSaveNewMaterial,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('block');
  const [categoryManuallyPicked, setCategoryManuallyPicked] = useState(false);
  const [lengthCm, setLengthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [thicknessCm, setThicknessCm] = useState('');
  const [customImage, setCustomImage] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    setErrorMsg(null);
    if (!categoryManuallyPicked && val.trim().length > 1) {
      const inferred = inferMaterialCategoryFromName(val);
      setCategory(inferred.category);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToThumbnail(file);
      setCustomImage(dataUrl);
      setErrorMsg(null);
    } catch {
      setErrorMsg('امکان بارگذاری این تصویر نبود؛ از تصویر پیش‌فرض هوشمند استفاده می‌شود.');
    }
  };

  const parsedL = parsePositiveNumber(lengthCm);
  const parsedH = parsePositiveNumber(heightCm);
  const parsedT = parsePositiveNumber(thicknessCm);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('لطفاً نام مصالح جدید را وارد کنید (مثلاً بلوک هبلکس ۱۵ یا آجر قزاقی).');
      return;
    }
    if (!parsedL || !parsedH || !parsedT) {
      setErrorMsg('لطفاً طول، ارتفاع و ضخامت مصالح را به صورت اعداد مثبت (سانتی‌متر) وارد کنید.');
      return;
    }

    const unitLabel = category === 'block' ? 'بلوک' : 'آجر';
    const recommendedThick = Math.round(parsedT * 10) / 10;

    const newMaterial: MaterialPreset = {
      id: `user-mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      shortName: cleanName.slice(0, 18),
      category,
      unitLabel,
      nominalCm: {l: parsedL, h: parsedH, t: parsedT},
      actualCm: {l: parsedL, h: parsedH, t: parsedT},
      recommendedWallThicknessCm: recommendedThick,
      subtitle: `ثبت‌شده توسط شما · ضخامت دیوار پیشنهادی ${formatFaNumber(recommendedThick, 1)} سانت`,
      isBuiltIn: false,
      customImageDataUrl: customImage,
      createdAt: new Date().toISOString(),
    };

    onSaveNewMaterial(newMaterial);
    // Reset form
    setName('');
    setLengthCm('');
    setHeightCm('');
    setThicknessCm('');
    setCustomImage(undefined);
    setCategoryManuallyPicked(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">معرفی مصالح جدید به بناسنج</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              برای همیشه در گوشی ذخیره می‌شود و در محاسبه‌های بعدی نمایش داده خواهد شد.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5">
          {/* Smart Live Preview Card */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <MaterialThumbnail
                material={{
                  id: 'preview-user',
                  name: name || (category === 'block' ? 'بلوک جدید' : 'آجر جدید'),
                  category,
                  customImageDataUrl: customImage,
                  thicknessCm: parsedT ?? 15,
                }}
                sizeClass="w-16 h-16 rounded-2xl"
              />
              <div className="min-w-0">
                <div className="font-bold text-base text-slate-900 truncate">
                  {name.trim() || 'نام مصالح جدید شما'}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 tabular-nums-fa">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>
                    {parsedL && parsedH && parsedT
                      ? `${formatFaNumber(parsedL, 1)}×${formatFaNumber(parsedH, 1)}×${formatFaNumber(
                          parsedT,
                          1
                        )} سانتی‌متر`
                      : 'تصویر متناسب با نام، هوشمند انتخاب می‌شود'}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[40px] px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-blue-700" />
                <span>{customImage ? 'تغییر عکس' : 'عکس دلخواه'}</span>
              </button>
              {customImage && (
                <button
                  type="button"
                  onClick={() => setCustomImage(undefined)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>تصویر هوشمند</span>
                </button>
              )}
            </div>
          </div>

          {/* Material Name */}
          <div>
            <label htmlFor="new-mat-name" className="block text-sm font-bold text-slate-800 mb-1.5">
              نام مصالح (مثلاً هبلکس ۱۵، بلوک لیکا، آجر قزاقی)
            </label>
            <input
              id="new-mat-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="نام مصالح را بنویسید..."
              className="w-full min-h-[50px] rounded-xl border border-slate-300 bg-white px-4 text-base font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Category Selector */}
          <div>
            <span className="block text-sm font-bold text-slate-800 mb-1.5">نوع مصالح</span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCategory('brick');
                  setCategoryManuallyPicked(true);
                }}
                className={`min-h-[46px] rounded-xl font-bold text-sm border transition cursor-pointer ${
                  category === 'brick'
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                خانواده آجر / سفال
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory('block');
                  setCategoryManuallyPicked(true);
                }}
                className={`min-h-[46px] rounded-xl font-bold text-sm border transition cursor-pointer ${
                  category === 'block'
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                خانواده بلوک (سیمانی / هبلکس / لیکا)
              </button>
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <span className="block text-sm font-bold text-slate-800 mb-1.5">
              ابعاد واقعی هر واحد به سانتی‌متر
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  طول (سانت)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={toPersianDigits(lengthCm)}
                  onChange={(e) => {
                    setLengthCm(sanitizeDecimalInput(e.target.value));
                    setErrorMsg(null);
                  }}
                  placeholder="مثلاً ۶۰"
                  className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 tabular-nums-fa placeholder:font-normal placeholder:text-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ارتفاع (سانت)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={toPersianDigits(heightCm)}
                  onChange={(e) => {
                    setHeightCm(sanitizeDecimalInput(e.target.value));
                    setErrorMsg(null);
                  }}
                  placeholder="مثلاً ۲۵"
                  className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 tabular-nums-fa placeholder:font-normal placeholder:text-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ضخامت (سانت)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={toPersianDigits(thicknessCm)}
                  onChange={(e) => {
                    setThicknessCm(sanitizeDecimalInput(e.target.value));
                    setErrorMsg(null);
                  }}
                  placeholder="مثلاً ۱۵"
                  className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 tabular-nums-fa placeholder:font-normal placeholder:text-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs sm:text-sm font-semibold text-red-900"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="submit"
              className="flex-1 min-h-[52px] rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>ذخیره همیشگی و انتخاب مصالح</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[52px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm whitespace-nowrap cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
