import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { Dog, Cat, Plus, ChevronDown } from 'lucide-react';

export default function TopBar() {
  const { pets, activePetId, switchPet, startAddingPet, tutor, pet } = usePet();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const lastScrollY = useRef(0);

  const handleAddPet = () => {
    startAddingPet();
    navigate('/onboarding');
  };

  const hasOverdue = pet.vaccines?.some((v) => v.status === 'overdue');

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60) {
        setCollapsed(true);
      } else if (currentY < lastScrollY.current) {
        setCollapsed(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 bg-surface-alt/95 backdrop-blur-xl border-b border-gray-200/40 transition-all duration-300"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-lg mx-auto px-5 pt-3 pb-3">
        {/* Row 1: Tutor — always visible */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0 text-lg">
              🧑
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-text-secondary leading-tight">Olá, bem-vindo!</p>
              <p className="text-sm font-bold text-text-primary truncate">{tutor.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasOverdue && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold bg-danger-light text-danger px-2.5 py-1 rounded-full animate-pulse-soft">
                ⚠ Pendência
              </span>
            )}
            {/* Collapsed: show active pet mini + expand hint */}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="flex items-center gap-1.5 shrink-0 bg-primary text-white pl-1.5 pr-2.5 py-1 rounded-full text-xs font-semibold shadow-sm animate-fade-in active:scale-95 transition-transform"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  {pet.species === 'cat' ? <Cat size={12} /> : <Dog size={12} />}
                </div>
                {pet.name}
                <ChevronDown size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Pet switcher — collapsible */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            collapsed ? 'max-h-0 opacity-0 mt-0' : 'max-h-20 opacity-100 mt-3'
          }`}
        >
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5 pr-2">
            {pets.map((p) => {
              const isActive = p.id === activePetId;
              const Icon = p.species === 'cat' ? Cat : Dog;
              return (
                <button
                  key={p.id}
                  onClick={() => switchPet(p.id)}
                  className={`flex items-center gap-2.5 shrink-0 pl-1.5 pr-4 py-1.5 rounded-2xl transition-all duration-200 active:scale-[0.96] ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-gray-100/80 text-text-secondary hover:bg-gray-200/80'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${
                    isActive ? 'bg-white/20' : 'bg-white'
                  }`}>
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={18} className={isActive ? 'text-white' : 'text-text-secondary'} />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-bold leading-tight truncate max-w-[100px] ${
                      isActive ? 'text-white' : 'text-text-primary'
                    }`}>
                      {p.name || 'Novo'}
                    </p>
                    <p className={`text-[10px] leading-tight truncate max-w-[100px] ${
                      isActive ? 'text-white/70' : 'text-text-secondary'
                    }`}>
                      {p.breed || (p.species === 'cat' ? 'Gato' : 'Cachorro')}
                    </p>
                  </div>
                </button>
              );
            })}

            <button
              onClick={handleAddPet}
              className="flex items-center justify-center shrink-0 w-11 h-11 rounded-2xl border-2 border-dashed border-gray-300 text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-50/50 transition-all duration-200 active:scale-[0.96]"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
