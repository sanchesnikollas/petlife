import { usePet } from '../context/PetContext';
import { Dog, Cat, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';

function getAge(birthDate) {
  if (!birthDate) return '';
  const birth = parseISO(birthDate);
  const years = differenceInYears(new Date(), birth);
  const months = differenceInMonths(new Date(), birth) % 12;
  if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years}a ${months}m`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function PetHeader() {
  const { pet } = usePet();
  const hasOverdue = pet.vaccines.some((v) => v.status === 'overdue');
  const age = getAge(pet.birthDate);
  const greeting = getGreeting();

  return (
    <div className="pt-2 pb-4 animate-fade-in-up">
      {/* Greeting */}
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles size={14} className="text-accent" />
        <span className="text-sm font-medium text-text-secondary">
          {greeting}! Aqui está o dia de <span className="font-semibold text-text-primary">{pet.name}</span>
        </span>
      </div>

      {/* Pet info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm ring-2 ring-primary/10">
          {pet.photo ? (
            <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
          ) : pet.species === 'dog' ? (
            <Dog size={32} className="text-primary" />
          ) : (
            <Cat size={32} className="text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl text-text-primary truncate">{pet.name}</h1>
            {hasOverdue ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-danger-light text-danger px-2.5 py-0.5 rounded-full shrink-0 animate-pulse-soft">
                <AlertTriangle size={12} />
                Pendência
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-success-light text-success px-2.5 py-0.5 rounded-full shrink-0">
                <CheckCircle2 size={12} />
                Em dia
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            {pet.breed}{age ? ` · ${age}` : ''}{pet.weight ? ` · ${pet.weight}kg` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
