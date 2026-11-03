import React, {useState} from 'react';
import {Bookmark, FolderOpen, PlusCircle, Trash2} from 'lucide-react';
import type {SavedEstimate} from '../types';
import {formatFaNumber, formatJalaliDate, formatToman} from '../utils/formatters';

interface SavedScreenProps {
  savedEstimates: SavedEstimate[];
  onOpenEstimate: (estimate: SavedEstimate) => void;
  onDeleteEstimate: (id: string) => void;
  onStartNewEstimate: () => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  savedEstimates,
  onOpenEstimate,
  onDeleteEstimate,
  onStartNewEstimate,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const targetToDelete = savedEstimates.find((item) => item.id === confirmDeleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">محاسبه‌های ذخیره‌شده</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            پروژه‌های ذخیره‌شده روی همین گوشی بدون نیاز به اینترنت در دسترس هستند.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewEstimate}
          className="min-h-[48px] px-5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>محاسبه جدید</span>
        </button>
      </div>

      {savedEstimates.length === 0 ? (
        <section className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900">هنوز برآوردی ذخیره نکرده‌اید</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              پس از محاسبه دیوار و مشاهده پیش‌فاکتور، دکمه «ذخیره در لیست پروژه‌ها» را بزنید تا همیشه اینجا بماند.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewEstimate}
            className="min-h-[50px] px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>شروع اولین محاسبه</span>
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedEstimates.map((item) => {
            const title =
              item.projectTitle.trim() ||
              `دیوار ${formatFaNumber(Number(item.draft.lengthM), 2)}×${formatFaNumber(
                Number(item.draft.heightM),
                2
              )} متر (${item.materialName})`;

            return (
              <article
                key={item.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">{title}</h2>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      aria-label="حذف پروژه"
                      className="min-h-[44px] min-w-[44px] -mt-1 -ml-1 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Clean unboxed metadata with typographic separators */}
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 tabular-nums-fa">
                    <span>{formatJalaliDate(item.updatedAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      ابعاد {formatFaNumber(Number(item.draft.lengthM), 2)}×
                      {formatFaNumber(Number(item.draft.heightM), 2)} متر
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>خالص {formatFaNumber(item.quantities.netAreaM2, 2)} متر مربع</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs tabular-nums-fa">
                    <div>
                      <div className="text-slate-500">{item.materialName}</div>
                      <div className="font-bold text-sm text-slate-900 mt-0.5">
                        {formatFaNumber(item.quantities.finalUnits, 0)} عدد
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">سیمان</div>
                      <div className="font-bold text-sm text-slate-900 mt-0.5">
                        {formatFaNumber(item.quantities.cementBags, 0)} کیسه
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">ماسه</div>
                      <div className="font-bold text-sm text-slate-900 mt-0.5">
                        {formatFaNumber(item.quantities.sandKg, 0)} کیلو
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="tabular-nums-fa">
                    <div className="text-xs text-slate-500">جمع کل برآورد</div>
                    <div className="font-extrabold text-base text-slate-900">
                      {item.costs.hasAnyPrice
                        ? formatToman(item.costs.totalCost)
                        : 'بدون قیمت واحد'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenEstimate(item)}
                    className="min-h-[46px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>باز کردن</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal (avoids window.confirm) */}
      {targetToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">حذف پروژه ذخیره‌شده</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              آیا از حذف «{targetToDelete.projectTitle || targetToDelete.materialName}» مطمئن هستید؟ این کار قابل بازگشت نیست.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteEstimate(targetToDelete.id);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 min-h-[48px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm cursor-pointer"
              >
                بله، حذف شود
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
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
