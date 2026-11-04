import blockCementHeavyImg from '../assets/images/block_cement_heavy_1793758116025.jpg';
import blockCementThinImg from '../assets/images/block_cement_thin_1793758116010.jpg';
import brickFeshariImg from '../assets/images/brick_feshari_solid_1793758110079.jpg';
import brickLaftoonImg from '../assets/images/brick_laftoon_perforated_1793758126638.jpg';
import brickSofalThickImg from '../assets/images/brick_sofal_thick_1793758114404.jpg';
import brickSofalThinImg from '../assets/images/brick_sofal_thin_1793758112909.jpg';
import type {MaterialCategory, MaterialPreset} from '../types';

const BUILT_IN_IMAGE_MAP: Record<string, string> = {
  'sofal-10': brickSofalThinImg,
  'sofal-15': brickSofalThickImg,
  'sofal-20': brickSofalThickImg,
  feshari: brickFeshariImg,
  laftoon: brickLaftoonImg,
  'block-10': blockCementThinImg,
  'block-15': blockCementHeavyImg,
  'block-20': blockCementHeavyImg,
};

/**
 * Smartly resolves the visual thumbnail image for built-in presets or user-defined custom materials.
 * Note: Only used for wall units (bricks/blocks), NEVER for cement or sand.
 */
export function resolveMaterialImage(
  material: Pick<MaterialPreset, 'id' | 'name' | 'category' | 'customImageDataUrl'> & {
    thicknessCm?: number;
  }
): string {
  if (material.customImageDataUrl) {
    return material.customImageDataUrl;
  }

  if (BUILT_IN_IMAGE_MAP[material.id]) {
    return BUILT_IN_IMAGE_MAP[material.id];
  }

  return inferSmartPreviewImage(
    material.name,
    material.category,
    material.thicknessCm ?? 15
  );
}

/**
 * Smartly picks the closest realistic masonry photo based on Persian material name, category, and thickness.
 */
export function inferSmartPreviewImage(
  name: string,
  category: MaterialCategory,
  thicknessCm: number
): string {
  const cleanName = name.trim();

  if (/لفتون|بهمنی|ده\s*سوراخ|نما|نسوز/.test(cleanName)) {
    return brickLaftoonImg;
  }
  if (/فشاری|گری|قزاقی|سنتی|توپر/.test(cleanName)) {
    return brickFeshariImg;
  }
  if (/سفال|تیغه/.test(cleanName)) {
    return thicknessCm <= 12 ? brickSofalThinImg : brickSofalThickImg;
  }
  if (
    category === 'block' ||
    /بلوک|هبلکس|لیکا|پوکه|سیمانی|سیپورکس/.test(cleanName)
  ) {
    return thicknessCm <= 12 ? blockCementThinImg : blockCementHeavyImg;
  }

  return thicknessCm <= 12 ? brickFeshariImg : brickSofalThickImg;
}
