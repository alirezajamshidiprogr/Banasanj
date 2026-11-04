import type {ConstructionServiceDef, MaterialPreset} from '../types';

export const MANDATORY_DISCLAIMER =
  'این اپ برآورد تقریبی مصالح است و جای مهندس ناظر یا محاسبات سازه‌ای را نمی‌گیرد.';

export const CONSTRUCTION_SERVICES: ConstructionServiceDef[] = [
  {
    id: 'wall-masonry',
    title: 'دیوارکشی و تیغه‌چینی',
    shortDesc: 'محاسبه دقیق آجر، بلوک، سیمان، ماسه و دستمزد دیوار',
    upcomingDetails: 'فعال و آماده استفاده',
    isActive: true,
    phaseLabel: 'فاز اول · فعال',
  },
  {
    id: 'plaster-undercoat',
    title: 'گچ‌کشی (گچ و خاک)',
    shortDesc: 'برآورد گچ و خاک، شمشه‌گیری و زیرکار دیوار و سقف',
    upcomingDetails:
      'در این بخش بر اساس متراژ و ضخامت گچ‌خاک، تعداد کیسه‌های گچ، خاک رس الک‌شده و دستمزد گچ‌کار محاسبه خواهد شد.',
    isActive: false,
    phaseLabel: 'در حال توسعه',
  },
  {
    id: 'whitewash-finish',
    title: 'سفیدکاری و پرداخت',
    shortDesc: 'برآورد گچ سفیدکاری میکرونیزه و رویه نهایی',
    upcomingDetails:
      'در این بخش تعداد کیسه گچ سفیدکاری، متراژ خالص سطوح و هزینه اجرای سفیدکاری محاسبه خواهد شد.',
    isActive: false,
    phaseLabel: 'در حال توسعه',
  },
  {
    id: 'roofing-slab',
    title: 'سقف‌زنی (تیرچه و بلوک / طاق‌ضربی)',
    shortDesc: 'برآورد تیرچه، بلوک سقفی یا یونولیت، آرماتور و بتن',
    upcomingDetails:
      'در این بخش بر اساس دهانه و مساحت سقف، تعداد تیرچه، بلوک سفالی/سیمانی یا فوم سقفی، میلگرد حرارتی و حجم بتن سقف محاسبه خواهد شد.',
    isActive: false,
    phaseLabel: 'در حال توسعه',
  },
  {
    id: 'cement-plaster',
    title: 'سیمان‌کاری و پلاستر',
    shortDesc: 'برآورد آستر و رویه سیمان سیاه و سفید نما و محوطه',
    upcomingDetails:
      'در این بخش مقدار سیمان، ماسه شسته/بادی و هزینه اجرای پلاستر زبره و نرمه محاسبه خواهد شد.',
    isActive: false,
    phaseLabel: 'در حال توسعه',
  },
  {
    id: 'flooring-screed',
    title: 'کف‌سازی، شیب‌بندی و موزاییک',
    shortDesc: 'برآورد پوکه، ملات کف‌سازی، موزاییک و سرامیک',
    upcomingDetails:
      'در این بخش حجم پوکه معدنی یا صنعتی، سیمان و ماسه شیب‌بندی و متراژ موزاییک یا سرامیک کف محاسبه خواهد شد.',
    isActive: false,
    phaseLabel: 'در حال توسعه',
  },
];

