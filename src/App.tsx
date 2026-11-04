import React, {useEffect, useMemo, useState} from 'react';
import {
  Bookmark,
  Calculator,
  Download,
  Home,
  Settings,
  WifiOff,
} from 'lucide-react';
import {AddMaterialModal} from './components/AddMaterialModal';
import {CompareModal} from './components/CompareModal';
import {DesktopSummaryRail} from './components/DesktopSummaryRail';
import {DimensionsStep} from './components/DimensionsStep';
import {HomeScreen} from './components/HomeScreen';
import {InvoiceStep} from './components/InvoiceStep';
import {MaterialStep} from './components/MaterialStep';
import {PricingStep} from './components/PricingStep';
import {ResultsStep} from './components/ResultsStep';
import {SavedScreen} from './components/SavedScreen';
import {SettingsScreen} from './components/SettingsScreen';
import {
  BUILT_IN_IDS,
  BUILT_IN_MATERIAL_PRESETS,
  getMaterialById,
} from './constants/materials';
import {useOnlineStatus, usePWAInstall} from './hooks/usePWA';
import type {
  AppTab,
  DimensionsCm,
  EstimateDraft,
  EstimateStep,
  MaterialPreset,
  MaterialUsageRecord,
  PriceStrings,
  SavedEstimate,
  SavedPriceProfile,
} from './types';
import {calculateWallCosts, calculateWallMaterials} from './utils/calculations';
import {formatFaNumber, parseNonNegativeNumber, parsePositiveNumber} from './utils/formatters';
import {
  clearPriceProfile,
  createInitialDraft,
  deleteEstimateRecord,
  deleteUserMaterial,
  loadActiveDraft,
  loadDefaultMortarSettings,
  loadMaterialUsageStats,
  loadPresetOverrides,
  loadPriceProfile,
  loadSavedEstimates,
  loadUserMaterials,
  recordMaterialUsage,
  resetPresetOverride,
  saveActiveDraft,
  saveDefaultMortarSettings,
  saveEstimateRecord,
  savePresetOverride,
  savePriceProfile,
  saveUserMaterial,
  type DefaultMortarSettings,
} from './utils/storage';

