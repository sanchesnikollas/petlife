import { useState, useEffect } from 'react';
import { usePet } from '../context/PetContext';
import WeightChart from '../components/WeightChart';
import Modal from '../components/Modal';
import { SkeletonCard, SkeletonList } from '../components/Skeleton';
import { useFood, useUpdateFood } from '../hooks/useFood';
import { useMeals, useLogMeal } from '../hooks/useMeals';
import { useWeight } from '../hooks/useWeight';
import { useFoodBrands } from '../hooks/useFoodBrands';
import { useCalculateNutrition } from '../hooks/useNutrition';
import {
  Clock, CheckCircle2, Package,
  Calculator, ToggleLeft, ToggleRight, PartyPopper, Flame, Search, Check,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Food() {
  const { pet, activePetId, showToast } = usePet();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // React Query hooks
  const { data: foodData, isLoading: foodLoading } = useFood(activePetId);
  const { data: mealsData = [], isLoading: mealsLoading } = useMeals(activePetId, todayStr);
  const { data: weightHistory = [], isLoading: weightLoading } = useWeight(activePetId);
  const logMealMut = useLogMeal(activePetId);
  const updateFoodMut = useUpdateFood(activePetId);
  const calculateMut = useCalculateNutrition(activePetId);

  const food = foodData || pet?.food || { schedule: [], portionGrams: 0, brand: '', mealsPerDay: 0, type: 'dry', line: '' };
  const [remindersOn, setRemindersOn] = useState(true);
  const [calcOpen, setCalcOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [justLogged, setJustLogged] = useState(null); // time string of just-logged meal

  const species = pet?.species || 'DOG';
  const { data: brands = [], isLoading: brandsLoading } = useFoodBrands({
    species,
    q: brandQuery.length >= 2 ? brandQuery : undefined,
  });

  const todayMeals = mealsData.filter((m) => m.given);
  const mealsDone = todayMeals.length;
  const allMealsDone = mealsDone >= food.mealsPerDay;

  const dailyKcal = Math.round(food.portionGrams * food.mealsPerDay * 3.5);

  const handleLogMeal = (time) => {
    logMealMut.mutate({ date: todayStr, time, given: true }, {
      onSuccess: () => showToast('Refeição registrada!'),
      onError: () => showToast('Erro ao registrar.', 'error'),
    });
    setJustLogged(time);
    setTimeout(() => setJustLogged(null), 1200);
  };

  const openCalculator = () => {
    setCalcOpen(true);
    setBrandQuery('');
    setSelectedBrand(null);
    setCalcResult(null);
  };

  const handleSelectBrand = (brand) => {
    setSelectedBrand(brand);
    setCalcResult(null);
  };

  const handleCalculate = () => {
    if (!selectedBrand) {
      showToast('Selecione uma ração primeiro.', 'error');
      return;
    }
    if (!pet?.weight) {
      showToast('Cadastre o peso do pet primeiro.', 'error');
      return;
    }
    calculateMut.mutate(
      { activityLevel: pet?.activityLevel || 'MODERATE', foodBrandId: selectedBrand.id },
      {
        onSuccess: (res) => setCalcResult(res),
        onError: () => showToast('Erro ao calcular. Tente novamente.', 'error'),
      }
    );
  };

  const handleApplyCalc = () => {
    if (!calcResult || !selectedBrand) return;
    updateFoodMut.mutate(
      {
        brand: selectedBrand.brand,
        line: selectedBrand.line,
        type: selectedBrand.type,
        portionGrams: calcResult.portionGrams,
        mealsPerDay: calcResult.mealsPerDay,
      },
      {
        onSuccess: () => {
          showToast('Porção ideal aplicada!');
          setCalcOpen(false);
        },
        onError: () => showToast('Erro ao salvar.', 'error'),
      }
    );
  };

  const foodTypeLabel = { dry: 'Seca', DRY: 'Seca', wet: 'Úmida', WET: 'Úmida', mixed: 'Mista', MIXED: 'Mista' };

  if (foodLoading) {
    return (
      <div className="pt-6">
        <h1 className="font-display text-2xl text-text-primary mb-1">Alimentação</h1>
        <p className="text-sm text-text-secondary mb-5">Rotina alimentar e controle de peso</p>
        <SkeletonCard className="mb-4" />
        <SkeletonCard className="mb-4" />
        <SkeletonList count={2} />
      </div>
    );
  }

  return (
    <div className="pt-6">
      <h1 className="font-display text-2xl text-text-primary mb-1">Alimentação</h1>
      <p className="text-sm text-text-secondary mb-5">Rotina alimentar e controle de peso</p>

      {/* Food Card */}
      <div className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm mb-4 card-interactive animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-warning-light flex items-center justify-center">
            <Package size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">{food.brand}</h3>
            <p className="text-xs text-text-secondary">{food.line || foodTypeLabel[food.type]}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Porção</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{food.portionGrams}g</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Refeições</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{food.mealsPerDay}x/dia</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Total</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{food.portionGrams * food.mealsPerDay}g</p>
          </div>
        </div>
        {/* Daily caloric estimate */}
        <div className="flex items-center gap-2 bg-accent/5 rounded-xl px-3 py-2">
          <Flame size={14} className="text-accent" />
          <p className="text-xs font-semibold text-accent">~{dailyKcal} kcal/dia estimado</p>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm mb-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text-primary">Refeições de Hoje</h3>
          <span className="text-xs font-semibold text-primary bg-primary-50 px-2.5 py-1 rounded-full">
            {mealsDone}/{food.mealsPerDay}
          </span>
        </div>

        {allMealsDone ? (
          /* Empty state: all meals done */
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mb-3">
              <PartyPopper size={28} className="text-success" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">Todas as refeições registradas!</h4>
            <p className="text-xs text-text-secondary">Parabéns! Rotina alimentar completa hoje.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {food.schedule.map((time, idx) => {
              const done = mealsData.some((m) => m.time === time && m.given);
              const wasJustLogged = justLogged === time;
              return (
                <div
                  key={time}
                  className="flex items-center justify-between bg-surface rounded-xl p-3 animate-fade-in-up"
                  style={{ animationDelay: `${120 + idx * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${done ? 'bg-success-light' : 'bg-gray-100'}`}>
                      {done ? (
                        <CheckCircle2
                          size={16}
                          className={`text-success ${wasJustLogged ? 'animate-check-bounce' : ''}`}
                        />
                      ) : (
                        <Clock size={16} className="text-text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{time}</p>
                      <p className="text-xs text-text-secondary">{food.portionGrams}g</p>
                    </div>
                  </div>
                  {!done && (
                    <button
                      onClick={() => handleLogMeal(time)}
                      className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary/90 active:scale-[0.97]"
                    >
                      Registrar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reminders Toggle */}
      <div className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm mb-4 card-interactive animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <Clock size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Lembretes de alimentação</h3>
              <p className="text-xs text-text-secondary">{remindersOn ? 'Ativado' : 'Desativado'}</p>
            </div>
          </div>
          <button onClick={() => setRemindersOn(!remindersOn)} className="text-primary">
            {remindersOn ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Nutrition Calculator */}
      <div
        className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm mb-4 card-interactive animate-fade-in-up cursor-pointer"
        style={{ animationDelay: '240ms' }}
        onClick={openCalculator}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Calculator size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-text-primary">Calcular porção ideal</h3>
            <p className="text-xs text-text-secondary">Baseado em peso, idade e nível de atividade</p>
          </div>
          <span className="text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded-full uppercase">NRC</span>
        </div>
      </div>

      {/* Nutrition Calculator Modal */}
      <Modal open={calcOpen} onClose={() => setCalcOpen(false)} title="Calcular porção ideal">
        <div className="space-y-4">
          {/* Search brands */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Buscar ração</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="Ex: Royal, Golden, Premier…"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Brand list */}
          {!selectedBrand && (
            <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-2">
              {brandsLoading && <p className="text-xs text-text-secondary p-2">Carregando…</p>}
              {!brandsLoading && brands.length === 0 && (
                <p className="text-xs text-text-secondary p-2">Nenhuma ração encontrada.</p>
              )}
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelectBrand(b)}
                  className="w-full text-left p-3 rounded-lg hover:bg-primary-50 active:bg-primary-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-text-primary">{b.brand}</p>
                  <p className="text-xs text-text-secondary">{b.line} • {b.kcalPer100g} kcal/100g</p>
                </button>
              ))}
            </div>
          )}

          {/* Selected brand */}
          {selectedBrand && (
            <div className="bg-primary-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{selectedBrand.brand}</p>
                <p className="text-xs text-text-secondary truncate">{selectedBrand.line} • {selectedBrand.kcalPer100g} kcal/100g</p>
              </div>
              <button
                onClick={() => { setSelectedBrand(null); setCalcResult(null); }}
                className="text-xs font-semibold text-primary hover:underline shrink-0"
              >
                Trocar
              </button>
            </div>
          )}

          {/* Calculate button */}
          {selectedBrand && !calcResult && (
            <button
              onClick={handleCalculate}
              disabled={calculateMut.isPending}
              className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {calculateMut.isPending ? 'Calculando…' : 'Calcular porção ideal'}
            </button>
          )}

          {/* Calc result */}
          {calcResult && (
            <div className="animate-fade-in-up space-y-3">
              <div className="bg-surface rounded-2xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Plano alimentar recomendado</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase">Calorias/dia</p>
                    <p className="text-lg font-bold text-text-primary">{calcResult.dailyKcal} kcal</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase">Ração/dia</p>
                    <p className="text-lg font-bold text-text-primary">{calcResult.gramsPerDay}g</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase">Refeições</p>
                    <p className="text-lg font-bold text-text-primary">{calcResult.mealsPerDay}x/dia</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase">Porção</p>
                    <p className="text-lg font-bold text-primary">{calcResult.portionGrams}g</p>
                  </div>
                </div>
                <p className="text-[10px] text-text-secondary mt-3">
                  Fase: {calcResult.lifeStage} · Fator: {calcResult.factor} · {calcResult.neutered ? 'Castrado' : 'Inteiro'}
                </p>
              </div>
              <button
                onClick={handleApplyCalc}
                disabled={updateFoodMut.isPending}
                className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={16} />
                {updateFoodMut.isPending ? 'Salvando…' : 'Aplicar ao meu pet'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Weight Chart */}
      <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
        <WeightChart data={weightHistory} />
      </div>
    </div>
  );
}