// Built-in standard Iranian masonry presets (strictly protected: isBuiltIn = true, never deletable)
export const BUILT_IN_MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'sofal-10',
    name: 'آجر سفال ۱۰',
    shortName: 'سفال ۱۰',
    category: 'brick',
    unitLabel: 'آجر',
    nominalCm: {l: 20, h: 20, t: 10},
    actualCm: {l: 19.5, h: 19.5, t: 9.5},
    recommendedWallThicknessCm: 10,
    subtitle: 'تیغه داخلی و جداکننده ۱۰ سانتی',
    isBuiltIn: true,
  },
  {
    id: 'sofal-15',
    name: 'آجر سفال ۱۵',
    shortName: 'سفال ۱۵',
    category: 'brick',
    unitLabel: 'آجر',
    nominalCm: {l: 20, h: 20, t: 15},
    actualCm: {l: 19.5, h: 19.5, t: 14.5},
    recommendedWallThicknessCm: 15,
    subtitle: 'دیوار میانی و پیرامونی ۱۵ سانتی',
    isBuiltIn: true,
  },
  {
    id: 'sofal-20',
    name: 'آجر سفال ۲۰',
    shortName: 'سفال ۲۰',
    category: 'brick',
    unitLabel: 'آجر',
    nominalCm: {l: 20, h: 20, t: 20},
    actualCm: {l: 19.5, h: 19.5, t: 19.5},
    recommendedWallThicknessCm: 20,
    subtitle: 'دیوار خارجی و پیرامونی ۲۰ سانتی',
    isBuiltIn: true,
  },
  {
    id: 'feshari',
    name: 'آجر فشاری',
    shortName: 'فشاری',
    category: 'brick',
    unitLabel: 'آجر',
    nominalCm: {l: 22, h: 5.5, t: 11},
    actualCm: {l: 21, h: 5.5, t: 10},
    recommendedWallThicknessCm: 11,
    subtitle: 'آجر گری توپر مناسب کرسی‌چینی و دیوار باربر',
    isBuiltIn: true,
  },
  {
    id: 'laftoon',
    name: 'آجر لفتون',
    shortName: 'لفتون',
    category: 'brick',
    unitLabel: 'آجر',
    nominalCm: {l: 21, h: 5.5, t: 10},
    actualCm: {l: 20.5, h: 5.5, t: 9.5},
    recommendedWallThicknessCm: 10,
    subtitle: 'آجر ده‌سوراخ نما و دیوارچینی تمیز',
    isBuiltIn: true,
  },
  {
    id: 'block-10',
    name: 'بلوک سیمانی ۱۰',
    shortName: 'بلوک ۱۰',
    category: 'block',
    unitLabel: 'بلوک',
    nominalCm: {l: 40, h: 20, t: 10},
    actualCm: {l: 39, h: 19, t: 10},
    recommendedWallThicknessCm: 10,
    subtitle: 'بلوک سبک یا سنگین تیغه‌ای ۱۰ سانتی',
    isBuiltIn: true,
  },
  {
    id: 'block-15',
    name: 'بلوک سیمانی ۱۵',
    shortName: 'بلوک ۱۵',
    category: 'block',
    unitLabel: 'بلوک',
    nominalCm: {l: 40, h: 20, t: 15},
    actualCm: {l: 39, h: 19, t: 15},
    recommendedWallThicknessCm: 15,
    subtitle: 'بلوک دیواری ۱۵ سانتی محوطه و ساختمان',
    isBuiltIn: true,
  },
  {
    id: 'block-20',
    name: 'بلوک سیمانی ۲۰',
    shortName: 'بلوک ۲۰',
    category: 'block',
    unitLabel: 'بلوک',
    nominalCm: {l: 40, h: 20, t: 20},
    actualCm: {l: 39, h: 19, t: 20},
    recommendedWallThicknessCm: 20,
    subtitle: 'بلوک سنگین محوطه، باغ و دیوار حیاط',
    isBuiltIn: true,
  },
];

export const BUILT_IN_IDS = new Set(BUILT_IN_MATERIAL_PRESETS.map((m) => m.id));

export function getAllMaterials(userMaterials: MaterialPreset[] = []): MaterialPreset[] {
  return [...BUILT_IN_MATERIAL_PRESETS, ...userMaterials];
}

export function getMaterialById(
  id: string,
  userMaterials: MaterialPreset[] = []
): MaterialPreset {
  const all = getAllMaterials(userMaterials);
  return all.find((m) => m.id === id) ?? BUILT_IN_MATERIAL_PRESETS[0];
}

export function getDefaultAlternativeMaterialId(
  currentId: string,
  userMaterials: MaterialPreset[] = []
): string {
  const map: Record<string, string> = {
    'sofal-10': 'block-10',
    'sofal-15': 'block-15',
    'sofal-20': 'block-20',
    feshari: 'laftoon',
    laftoon: 'feshari',
    'block-10': 'sofal-10',
    'block-15': 'sofal-15',
    'block-20': 'sofal-20',
  };
  if (map[currentId]) return map[currentId];

  const all = getAllMaterials(userMaterials);
  const current = all.find((m) => m.id === currentId);
  if (current) {
    // Smartly suggest a preset with closest thickness from the opposite category
    const opposite = BUILT_IN_MATERIAL_PRESETS.filter((p) => p.category !== current.category);
    if (opposite.length > 0) {
      opposite.sort(
        (a, b) =>
          Math.abs(a.recommendedWallThicknessCm - current.recommendedWallThicknessCm) -
          Math.abs(b.recommendedWallThicknessCm - current.recommendedWallThicknessCm)
      );
      return opposite[0].id;
    }
  }
  return 'block-10';
}

/**
 * Smartly infers category and unit label as the user types a new material name.
 */
export function inferMaterialCategoryFromName(name: string): {
  category: 'brick' | 'block';
  unitLabel: 'آجر' | 'بلوک';
} {
  if (/بلوک|هبلکس|لیکا|پوکه|سیپورکس|گازی|بتنی|سیمانی/.test(name)) {
    return {category: 'block', unitLabel: 'بلوک'};
  }
  return {category: 'brick', unitLabel: 'آجر'};
}
