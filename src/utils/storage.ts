import {
  BUILT_IN_IDS,
  BUILT_IN_MATERIAL_PRESETS,
  getAllMaterials,
} from '../constants/materials';
import type {
  DimensionsCm,
  EstimateDraft,
  MaterialPreset,
  MaterialUsageRecord,
  MixRatioValue,
  SavedEstimate,
  SavedPriceProfile,
} from '../types';

const KEYS = {
  SAVED_ESTIMATES: 'bannasanj_saved_estimates_v1',
  PRICE_PROFILE: 'bannasanj_price_profile_v1',
  PRESET_OVERRIDES: 'bannasanj_preset_overrides_v1',
  USER_MATERIALS: 'bannasanj_user_materials_v1',
  MATERIAL_USAGE: 'bannasanj_material_usage_v1',
  DEFAULT_MORTAR: 'bannasanj_default_mortar_v1',
  ACTIVE_DRAFT: 'bannasanj_active_draft_v1',
};

export interface DefaultMortarSettings {
  jointThicknessCm: string;
  mixRatio: MixRatioValue;
  wastePercent: string;
}

export const INITIAL_MORTAR_SETTINGS: DefaultMortarSettings = {
  jointThicknessCm: '2',
  mixRatio: 5,
  wastePercent: '5',
};

// Strictly empty initial price profile — ZERO hardcoded prices anywhere.
export const EMPTY_PRICE_PROFILE: SavedPriceProfile = {
  unitPricesByMaterialId: {},
  pricePerCementBag: '',
  pricePerKgSand: '',
  laborPerM2: '',
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

const IDB_NAME = 'bannasanj_db';
const IDB_STORE = 'kv';

function mirrorToIndexedDB(key: string, value: unknown): void {
  if (typeof indexedDB === 'undefined') return;
  try {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
    };
  } catch {
    // localStorage remains primary synchronous source
  }
}

export function loadUserMaterials(): MaterialPreset[] {
  const list = safeReadJson<MaterialPreset[]>(KEYS.USER_MATERIALS, []);
  if (!Array.isArray(list)) return [];
  // Ensure user materials always have isBuiltIn = false
  return list
    .filter((item) => item && typeof item.id === 'string' && !BUILT_IN_IDS.has(item.id))
    .map((item) => ({
      ...item,
      isBuiltIn: false,
    }));
}

export function saveUserMaterial(material: MaterialPreset): MaterialPreset[] {
  const current = loadUserMaterials();
  const safeItem: MaterialPreset = {
    ...material,
    isBuiltIn: false,
  };
  const idx = current.findIndex((m) => m.id === safeItem.id);
  const next =
    idx >= 0
      ? current.map((m, i) => (i === idx ? safeItem : m))
      : [safeItem, ...current];
  safeWriteJson(KEYS.USER_MATERIALS, next);
  mirrorToIndexedDB(KEYS.USER_MATERIALS, next);
  return next;
}

/**
 * Deletes ONLY user-defined materials. Strictly refuses to delete built-in presets.
 */
export function deleteUserMaterial(materialId: string): MaterialPreset[] {
  if (BUILT_IN_IDS.has(materialId)) {
    return loadUserMaterials();
  }
  const current = loadUserMaterials();
  const next = current.filter((m) => m.id !== materialId);
  safeWriteJson(KEYS.USER_MATERIALS, next);
  mirrorToIndexedDB(KEYS.USER_MATERIALS, next);
  return next;
}

export function loadMaterialUsageStats(): Record<string, MaterialUsageRecord> {
  return safeReadJson<Record<string, MaterialUsageRecord>>(KEYS.MATERIAL_USAGE, {});
}

export function recordMaterialUsage(
  materialId: string
): Record<string, MaterialUsageRecord> {
  const stats = loadMaterialUsageStats();
  const prev = stats[materialId]?.count ?? 0;
  const next: Record<string, MaterialUsageRecord> = {
    ...stats,
    [materialId]: {
      count: prev + 1,
      lastUsedAt: new Date().toISOString(),
    },
  };
  safeWriteJson(KEYS.MATERIAL_USAGE, next);
  mirrorToIndexedDB(KEYS.MATERIAL_USAGE, next);
  return next;
}

export function loadSavedEstimates(): SavedEstimate[] {
  const list = safeReadJson<SavedEstimate[]>(KEYS.SAVED_ESTIMATES, []);
  return Array.isArray(list) ? list : [];
}

export function saveEstimateRecord(record: SavedEstimate): SavedEstimate[] {
  const current = loadSavedEstimates();
  const idx = current.findIndex((item) => item.id === record.id);
  let next: SavedEstimate[];
  if (idx >= 0) {
    next = [...current];
    next[idx] = record;
  } else {
    next = [record, ...current];
  }
  safeWriteJson(KEYS.SAVED_ESTIMATES, next);
  mirrorToIndexedDB(KEYS.SAVED_ESTIMATES, next);
  return next;
}

