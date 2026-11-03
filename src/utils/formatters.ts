const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts English/Arabic digits to Persian digits for display.
 */
export function toPersianDigits(input: string | number): string {
  return String(input)
    .replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)])
    .replace(/\./g, '٫');
}

/**
 * Converts Persian/Arabic digits and separators to normalized English numeric strings.
 */
export function normalizeNumericInput(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();
  // Persian digits ۰-۹ -> 0-9
  str = str.replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0));
  // Arabic digits ٠-٩ -> 0-9
  str = str.replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 0x0660));
  // Remove thousand separators
  str = str.replace(/[٬,\s_]/g, '');
  // Convert Persian decimal mark or slash to dot
  str = str.replace(/[٫/]/g, '.');
  return str;
}

/**
 * Cleans user typing in a decimal input while keeping Persian visual friendliness.
 */
export function sanitizeDecimalInput(raw: string): string {
  const normalized = normalizeNumericInput(raw);
  // Keep only digits and at most one decimal point
  let result = '';
  let hasDot = false;
  for (const ch of normalized) {
    if (ch >= '0' && ch <= '9') {
      result += ch;
    } else if (ch === '.' && !hasDot) {
      result += '.';
      hasDot = true;
    }
  }
  return result;
}

/**
 * Cleans integer price input (only digits).
 */
export function sanitizePriceInput(raw: string): string {
  const normalized = normalizeNumericInput(raw);
  return normalized.replace(/[^0-9.]/g, '');
}

/**
 * Parses a positive number (> 0). Returns null if invalid or <= 0.
 */
export function parsePositiveNumber(raw: string): number | null {
  const cleaned = normalizeNumericInput(raw);
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

/**
 * Parses a non-negative number (>= 0). Returns null if invalid or < 0.
 */
export function parseNonNegativeNumber(raw: string): number | null {
  const cleaned = normalizeNumericInput(raw);
  if (cleaned === '') return 0;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

/**
 * Formats a number with Persian digits and thousand separators.
 */
export function formatFaNumber(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '۰';
  const rounded =
    maxFractionDigits === 0
      ? Math.round(value)
      : Number(value.toFixed(maxFractionDigits));
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: maxFractionDigits,
  }).format(rounded);
}

/**
 * Formats an integer input string as Persian grouped digits for display inside price fields.
 */
export function formatPriceFieldDisplay(rawEnglishNumeric: string): string {
  if (!rawEnglishNumeric) return '';
  const cleaned = normalizeNumericInput(rawEnglishNumeric);
  if (!cleaned) return '';
  const parts = cleaned.split('.');
  const intPart = parts[0] ? Number(parts[0]) : 0;
  if (!Number.isFinite(intPart)) return '';
  const formattedInt = parts[0] === '' ? '' : new Intl.NumberFormat('fa-IR').format(intPart);
  if (parts.length > 1) {
    return `${formattedInt}٫${toPersianDigits(parts[1])}`;
  }
  return formattedInt;
}

/**
 * Formats currency in Iranian Toman with Persian numerals.
 */
export function formatToman(amount: number): string {
  return `${formatFaNumber(Math.round(amount), 0)} تومان`;
}

/**
 * Algorithmic helper that converts a typed Toman number into readable Persian scale text
 * (e.g. ۱۲ میلیون و ۵۰۰ هزار تومان) so users avoid zero-entry mistakes. Never contains preset prices.
 */
export function formatTomanScaleHint(rawPrice: string): string {
  const num = parsePositiveNumber(rawPrice);
  if (!num || num < 1000) return '';
  const rounded = Math.round(num);
  const billions = Math.floor(rounded / 1_000_000_000);
  const millions = Math.floor((rounded % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((rounded % 1_000_000) / 1_000);
  const remainder = rounded % 1_000;

  const chunks: string[] = [];
  if (billions > 0) chunks.push(`${formatFaNumber(billions, 0)} میلیارد`);
  if (millions > 0) chunks.push(`${formatFaNumber(millions, 0)} میلیون`);
  if (thousands > 0) chunks.push(`${formatFaNumber(thousands, 0)} هزار`);
  if (remainder > 0) chunks.push(`${formatFaNumber(remainder, 0)}`);

  return `${chunks.join(' و ')} تومان`;
}

/**
 * Formats an ISO date string to Persian Jalali calendar.
 */
export function formatJalaliDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}
