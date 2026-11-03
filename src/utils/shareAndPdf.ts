import {Capacitor} from '@capacitor/core';
import {Directory, Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {jsPDF} from 'jspdf';
import {MANDATORY_DISCLAIMER} from '../constants/materials';
import type {CalculationResult, CostResult, EstimateDraft} from '../types';
import {formatFaNumber, formatJalaliDate, formatToman} from './formatters';

export interface InvoiceExportPayload {
  projectTitle: string;
  dateIso: string;
  draft: EstimateDraft;
  materialName: string;
  unitLabel: string;
  quantities: CalculationResult;
  costs: CostResult;
}

export function getDisplayProjectTitle(payload: InvoiceExportPayload): string {
  const trimmed = payload.projectTitle.trim();
  if (trimmed) return trimmed;
  return `دیوار ${formatFaNumber( Number(payload.draft.lengthM) || 0, 2 )}×${formatFaNumber(
    Number(payload.draft.heightM) || 0,
    2
  )} متر (${payload.materialName})`;
}

/**
 * Generates clean Persian plain-text summary suitable for WhatsApp, SMS, Telegram, or clipboard.
 */
export function buildInvoicePlainText(payload: InvoiceExportPayload): string {
  const title = getDisplayProjectTitle(payload);
  const dateStr = formatJalaliDate(payload.dateIso);
  const q = payload.quantities;
  const c = payload.costs;

  const lines: string[] = [
    `برآورد مصالح و هزینه دیوارچینی — بناسنج`,
    `پروژه: ${title}`,
    dateStr ? `تاریخ: ${dateStr}` : '',
    `────────────────────`,
    `مشخصات دیوار:`,
    `• طول: ${formatFaNumber(Number(payload.draft.lengthM), 2)} متر | ارتفاع: ${formatFaNumber(
      Number(payload.draft.heightM),
      2
    )} متر | ضخامت: ${formatFaNumber(Number(payload.draft.wallThicknessCm), 1)} سانتی‌متر`,
    q.openingsAreaM2 > 0
      ? `• کسر بازشوها (در و پنجره): ${formatFaNumber(q.openingsAreaM2, 2)} متر مربع`
      : '',
    `• مساحت خالص دیوار: ${formatFaNumber(q.netAreaM2, 2)} متر مربع`,
    `• نوع مصالح: ${payload.materialName} (ابعاد محاسبه: ${formatFaNumber(
      q.unitLM * 100,
      1
    )}×${formatFaNumber(q.unitHM * 100, 1)}×${formatFaNumber(q.unitTM * 100, 1)} سانتی‌متر)`,
    `• بند ملات: ${formatFaNumber(q.jointM * 100, 1)} سانتی‌متر | عیار ملات ۱:${formatFaNumber(
      q.mixRatio,
      0
    )} | پرت: ${formatFaNumber(q.wastePercent, 1)}٪`,
    `────────────────────`,
    `لیست مصالح مورد نیاز:`,
    `• تعداد ${payload.unitLabel}: ${formatFaNumber(q.finalUnits, 0)} عدد`,
    `• سیمان: ${formatFaNumber(q.cementBags, 0)} کیسه ۵۰ کیلویی (${formatFaNumber(
      q.cementKg,
      1
    )} کیلوگرم)`,
    `• ماسه: ${formatFaNumber(q.sandKg, 0)} کیلوگرم (${formatFaNumber(q.sandKg / 1000, 2)} تن)`,
    `• حجم ملات تر: ${formatFaNumber(q.wetMortarTotalM3, 3)} متر مکعب (ملات خشک: ${formatFaNumber(
      q.dryMortarTotalM3,
      3
    )} متر مکعب)`,
  ].filter(Boolean);

  if (c.hasAnyPrice) {
    lines.push(`────────────────────`);
    lines.push(`ریز هزینه‌ها:`);
    if (c.pricePerUnit > 0) {
      lines.push(
        `• هزینه ${payload.materialName} (هر عدد ${formatToman(c.pricePerUnit)}): ${formatToman(
          c.materialCost
        )}`
      );
    }
    if (c.pricePerCementBag > 0) {
      lines.push(
        `• هزینه سیمان (هر کیسه ${formatToman(c.pricePerCementBag)}): ${formatToman(c.cementCost)}`
      );
    }
    if (c.pricePerKgSand > 0) {
      lines.push(
        `• هزینه ماسه (هر کیلو ${formatToman(c.pricePerKgSand)}): ${formatToman(c.sandCost)}`
      );
    }
    if (c.laborPerM2 > 0) {
      lines.push(
        `• دستمزد اجرا (متری ${formatToman(c.laborPerM2)}): ${formatToman(c.laborCost)}`
      );
    }
    lines.push(`جمع کل: ${formatToman(c.totalCost)}`);
  }

  lines.push(`────────────────────`);
  lines.push(`توجه: ${MANDATORY_DISCLAIMER}`);

  return lines.join('\n');
}

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function drawRoundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/**
 * Generates a high-DPI Persian RTL A4 PDF File with native browser text shaping on Canvas.
 * Works 100% offline with crisp Vazirmatn ligatures and zero oklch/CSS parsing bugs.
 */
export async function generateInvoicePdfFile(payload: InvoiceExportPayload): Promise<File> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed with available system fallback font if offline before font load
    }
  }

  const width = 1240;
  const height = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('امکان ایجاد فایل PDF در مرورگر وجود ندارد.');
  }

  const fontStack = 'Vazirmatn, Tahoma, Arial, sans-serif';
  ctx.direction = 'rtl';

  // White A4 background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const margin = 72;
  const contentWidth = width - margin * 2;
  const rightX = width - margin;
  const leftX = margin;

  // Header band
  drawRoundedBox(ctx, margin, 60, contentWidth, 148, 24, '#0F172A');

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.font = `800 42px ${fontStack}`;
  ctx.fillText('بناسنج — صورت‌حساب مصالح و هزینه دیوارچینی', rightX - 36, 125);

  const title = getDisplayProjectTitle(payload);
  const dateStr = formatJalaliDate(payload.dateIso);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = `500 24px ${fontStack}`;
  ctx.fillText(`پروژه: ${title}`, rightX - 36, 174);

  if (dateStr) {
    ctx.textAlign = 'left';
    ctx.fillText(`تاریخ: ${dateStr}`, leftX + 36, 174);
  }

  // Section 1: Wall & Material Specs
  let y = 248;
  drawRoundedBox(ctx, margin, y, contentWidth, 210, 20, '#F8FAFC', '#E2E8F0');

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 28px ${fontStack}`;
  ctx.fillText('۱. مشخصات دیوار و مصالح انتخابی', rightX - 28, y + 50);

  const q = payload.quantities;
  ctx.fillStyle = '#334155';
  ctx.font = `500 23px ${fontStack}`;
  ctx.fillText(
    `ابعاد دیوار: طول ${formatFaNumber(Number(payload.draft.lengthM), 2)} متر × ارتفاع ${formatFaNumber(
      Number(payload.draft.heightM),
      2
    )} متر × ضخامت ${formatFaNumber(Number(payload.draft.wallThicknessCm), 1)} سانتی‌متر`,
    rightX - 28,
    y + 100
  );
  ctx.fillText(
    `مساحت کل: ${formatFaNumber(q.grossAreaM2, 2)} متر مربع  ·  کسر بازشوها: ${formatFaNumber(
      q.openingsAreaM2,
      2
    )} متر مربع  ·  مساحت خالص: ${formatFaNumber(q.netAreaM2, 2)} متر مربع`,
    rightX - 28,
    y + 144
  );
  ctx.fillText(
    `مصالح: ${payload.materialName} (${formatFaNumber(q.unitLM * 100, 1)}×${formatFaNumber(
      q.unitHM * 100,
      1
    )}×${formatFaNumber(q.unitTM * 100, 1)} سانتی‌متر)  ·  بند ملات: ${formatFaNumber(
      q.jointM * 100,
      1
    )} سانت  ·  عیار ۱:${formatFaNumber(q.mixRatio, 0)}  ·  پرت: ${formatFaNumber(
      q.wastePercent,
      1
    )}٪`,
    rightX - 28,
    y + 186
  );

  // Section 2: Quantities Grid
  y = 492;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 28px ${fontStack}`;
  ctx.fillText('۲. مقادیر دقیق مصالح مورد نیاز', rightX, y);

  y += 24;
  const cardGap = 20;
  const cardW = (contentWidth - cardGap) / 2;
  const cardH = 132;

  const qtyCards = [
    {
      label: `تعداد ${payload.unitLabel} (با احتساب پرت)`,
      val: `${formatFaNumber(q.finalUnits, 0)} عدد`,
      sub: `بدون پرت: ${formatFaNumber(q.theoreticalUnits, 1)} عدد`,
    },
    {
      label: 'سیمان مورد نیاز',
      val: `${formatFaNumber(q.cementBags, 0)} کیسه ۵۰ کیلویی`,
      sub: `معادل ${formatFaNumber(q.cementKg, 1)} کیلوگرم`,
    },
    {
      label: 'ماسه ملاتی مورد نیاز',
      val: `${formatFaNumber(q.sandKg, 0)} کیلوگرم`,
      sub: `معادل ${formatFaNumber(q.sandKg / 1000, 2)} تن`,
    },
    {
      label: 'حجم ملات مصرفی',
      val: `${formatFaNumber(q.wetMortarTotalM3, 3)} متر مکعب (تر)`,
      sub: `ملات خشک: ${formatFaNumber(q.dryMortarTotalM3, 3)} متر مکعب`,
    },
  ];

  qtyCards.forEach((item, idx) => {
    const col = idx % 2; // 0 = right column, 1 = left column
    const row = Math.floor(idx / 2);
    const boxX = col === 0 ? margin + cardW + cardGap : margin;
    const boxY = y + row * (cardH + cardGap);

    drawRoundedBox(ctx, boxX, boxY, cardW, cardH, 18, '#FFFFFF', '#CBD5E1');
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = `500 21px ${fontStack}`;
    ctx.fillText(item.label, boxX + cardW - 24, boxY + 40);

    ctx.fillStyle = '#0F172A';
    ctx.font = `800 30px ${fontStack}`;
    ctx.fillText(item.val, boxX + cardW - 24, boxY + 84);

    ctx.fillStyle = '#64748B';
    ctx.font = `400 19px ${fontStack}`;
    ctx.fillText(item.sub, boxX + cardW - 24, boxY + 115);
  });

  // Section 3: Itemized Cost Table
  y = y + 2 * (cardH + cardGap) + 42;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 28px ${fontStack}`;
  ctx.fillText('۳. جدول ریز قیمت و هزینه اجرا (تومان)', rightX, y);

  y += 24;
  const c = payload.costs;
  const rowH = 74;

  // Table Header
  drawRoundedBox(ctx, margin, y, contentWidth, 64, 14, '#E2E8F0');
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontStack}`;
  ctx.textAlign = 'right';
  ctx.fillText('شرح ردیف', rightX - 24, y + 40);
  ctx.fillText('مقدار', rightX - 420, y + 40);
  ctx.fillText('فی واحد (تومان)', rightX - 660, y + 40);
  ctx.textAlign = 'left';
  ctx.fillText('مبلغ کل (تومان)', leftX + 24, y + 40);

  y += 72;

  const tableRows = [
    {
      title: `خرید ${payload.materialName}`,
      qty: `${formatFaNumber(q.finalUnits, 0)} عدد`,
      unitPrice: c.pricePerUnit > 0 ? formatFaNumber(c.pricePerUnit, 0) : 'وارد نشده',
      total: c.pricePerUnit > 0 ? formatFaNumber(c.materialCost, 0) : '—',
    },
    {
      title: 'سیمان (کیسه ۵۰ کیلویی)',
      qty: `${formatFaNumber(q.cementBags, 0)} کیسه`,
      unitPrice: c.pricePerCementBag > 0 ? formatFaNumber(c.pricePerCementBag, 0) : 'وارد نشده',
      total: c.pricePerCementBag > 0 ? formatFaNumber(c.cementCost, 0) : '—',
    },
    {
      title: 'ماسه ملاتی',
      qty: `${formatFaNumber(q.sandKg, 0)} کیلوگرم`,
      unitPrice: c.pricePerKgSand > 0 ? formatFaNumber(c.pricePerKgSand, 0) : 'وارد نشده',
      total: c.pricePerKgSand > 0 ? formatFaNumber(c.sandCost, 0) : '—',
    },
    {
      title: 'دستمزد اجرا و بنّایی',
      qty: `${formatFaNumber(q.netAreaM2, 2)} متر مربع`,
      unitPrice: c.laborPerM2 > 0 ? formatFaNumber(c.laborPerM2, 0) : 'اختیاری / ۰',
      total: c.laborPerM2 > 0 ? formatFaNumber(c.laborCost, 0) : '۰',
    },
  ];

  tableRows.forEach((r, idx) => {
    const rowY = y + idx * rowH;
    drawRoundedBox(
      ctx,
      margin,
      rowY,
      contentWidth,
      rowH - 8,
      12,
      idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
      '#E2E8F0'
    );
    ctx.fillStyle = '#0F172A';
    ctx.font = `600 22px ${fontStack}`;
    ctx.textAlign = 'right';
    ctx.fillText(r.title, rightX - 24, rowY + 42);

    ctx.fillStyle = '#334155';
    ctx.font = `500 22px ${fontStack}`;
    ctx.fillText(r.qty, rightX - 420, rowY + 42);
    ctx.fillText(r.unitPrice, rightX - 660, rowY + 42);

    ctx.fillStyle = '#0F172A';
    ctx.font = `700 23px ${fontStack}`;
    ctx.textAlign = 'left';
    ctx.fillText(r.total, leftX + 24, rowY + 42);
  });

  // Grand Total Banner
  y += tableRows.length * rowH + 16;
  drawRoundedBox(ctx, margin, y, contentWidth, 96, 18, '#1D4ED8');
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 28px ${fontStack}`;
  ctx.textAlign = 'right';
  ctx.fillText('جمع کل برآورد هزینه:', rightX - 28, y + 58);

  ctx.font = `800 34px ${fontStack}`;
  ctx.textAlign = 'left';
  ctx.fillText(c.hasAnyPrice ? formatToman(c.totalCost) : 'قیمت واحد وارد نشده است', leftX + 28, y + 58);

  // Footer Disclaimer
  const footerY = height - 136;
  drawRoundedBox(ctx, margin, footerY, contentWidth, 76, 14, '#F1F5F9', '#CBD5E1');
  ctx.fillStyle = '#475569';
  ctx.font = `500 20px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.fillText(MANDATORY_DISCLAIMER, width / 2, footerY + 46);

  const imgData = canvas.toDataURL('image/jpeg', 0.94);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

  const blob = pdf.output('blob');
  return new File([blob], 'bannasanj-estimate.pdf', {type: 'application/pdf'});
}

