import React from 'react';
import type {CalculationResult, CostResult, EstimateDraft, EstimateStep} from '../types';
import {formatFaNumber, formatToman, parsePositiveNumber} from '../utils/formatters';

interface DesktopSummaryRailProps {
  draft: EstimateDraft;
  materialDisplayName: string;
  unitLabel: string;
  step: EstimateStep;
  quantities: CalculationResult | null;
  costs: CostResult | null;
}

export const DesktopSummaryRail: React.FC<DesktopSummaryRailProps> = ({
  draft,
  materialDisplayName,
  unitLabel,
  quantities,
  costs,
}) => {
  const len = parsePositiveNumber(draft.lengthM);
  const hgt = parsePositiveNumber(draft.heightM);
  const thick = parsePositiveNumber(draft.wallThicknessCm);

  // Proportional SVG elevation preview
  const ratio = len && hgt ? Math.min(2.4, Math.max(0.6, len / hgt)) : 1.6;
  const svgW = 280;
  const svgH = 160;
  const wallW = Math.min(230, Math.round(115 * ratio));
  const wallH = Math.min(120, Math.round(wallW / ratio));
  const wallX = Math.round((svgW - wallW) / 2);
  const wallY = Math.round((svgH - wallH) / 2);

  return (
    <aside className="rounded-3xl bg-white border border-slate-200 p-6 space-y-5 sticky top-20">
      <div>
        <h3 className="text-base font-bold text-slate-900">خلاصه زنده دیوار</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          با تغییر اعداد، مقادیر به صورت آنی به‌روز می‌شوند.
        </p>
      </div>

      {/* Schematic Elevation Diagram */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col items-center">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full max-w-[280px] h-auto"
          aria-label="نمای شماتیک دیوار"
        >
          <defs>
            <pattern id="masonryGrid" width="22" height="12" patternUnits="userSpaceOnUse">
              <path
                d="M 22 0 L 0 0 0 12"
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect
            x={wallX}
            y={wallY}
            width={wallW}
            height={wallH}
            rx="6"
            fill="url(#masonryGrid)"
            stroke="#1E293B"
            strokeWidth="2"
          />

          {/* Render symbolic openings if any */}
          {draft.openings.slice(0, 2).map((op, i) => {
            const ow = Math.min(wallW * 0.28, 36);
            const oh = Math.min(wallH * 0.55, 52);
            const ox = wallX + (i + 1) * (wallW / (Math.min(draft.openings.length, 2) + 1)) - ow / 2;
            const oy = wallY + wallH - oh - (op.label === 'پنجره' ? wallH * 0.2 : 0);
            return (
              <rect
                key={op.id}
                x={ox}
                y={oy}
                width={ow}
                height={oh}
                rx="3"
                fill="#FFFFFF"
                stroke="#2563EB"
                strokeWidth="1.6"
              />
            );
          })}
        </svg>

        <div className="text-xs text-slate-600 mt-2 tabular-nums-fa">
          {len && hgt
            ? `طول ${formatFaNumber(len, 2)} متر × ارتفاع ${formatFaNumber(hgt, 2)} متر`
            : 'طول و ارتفاع را وارد کنید'}
          {thick ? ` · ضخامت ${formatFaNumber(thick, 1)} سانت` : ''}
        </div>
      </div>

      {/* Live Numbers */}
      <div className="space-y-3 text-sm tabular-nums-fa">
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-slate-600">نوع مصالح</span>
          <span className="font-bold text-slate-900">{materialDisplayName}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-slate-600">مساحت خالص</span>
          <span className="font-bold text-slate-900">
            {quantities ? `${formatFaNumber(quantities.netAreaM2, 2)} متر مربع` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-slate-600">تعداد {unitLabel}</span>
          <span className="font-bold text-slate-900">
            {quantities ? `${formatFaNumber(quantities.finalUnits, 0)} عدد` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-slate-600">سیمان (کیسه ۵۰ک)</span>
          <span className="font-bold text-slate-900">
            {quantities ? `${formatFaNumber(quantities.cementBags, 0)} کیسه` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-slate-600">ماسه</span>
          <span className="font-bold text-slate-900">
            {quantities ? `${formatFaNumber(quantities.sandKg, 0)} کیلوگرم` : '—'}
          </span>
        </div>

        {costs && costs.hasAnyPrice && (
          <div className="pt-2 flex items-center justify-between">
            <span className="font-bold text-slate-900">جمع هزینه</span>
            <span className="font-extrabold text-base text-blue-700">
              {formatToman(costs.totalCost)}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
