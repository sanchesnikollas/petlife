import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { Dog, Cat, Plus } from 'lucide-react';

export default function PetSwitcher() {
  const { pets, activePetId, switchPet, startAddingPet } = usePet();
  const navigate = useNavigate();

  const handleAddPet = () => {
    startAddingPet();
    navigate('/onboarding');
  };

  if (pets.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {pets.map((p) => {
        const isActive = p.id === activePetId;
        const Icon = p.species === 'cat' ? Cat : Dog;
        return (
          <button
            key={p.id}
            onClick={() => switchPet(p.id)}
            className={`flex flex-col items-center gap-1 shrink-0 transition-all duration-200 ${
              isActive ? 'scale-105' : 'opacity-60 hover:opacity-90'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-200 ${
                isActive
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface bg-primary-50 shadow-md'
                  : 'bg-gray-100'
              }`}
            >
              {p.photo ? (
                <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <Icon size={22} className={isActive ? 'text-primary' : 'text-text-secondary'} />
              )}
            </div>
            <span
              className={`text-[10px] font-semibold truncate max-w-[52px] ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              {p.name || 'Novo'}
            </span>
          </button>
        );
      })}

      {/* Add pet button */}
      <button
        onClick={handleAddPet}
        className="flex flex-col items-center gap-1 shrink-0 opacity-60 hover:opacity-100 transition-all"
      >
        <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-primary hover:bg-primary-50 transition-colors">
          <Plus size={18} className="text-text-secondary" />
        </div>
        <span className="text-[10px] font-medium text-text-secondary">Novo</span>
      </button>
    </div>
  );
}