export function triggerFileDownload(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result ?? '');
      const commaIdx = res.indexOf(',');
      resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function sharePlainText(
  title: string,
  text: string
): Promise<'shared' | 'copied' | 'aborted' | 'failed'> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title,
        text,
        dialogTitle: 'اشتراک‌گذاری پیش‌فاکتور',
      });
      return 'shared';
    } catch {
      return 'aborted';
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({title, text});
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'aborted';
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export async function shareOrSavePdfFile(
  file: File
): Promise<'shared' | 'downloaded' | 'aborted'> {
  if (Capacitor.isNativePlatform()) {
    const base64Data = await fileToBase64(file);
    const saved = await Filesystem.writeFile({
      path: `bannasanj-${Date.now()}.pdf`,
      data: base64Data,
      directory: Directory.Cache,
    });
    try {
      await Share.share({
        title: 'پیش‌فاکتور بناسنج',
        text: 'فایل PDF برآورد مصالح و هزینه دیوارچینی',
        url: saved.uri,
        dialogTitle: 'ذخیره یا ارسال فایل PDF',
      });
      return 'shared';
    } catch {
      return 'aborted';
    }
  }

  const navWithCanShare = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };

  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navWithCanShare.canShare &&
    navWithCanShare.canShare({files: [file]})
  ) {
    try {
      await navigator.share({
        title: 'پیش‌فاکتور بناسنج',
        text: 'فایل PDF برآورد مصالح و هزینه دیوارچینی',
        files: [file],
      });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return 'aborted';
      }
    }
  }

  triggerFileDownload(file);
  return 'downloaded';
}