const STEP_LABELS: Array<{step: EstimateStep; label: string}> = [
  {step: 1, label: 'ابعاد'},
  {step: 2, label: 'مصالح'},
  {step: 3, label: 'مقادیر'},
  {step: 4, label: 'قیمت'},
  {step: 5, label: 'فاکتور'},
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [step, setStep] = useState<EstimateStep>(1);

  const [defaultMortar, setDefaultMortar] = useState<DefaultMortarSettings>(() =>
    loadDefaultMortarSettings()
  );
  const [presetOverrides, setPresetOverrides] = useState<Record<string, DimensionsCm>>(() =>
    loadPresetOverrides()
  );
  const [userMaterials, setUserMaterials] = useState<MaterialPreset[]>(() =>
    loadUserMaterials()
  );
  const [usageStats, setUsageStats] = useState<Record<string, MaterialUsageRecord>>(() =>
    loadMaterialUsageStats()
  );
  const [priceProfile, setPriceProfile] = useState<SavedPriceProfile>(() => loadPriceProfile());
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>(() =>
    loadSavedEstimates()
  );

  const [draft, setDraft] = useState<EstimateDraft>(() => {
    const existing = loadActiveDraft();
    return (
      existing ??
      createInitialDraft(
        loadDefaultMortarSettings(),
        loadPresetOverrides(),
        loadUserMaterials(),
        loadMaterialUsageStats()
      )
    );
  });

  // Current estimate's unit prices — initialized from saved user profile if user entered prices previously, otherwise strictly empty ""
  const [prices, setPrices] = useState<PriceStrings>(() => {
    const prof = loadPriceProfile();
    const initialDraft =
      loadActiveDraft() ??
      createInitialDraft(
        loadDefaultMortarSettings(),
        loadPresetOverrides(),
        loadUserMaterials(),
        loadMaterialUsageStats()
      );
    return {
      pricePerUnit: prof.unitPricesByMaterialId[initialDraft.selectedMaterialId] ?? '',
      pricePerCementBag: prof.pricePerCementBag ?? '',
      pricePerKgSand: prof.pricePerKgSand ?? '',
      laborPerM2: prof.laborPerM2 ?? '',
    };
  });

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const isOnline = useOnlineStatus();

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Persist active draft automatically for offline resilience
  useEffect(() => {
    saveActiveDraft(draft);
  }, [draft]);

  // Sync unit price when selected material changes if user has a saved price for that material
  useEffect(() => {
    const savedForMaterial = priceProfile.unitPricesByMaterialId[draft.selectedMaterialId] ?? '';
    setPrices((prev) => ({
      ...prev,
      pricePerUnit: savedForMaterial,
    }));
  }, [draft.selectedMaterialId]);

  const materialPreset = getMaterialById(draft.selectedMaterialId, userMaterials);
  const materialDisplayName =
    draft.selectedMaterialId === 'custom'
      ? draft.customMaterialName.trim() || 'مصالح سفارشی'
      : materialPreset.name;

  // Deterministic quantity calculation whenever inputs are valid
  const quantities = useMemo(() => {
    const lengthM = parsePositiveNumber(draft.lengthM);
    const heightM = parsePositiveNumber(draft.heightM);
    const wallThicknessCm = parsePositiveNumber(draft.wallThicknessCm);
    const unitLengthCm = parsePositiveNumber(draft.activeDimensionsCm.l);
    const unitHeightCm = parsePositiveNumber(draft.activeDimensionsCm.h);
    const unitThicknessCm = parsePositiveNumber(draft.activeDimensionsCm.t);
    const jointThicknessCm = parsePositiveNumber(draft.jointThicknessCm);
    const wastePercent = parseNonNegativeNumber(draft.wastePercent);

    if (
      !lengthM ||
      !heightM ||
      !wallThicknessCm ||
      !unitLengthCm ||
      !unitHeightCm ||
      !unitThicknessCm ||
      !jointThicknessCm ||
      wastePercent === null
    ) {
      return null;
    }

    const validOpenings = draft.openings
      .map((op) => ({
        widthM: parsePositiveNumber(op.widthM) ?? 0,
        heightM: parsePositiveNumber(op.heightM) ?? 0,
      }))
      .filter((op) => op.widthM > 0 && op.heightM > 0);

    const openingsSum = validOpenings.reduce((s, o) => s + o.widthM * o.heightM, 0);
    if (openingsSum >= lengthM * heightM) {
      return null;
    }

    return calculateWallMaterials({
      lengthM,
      heightM,
      wallThicknessCm,
      openings: validOpenings,
      unitLengthCm,
      unitHeightCm,
      unitThicknessCm,
      jointThicknessCm,
      mixRatio: draft.mixRatio,
      wastePercent,
    });
  }, [draft]);

  const costs = useMemo(() => {
    if (!quantities) return null;
    return calculateWallCosts(quantities, prices);
  }, [quantities, prices]);

  const hasActiveDraft = Boolean(draft.lengthM || draft.heightM);

  const handleStartNewEstimate = (reset: boolean) => {
    if (reset) {
      const fresh = createInitialDraft(
        defaultMortar,
        presetOverrides,
        userMaterials,
        usageStats
      );
      setDraft(fresh);
      setPrices({
        pricePerUnit: priceProfile.unitPricesByMaterialId[fresh.selectedMaterialId] ?? '',
        pricePerCementBag: priceProfile.pricePerCementBag ?? '',
        pricePerKgSand: priceProfile.pricePerKgSand ?? '',
        laborPerM2: priceProfile.laborPerM2 ?? '',
      });
      setStep(1);
    }
    setActiveTab('estimate');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleSaveNewMaterial = (newMat: MaterialPreset) => {
    const nextUserMaterials = saveUserMaterial(newMat);
    setUserMaterials(nextUserMaterials);
    const nextStats = recordMaterialUsage(newMat.id);
    setUsageStats(nextStats);

    setDraft((prev) => ({
      ...prev,
      selectedMaterialId: newMat.id,
      customMaterialName: newMat.name,
      wallThicknessCm: String(newMat.recommendedWallThicknessCm),
      activeDimensionsCm: {
        l: String(newMat.actualCm.l),
        h: String(newMat.actualCm.h),
        t: String(newMat.actualCm.t),
      },
    }));

    showToast(`«${newMat.name}» ذخیره شد و برای دفعات بعد هم در فهرست مصالح شما نمایش داده می‌شود.`);
  };

  const handleDeleteUserMaterial = (materialId: string) => {
    if (BUILT_IN_IDS.has(materialId)) {
      showToast('مصالح پیش‌فرض برنامه ثابت هستند و امکان حذف آن‌ها وجود ندارد.');
      return;
    }

    const nextUserMaterials = deleteUserMaterial(materialId);
    setUserMaterials(nextUserMaterials);

    if (draft.selectedMaterialId === materialId) {
      const fallback = BUILT_IN_MATERIAL_PRESETS[0];
      const fallbackDims = presetOverrides[fallback.id] ?? fallback.actualCm;
      setDraft((prev) => ({
        ...prev,
        selectedMaterialId: fallback.id,
        customMaterialName: fallback.name,
        wallThicknessCm: String(fallback.recommendedWallThicknessCm),
        activeDimensionsCm: {
          l: String(fallbackDims.l),
          h: String(fallbackDims.h),
          t: String(fallbackDims.t),
        },
      }));
    }

    showToast('مصالح سفارشی حذف شد.');
  };

  const handlePriceFieldChange = (field: keyof PriceStrings, rawValue: string) => {
    setPrices((prev) => {
      const nextPrices = {...prev, [field]: rawValue};

      // Save user-entered prices into their local Price Profile automatically for future convenience
      const nextProfile: SavedPriceProfile = {
        ...priceProfile,
        unitPricesByMaterialId: {
          ...priceProfile.unitPricesByMaterialId,
          ...(field === 'pricePerUnit' ? {[draft.selectedMaterialId]: rawValue} : {}),
        },
        pricePerCementBag:
          field === 'pricePerCementBag' ? rawValue : priceProfile.pricePerCementBag,
        pricePerKgSand: field === 'pricePerKgSand' ? rawValue : priceProfile.pricePerKgSand,
        laborPerM2: field === 'laborPerM2' ? rawValue : priceProfile.laborPerM2,
      };
      setPriceProfile(nextProfile);
      savePriceProfile(nextProfile);

      return nextPrices;
    });
  };

  const handleClearCurrentPrices = () => {
    setPrices({
      pricePerUnit: '',
      pricePerCementBag: '',
      pricePerKgSand: '',
      laborPerM2: '',
    });
  };

  const handleUpdateAlternativeUnitPrice = (materialId: string, price: string) => {
    const nextProfile: SavedPriceProfile = {
      ...priceProfile,
      unitPricesByMaterialId: {
        ...priceProfile.unitPricesByMaterialId,
        [materialId]: price,
      },
    };
    setPriceProfile(nextProfile);
    savePriceProfile(nextProfile);
  };

  const handleSwitchPrimaryMaterial = (presetId: string) => {
    const preset = getMaterialById(presetId, userMaterials);
    const dims = presetOverrides[preset.id] ?? preset.actualCm;
    const nextStats = recordMaterialUsage(preset.id);
    setUsageStats(nextStats);
    setDraft((prev) => ({
      ...prev,
      selectedMaterialId: preset.id,
      customMaterialName: preset.name,
      wallThicknessCm: String(preset.recommendedWallThicknessCm),
      activeDimensionsCm: {
        l: String(dims.l),
        h: String(dims.h),
        t: String(dims.t),
      },
    }));
    showToast(`مصالح دیوار به «${preset.name}» تغییر یافت.`);
  };

  const handleSaveEstimate = () => {
    if (!quantities || !costs) return;
    const now = new Date().toISOString();
    const recordId = draft.id ?? `est-${Date.now()}`;
    const autoTitle =
      draft.projectTitle.trim() ||
      `دیوار ${formatFaNumber(Number(draft.lengthM), 2)}×${formatFaNumber(
        Number(draft.heightM),
        2
      )} متر (${materialDisplayName})`;

    const record: SavedEstimate = {
      id: recordId,
      createdAt: now,
      updatedAt: now,
      projectTitle: autoTitle,
      draft: {...draft, id: recordId, projectTitle: autoTitle},
      materialName: materialDisplayName,
      prices,
      quantities,
      costs,
    };

    const updatedList = saveEstimateRecord(record);
    setSavedEstimates(updatedList);
    setUsageStats(recordMaterialUsage(draft.selectedMaterialId));
    setDraft((prev) => ({...prev, id: recordId, projectTitle: autoTitle}));
    showToast('پروژه با موفقیت در لیست ذخیره‌شده‌ها ثبت شد.');
  };

  const handleOpenSavedEstimate = (est: SavedEstimate) => {
    setDraft(est.draft);
    setPrices(est.prices);
    setStep(5);
    setActiveTab('estimate');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleDeleteSavedEstimate = (id: string) => {
    const next = deleteEstimateRecord(id);
    setSavedEstimates(next);
    if (draft.id === id) {
      setDraft((prev) => ({...prev, id: undefined}));
    }
    showToast('پروژه حذف شد.');
  };

  const hasSavedProfileValues = Boolean(
    priceProfile.pricePerCementBag ||
      priceProfile.pricePerKgSand ||
      priceProfile.laborPerM2 ||
      priceProfile.unitPricesByMaterialId[draft.selectedMaterialId]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-8">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            بناسنج
          </button>

          {/* Zone 2: Desktop Concise Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'home'
                  ? 'text-blue-700 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              خدمات بنّایی
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('estimate')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'estimate'
                  ? 'text-blue-700 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              دیوارکشی
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'saved'
                  ? 'text-blue-700 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              ذخیره‌شده‌ها
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-blue-700 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              تنظیمات
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            {!isInstalled && isInstallable ? (
              <button
                type="button"
                onClick={install}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>نصب اپ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStartNewEstimate(true)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                دیوارکشی جدید
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Offline Banner (only shown when offline; uses icon + text, no pulsing dots) */}
        {!isOnline && (
          <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-amber-950">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>حالت آفلاین فعال است — تمام محاسبات و پروژه‌های ذخیره‌شده بدون اینترنت کار می‌کنند.</span>
          </div>
        )}

        {activeTab === 'home' && (
          <HomeScreen
            savedEstimates={savedEstimates}
            priceProfile={priceProfile}
            userMaterials={userMaterials}
            hasActiveDraft={hasActiveDraft}
            onStartNewEstimate={handleStartNewEstimate}
            onOpenSavedList={() => setActiveTab('saved')}
            onOpenSavedEstimate={handleOpenSavedEstimate}
            onOpenPriceProfile={() => setActiveTab('settings')}
            onOpenAddMaterialModal={() => setIsAddMaterialOpen(true)}
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            isIOS={isIOS}
            onInstallApp={install}
          />
        )}

        {activeTab === 'estimate' && (
          <div className="space-y-5">
            {/* Guided 5-Step Progress Indicator */}
            <nav
              aria-label="مراحل محاسبه"
              className="rounded-2xl bg-white border border-slate-200 p-2 grid grid-cols-5 gap-1"
            >
              {STEP_LABELS.map((item) => {
                const isCurrent = step === item.step;
                const isReachable = item.step <= 2 || Boolean(quantities);
                return (
                  <button
                    key={item.step}
                    type="button"
                    disabled={!isReachable}
                    onClick={() => {
                      if (isReachable) {
                        setStep(item.step);
                        window.scrollTo({top: 0, behavior: 'smooth'});
                      }
                    }}
                    className={`min-h-[44px] rounded-xl px-1.5 py-1.5 text-center transition whitespace-nowrap shrink-0 ${
                      isCurrent
                        ? 'bg-slate-900 text-white font-bold'
                        : isReachable
                        ? 'text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-xs sm:text-sm tabular-nums-fa">
                      {formatFaNumber(item.step, 0)}. {item.label}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Responsive 2-Column Layout on Desktop, Clean Single-Column on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                {step === 1 && (
                  <DimensionsStep
                    draft={draft}
                    userMaterials={userMaterials}
                    presetOverrides={presetOverrides}
                    onChangeDraft={setDraft}
                    onBackToServices={() => {
                      setActiveTab('home');
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    onNextStep={() => {
                      setStep(2);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                  />
                )}

                {step === 2 && (
                  <MaterialStep
                    draft={draft}
                    userMaterials={userMaterials}
                    usageStats={usageStats}
                    presetOverrides={presetOverrides}
                    onChangeDraft={setDraft}
                    onSavePresetOverride={(presetId, dims) => {
                      const next = savePresetOverride(presetId, dims);
                      setPresetOverrides(next);
                    }}
                    onResetPresetOverride={(presetId) => {
                      const next = resetPresetOverride(presetId);
                      setPresetOverrides(next);
                    }}
                    onOpenAddMaterialModal={() => setIsAddMaterialOpen(true)}
                    onDeleteUserMaterial={handleDeleteUserMaterial}
                    onBack={() => {
                      setStep(1);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    onNext={() => {
                      setUsageStats(recordMaterialUsage(draft.selectedMaterialId));
                      setStep(3);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                  />
                )}

                {step === 3 && quantities && (
                  <ResultsStep
                    draft={draft}
                    materialPreset={materialPreset}
                    materialDisplayName={materialDisplayName}
                    quantities={quantities}
                    onOpenCompare={() => setIsCompareOpen(true)}
                    onBack={() => {
                      setStep(2);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    onNext={() => {
                      setStep(4);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                  />
                )}

                {step === 4 && quantities && costs && (
                  <PricingStep
                    materialPreset={materialPreset}
                    materialDisplayName={materialDisplayName}
                    quantities={quantities}
                    prices={prices}
                    costs={costs}
                    hasPrefilledProfilePrices={hasSavedProfileValues}
                    onChangePrice={handlePriceFieldChange}
                    onClearCurrentPrices={handleClearCurrentPrices}
                    onBack={() => {
                      setStep(3);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    onNext={() => {
                      setStep(5);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                  />
                )}

                {step === 5 && quantities && costs && (
                  <InvoiceStep
                    draft={draft}
                    materialPreset={materialPreset}
                    materialDisplayName={materialDisplayName}
                    quantities={quantities}
                    costs={costs}
                    isSavedAlready={Boolean(
                      draft.id && savedEstimates.some((s) => s.id === draft.id)
                    )}
                    onChangeProjectTitle={(title) =>
                      setDraft((prev) => ({...prev, projectTitle: title}))
                    }
                    onSaveEstimate={handleSaveEstimate}
                    onOpenCompare={() => setIsCompareOpen(true)}
                    onStartNewEstimate={() => handleStartNewEstimate(true)}
                    onBackToPrices={() => {
                      setStep(4);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    onShowToast={showToast}
                  />
                )}
              </div>

              {/* Desktop Live Blueprint & Summary Sidebar */}
              <div className="hidden lg:block lg:col-span-5">
                <DesktopSummaryRail
                  draft={draft}
                  materialPreset={materialPreset}
                  materialDisplayName={materialDisplayName}
                  unitLabel={materialPreset.unitLabel}
                  step={step}
                  quantities={quantities}
                  costs={costs}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <SavedScreen
            savedEstimates={savedEstimates}
            onOpenEstimate={handleOpenSavedEstimate}
            onDeleteEstimate={handleDeleteSavedEstimate}
            onStartNewEstimate={() => handleStartNewEstimate(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            priceProfile={priceProfile}
            userMaterials={userMaterials}
            defaultMortar={defaultMortar}
            onUpdatePriceProfile={(next) => {
              setPriceProfile(next);
              savePriceProfile(next);
            }}
            onClearAllPrices={() => {
              const cleared = clearPriceProfile();
              setPriceProfile(cleared);
              handleClearCurrentPrices();
            }}
            onUpdateDefaultMortar={(next) => {
              setDefaultMortar(next);
              saveDefaultMortarSettings(next);
            }}
            onOpenAddMaterialModal={() => setIsAddMaterialOpen(true)}
            onDeleteUserMaterial={handleDeleteUserMaterial}
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            isIOS={isIOS}
            onInstallApp={install}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Persistent User Material Modal */}
      <AddMaterialModal
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onSaveNewMaterial={handleSaveNewMaterial}
      />

      {/* Compare Mode Modal */}
      {quantities && costs && (
        <CompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          draft={draft}
          userMaterials={userMaterials}
          primaryPreset={materialPreset}
          primaryMaterialName={materialDisplayName}
          primaryQuantities={quantities}
          primaryCosts={costs}
          prices={prices}
          priceProfile={priceProfile}
          presetOverrides={presetOverrides}
          onUpdateAlternativeUnitPrice={handleUpdateAlternativeUnitPrice}
          onSwitchPrimaryMaterial={handleSwitchPrimaryMaterial}
        />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 rounded-2xl bg-slate-900 text-white px-4 py-3.5 text-sm font-semibold shadow-lg"
        >
          {toastMsg}
        </div>
      )}

      {/* Mobile Bottom Tab Navigation: خدمات، دیوارکشی، ذخیره‌شده‌ها، تنظیمات */}
      <nav
        aria-label="ناوبری اصلی"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center"
      >
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
            activeTab === 'home' ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] whitespace-nowrap">خدمات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('estimate')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
            activeTab === 'estimate' ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span className="text-[11px] whitespace-nowrap">دیوارکشی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
            activeTab === 'saved' ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[11px] whitespace-nowrap">ذخیره‌شده‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
            activeTab === 'settings' ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] whitespace-nowrap">تنظیمات</span>
        </button>
      </nav>
    </div>
  );
}
