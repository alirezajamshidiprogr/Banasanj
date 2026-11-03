import {Capacitor} from '@capacitor/core';
import {normalizeNumericInput} from './formatters';

export interface ParsedWallSentence {
  parsed: boolean;
  lengthM: number | null;
  heightM: number | null;
  wallThicknessCm: number | null;
  materialPresetId: string | null;
  openings: Array<{label: string; widthM: number; heightM: number}>;
  summaryFa: string;
  usedOfflineFallback?: boolean;
}

const PERSIAN_NUMBER_WORDS: Array<[RegExp, string]> = [
  [/چهار\s*و\s*نیم/g, '4.5'],
  [/سه\s*و\s*نیم/g, '3.5'],
  [/دو\s*و\s*نیم/g, '2.5'],
  [/یک\s*و\s*نیم/g, '1.5'],
  [/پانزده/g, '15'],
  [/بیست/g, '20'],
  [/دوازده/g, '12'],
  [/یازده/g, '11'],
  [/ده/g, '10'],
  [/نه/g, '9'],
  [/هشت/g, '8'],
  [/هفت/g, '7'],
  [/شش|شیش/g, '6'],
  [/پنج/g, '5'],
  [/چهار/g, '4'],
  [/سه/g, '3'],
  [/دو/g, '2'],
];

function replaceSpokenPersianNumbers(text: string): string {
  let out = text;
  for (const [pattern, val] of PERSIAN_NUMBER_WORDS) {
    out = out.replace(pattern, val);
  }
  return out;
}

/**
 * Built-in local parser used in native Android offline APK and whenever internet is unavailable.
 */
function parseSentenceLocally(rawText: string): ParsedWallSentence {
  const normalized = normalizeNumericInput(replaceSpokenPersianNumbers(rawText));
  let lengthM: number | null = null;
  let heightM: number | null = null;
  let wallThicknessCm: number | null = null;
  let materialPresetId: string | null = null;
  const openings: Array<{label: string; widthM: number; heightM: number}> = [];

  if (/بلوک/.test(normalized)) {
    if (/20/.test(normalized)) {
      materialPresetId = 'block-20';
      wallThicknessCm = 20;
    } else if (/15/.test(normalized)) {
      materialPresetId = 'block-15';
      wallThicknessCm = 15;
    } else {
      materialPresetId = 'block-10';
      if (/10/.test(normalized)) wallThicknessCm = 10;
    }
  } else if (/فشاری|گری/.test(normalized)) {
    materialPresetId = 'feshari';
    wallThicknessCm = 11;
  } else if (/لفتون|ده\s*سوراخ|بهمنی/.test(normalized)) {
    materialPresetId = 'laftoon';
    wallThicknessCm = 10;
  } else if (/سفال|تیغه/.test(normalized)) {
    if (/20/.test(normalized)) {
      materialPresetId = 'sofal-20';
      wallThicknessCm = 20;
    } else if (/15/.test(normalized)) {
      materialPresetId = 'sofal-15';
      wallThicknessCm = 15;
    } else {
      materialPresetId = 'sofal-10';
      if (/10/.test(normalized)) wallThicknessCm = 10;
    }
  }

  const thickMatch = normalized.match(/(?:ضخامت|عرض)\s*(\d+(?:\.\d+)?)\s*(?:سانت|cm)?/);
  if (thickMatch) {
    wallThicknessCm = Number(thickMatch[1]);
  }

  // Extract optional window/door opening like "پنجره 1.5 در 1.2" or "درب 1 در 2.1"
  const openingRegex = /(پنجره|درب)\s*(\d+(?:\.\d+)?)\s*(?:در|×|\*|x|X)\s*(\d+(?:\.\d+)?)/g;
  let opMatch: RegExpExecArray | null;
  let cleanedForWall = normalized;
  while ((opMatch = openingRegex.exec(normalized)) !== null) {
    const w = Number(opMatch[2]);
    const h = Number(opMatch[3]);
    if (w > 0 && h > 0) {
      openings.push({
        label: opMatch[1] === 'پنجره' ? 'پنجره' : 'در',
        widthM: w,
        heightM: h,
      });
      cleanedForWall = cleanedForWall.replace(opMatch[0], ' ');
    }
  }

  const crossMatch = cleanedForWall.match(/(\d+(?:\.\d+)?)\s*(?:در|×|\*|x|X)\s*(\d+(?:\.\d+)?)/);
  if (crossMatch) {
    lengthM = Number(crossMatch[1]);
    heightM = Number(crossMatch[2]);
  } else {
    const lenExplicit =
      cleanedForWall.match(/طول\s*(\d+(?:\.\d+)?)/) ||
      cleanedForWall.match(/(\d+(?:\.\d+)?)\s*متر\s*(?:دیوار|طول)/);
    const heightExplicit =
      cleanedForWall.match(/(?:ارتفاع|بلندی|بلندا)\s*(\d+(?:\.\d+)?)/) ||
      cleanedForWall.match(/(\d+(?:\.\d+)?)\s*متر\s*(?:ارتفاع|بلندی)/);

    if (lenExplicit) lengthM = Number(lenExplicit[1]);
    if (heightExplicit) heightM = Number(heightExplicit[1]);
  }

  const hasUseful = Boolean(
    lengthM || heightM || materialPresetId || wallThicknessCm || openings.length > 0
  );
  return {
    parsed: hasUseful,
    lengthM: lengthM && lengthM > 0 ? lengthM : null,
    heightM: heightM && heightM > 0 ? heightM : null,
    wallThicknessCm: wallThicknessCm && wallThicknessCm > 0 ? wallThicknessCm : null,
    materialPresetId,
    openings,
    summaryFa: hasUseful ? 'اطلاعات از متن تشخیص داده شد.' : '',
    usedOfflineFallback: true,
  };
}

/**
 * Parses natural language Persian input:
 * - On native Android APK or when offline: uses instant built-in Persian parser.
 * - On web when online: uses server-side Gemini endpoint (/api/parse-wall) with local fallback.
 */
export async function parseNaturalLanguageWall(text: string): Promise<ParsedWallSentence> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      parsed: false,
      lengthM: null,
      heightM: null,
      wallThicknessCm: null,
      materialPresetId: null,
      openings: [],
      summaryFa: '',
    };
  }

  if (Capacitor.isNativePlatform() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return parseSentenceLocally(trimmed);
  }

  try {
    const response = await fetch('/api/parse-wall', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text: trimmed}),
    });

    if (!response.ok) {
      return parseSentenceLocally(trimmed);
    }

    const data = (await response.json()) as ParsedWallSentence;
    if (data && typeof data.parsed === 'boolean') {
      return data;
    }
    return parseSentenceLocally(trimmed);
  } catch {
    return parseSentenceLocally(trimmed);
  }
}
