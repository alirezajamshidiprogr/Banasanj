import type {MaterialPreset} from '../types';

export const MANDATORY_DISCLAIMER =
  'این اپ برآورد تقریبی مصالح است و جای مهندس ناظر یا محاسبات سازه‌ای را نمی‌گیرد.';

export const MATERIAL_PRESETS: MaterialPreset[] = [
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
  },
  {
    id: 'custom',
    name: 'مصالح سفارشی',
    shortName: 'سفارشی',
    category: 'custom',
    unitLabel: 'واحد',
    nominalCm: {l: 25, h: 20, t: 15},
    actualCm: {l: 25, h: 20, t: 15},
    recommendedWallThicknessCm: 15,
    subtitle: 'ورود دستی طول، ارتفاع و ضخامت هر بلوک یا آجر',
  },
];

export function getPresetById(id: string): MaterialPreset {
  return MATERIAL_PRESETS.find((m) => m.id === id) ?? MATERIAL_PRESETS[0];
}

export function getDefaultAlternativeMaterialId(currentId: string): string {
  const map: Record<string, string> = {
    'sofal-10': 'block-10',
    'sofal-15': 'block-15',
    'sofal-20': 'block-20',
    feshari: 'laftoon',
    laftoon: 'feshari',
    'block-10': 'sofal-10',
    'block-15': 'sofal-15',
    'block-20': 'sofal-20',
    custom: 'sofal-15',
  };
  return map[currentId] ?? 'block-10';
}