export function deleteEstimateRecord(id: string): SavedEstimate[] {
  const current = loadSavedEstimates();
  const next = current.filter((item) => item.id !== id);
  safeWriteJson(KEYS.SAVED_ESTIMATES, next);
  mirrorToIndexedDB(KEYS.SAVED_ESTIMATES, next);
  return next;
}

export function loadPriceProfile(): SavedPriceProfile {
  const profile = safeReadJson<SavedPriceProfile>(KEYS.PRICE_PROFILE, EMPTY_PRICE_PROFILE);
  return {
    unitPricesByMaterialId: profile?.unitPricesByMaterialId ?? {},
    pricePerCementBag: profile?.pricePerCementBag ?? '',
    pricePerKgSand: profile?.pricePerKgSand ?? '',
    laborPerM2: profile?.laborPerM2 ?? '',
    updatedAt: profile?.updatedAt,
  };
}

export function savePriceProfile(profile: SavedPriceProfile): void {
  const updated: SavedPriceProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  safeWriteJson(KEYS.PRICE_PROFILE, updated);
  mirrorToIndexedDB(KEYS.PRICE_PROFILE, updated);
}

export function clearPriceProfile(): SavedPriceProfile {
  const fresh: SavedPriceProfile = {
    unitPricesByMaterialId: {},
    pricePerCementBag: '',
    pricePerKgSand: '',
    laborPerM2: '',
  };
  safeWriteJson(KEYS.PRICE_PROFILE, fresh);
  mirrorToIndexedDB(KEYS.PRICE_PROFILE, fresh);
  return fresh;
}

export function loadPresetOverrides(): Record<string, DimensionsCm> {
  return safeReadJson<Record<string, DimensionsCm>>(KEYS.PRESET_OVERRIDES, {});
}

export function savePresetOverride(
  presetId: string,
  dims: DimensionsCm
): Record<string, DimensionsCm> {
  const current = loadPresetOverrides();
  const next = {...current, [presetId]: dims};
  safeWriteJson(KEYS.PRESET_OVERRIDES, next);
  return next;
}

export function resetPresetOverride(presetId: string): Record<string, DimensionsCm> {
  const current = loadPresetOverrides();
  const next = {...current};
  delete next[presetId];
  safeWriteJson(KEYS.PRESET_OVERRIDES, next);
  return next;
}

export function loadDefaultMortarSettings(): DefaultMortarSettings {
  return safeReadJson<DefaultMortarSettings>(KEYS.DEFAULT_MORTAR, INITIAL_MORTAR_SETTINGS);
}

export function saveDefaultMortarSettings(settings: DefaultMortarSettings): void {
  safeWriteJson(KEYS.DEFAULT_MORTAR, settings);
}

export function createInitialDraft(
  mortarDefaults: DefaultMortarSettings = loadDefaultMortarSettings(),
  overrides: Record<string, DimensionsCm> = loadPresetOverrides(),
  userMaterials: MaterialPreset[] = loadUserMaterials(),
  usageStats: Record<string, MaterialUsageRecord> = loadMaterialUsageStats()
): EstimateDraft {
  const all = getAllMaterials(userMaterials);

  // Smart default: pick the most recently used valid material if the user has used the app before!
  let chosen = BUILT_IN_MATERIAL_PRESETS[0];
  let latestTimestamp = '';
  for (const mat of all) {
    const usedAt = usageStats[mat.id]?.lastUsedAt;
    if (usedAt && usedAt > latestTimestamp) {
      latestTimestamp = usedAt;
      chosen = mat;
    }
  }

  const dims = overrides[chosen.id] ?? chosen.actualCm;
  return {
    serviceId: 'wall-masonry',
    projectTitle: '',
    lengthM: '',
    heightM: '',
    wallThicknessCm: String(chosen.recommendedWallThicknessCm),
    openings: [],
    selectedMaterialId: chosen.id,
    customMaterialName: chosen.name,
    activeDimensionsCm: {
      l: String(dims.l),
      h: String(dims.h),
      t: String(dims.t),
    },
    jointThicknessCm: mortarDefaults.jointThicknessCm,
    mixRatio: mortarDefaults.mixRatio,
    wastePercent: mortarDefaults.wastePercent,
  };
}

export function loadActiveDraft(): EstimateDraft | null {
  return safeReadJson<EstimateDraft | null>(KEYS.ACTIVE_DRAFT, null);
}

export function saveActiveDraft(draft: EstimateDraft): void {
  safeWriteJson(KEYS.ACTIVE_DRAFT, draft);
}
