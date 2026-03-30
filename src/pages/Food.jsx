import { useState, useEffect } from 'react';
import { usePet } from '../context/PetContext';
import WeightChart from '../components/WeightChart';
import Modal from '../components/Modal';
import {
  UtensilsCrossed, Clock, CheckCircle2, Package, Scale,
  ScanLine, ToggleLeft, ToggleRight, PartyPopper, Flame,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Food() {
  const { pet, logMeal, showToast } = usePet();
  const [remindersOn, setRemindersOn] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanPhase, setScanPhase] = useState('scanning'); // 'scanning' | 'found'
  const [justLogged, setJustLogged] = useState(null); // time string of just-logged meal

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayMeals = pet.mealLog.filter((m) => m.date === todayStr);
  const mealsDone = todayMeals.filter((m) => m.given).length;
  const allMealsDone = mealsDone >= pet.food.mealsPerDay;

  const dailyKcal = Math.round(pet.food.portionGrams * pet.food.mealsPerDay * 3.5);

  const handleLogMeal = (time) => {
    logMeal({ date: todayStr, time, given: true });
    setJustLogged(time);
    setTimeout(() => setJustLogged(null), 1200);
  };

  // Scanner flow: open modal, wait 3s, show result
  const openScanner = () => {
    setScanPhase('scanning');
    setScannerOpen(true);
  };

  useEffect(() => {
    if (!scannerOpen || scanPhase !== 'scanning') return;
    const timer = setTimeout(() => setScanPhase('found'), 3000);
    return () => clearTimeout(timer);
  }, [scannerOpen, scanPhase]);

  const handleCloseScanner = () => {
    setScannerOpen(false);
    setScanPhase('scanning');
  };

  const foodTypeLabel = { dry: 'Seca', wet: 'Úmida', mixed: 'Mista' };

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
            <h3 className="text-sm font-bold text-text-primary">{pet.food.brand}</h3>
            <p className="text-xs text-text-secondary">{pet.food.line || foodTypeLabel[pet.food.type]}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Porção</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{pet.food.portionGrams}g</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Refeições</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{pet.food.mealsPerDay}x/dia</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Total</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{pet.food.portionGrams * pet.food.mealsPerDay}g</p>
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
            {mealsDone}/{pet.food.mealsPerDay}
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
            {pet.food.schedule.map((time, idx) => {
              const done = todayMeals.some((m) => m.time === time && m.given);
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
                      <p className="text-xs text-text-secondary">{pet.food.portionGrams}g</p>
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

      {/* Scanner Prototype */}
      <div
        className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm mb-4 card-interactive animate-fade-in-up cursor-pointer"
        style={{ animationDelay: '240ms' }}
        onClick={openScanner}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <ScanLine size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-text-primary">Scanner de Produto</h3>
            <p className="text-xs text-text-secondary">Escaneie a ração para info nutricional</p>
          </div>
          <span className="text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded-full uppercase">Testar</span>
        </div>
      </div>

      {/* Scanner Modal */}
      <Modal open={scannerOpen} onClose={handleCloseScanner} title="Scanner de Produto">
        {scanPhase === 'scanning' ? (
          <div className="flex flex-col items-center">
            {/* Fake camera viewfinder */}
            <div className="relative w-full aspect-square max-w-[280px] bg-black/80 rounded-2xl overflow-hidden">
              {/* Dark overlay with transparent center */}
              <div className="absolute inset-0">
                {/* Top overlay */}
                <div className="absolute top-0 left-0 right-0 h-[25%] bg-black/60" />
                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-black/60" />
                {/* Left overlay */}
                <div className="absolute top-[25%] left-0 w-[15%] h-[50%] bg-black/60" />
                {/* Right overlay */}
                <div className="absolute top-[25%] right-0 w-[15%] h-[50%] bg-black/60" />
              </div>

              {/* Scanning line */}
              <div className="absolute left-[15%] right-[15%] top-[25%] bottom-[25%]">
                <div className="scanner-line" />
              </div>

              {/* Corner markers */}
              {/* Top-left */}
              <div className="absolute top-[23%] left-[13%] w-5 h-5 border-t-2 border-l-2 border-accent rounded-tl-md" />
              {/* Top-right */}
              <div className="absolute top-[23%] right-[13%] w-5 h-5 border-t-2 border-r-2 border-accent rounded-tr-md" />
              {/* Bottom-left */}
              <div className="absolute bottom-[23%] left-[13%] w-5 h-5 border-b-2 border-l-2 border-accent rounded-bl-md" />
              {/* Bottom-right */}
              <div className="absolute bottom-[23%] right-[13%] w-5 h-5 border-b-2 border-r-2 border-accent rounded-br-md" />

              {/* Simulated barcode lines in center */}
              <div className="absolute top-[38%] left-[25%] right-[25%] flex gap-[2px] justify-center opacity-30">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white"
                    style={{ width: i % 3 === 0 ? 3 : 1, height: 40 }}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-text-secondary mt-4 animate-pulse">Escaneando produto...</p>
          </div>
        ) : (
          /* Product found result card */
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center">
                <CheckCircle2 size={24} className="text-success animate-check-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Produto encontrado!</h3>
                <p className="text-xs text-text-secondary">{pet.food.brand}</p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wide">Informação Nutricional</h4>
              <div className="space-y-2">
                {[
                  { label: 'Proteína Bruta', value: '26%' },
                  { label: 'Gordura', value: '14%' },
                  { label: 'Fibra Bruta', value: '3.5%' },
                  { label: 'Umidade', value: '10%' },
                  { label: 'Cálcio', value: '1.2%' },
                  { label: 'Fósforo', value: '0.9%' },
                  { label: 'Energia Metabolizável', value: '3.500 kcal/kg' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{item.label}</span>
                    <span className="text-xs font-bold text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCloseScanner}
              className="w-full mt-4 py-3 bg-primary text-white text-sm font-semibold rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-transform"
            >
              Fechar
            </button>
          </div>
        )}
      </Modal>

      {/* Weight Chart */}
      <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
        <WeightChart data={pet.weightHistory} />
      </div>
    </div>
  );
}
