import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { usePet } from '../../context/PetContext';
import { useCommunity } from '../../context/CommunityContext';
import EditCardModal from './EditCardModal';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';

function formatAge(birthDate) {
  if (!birthDate) return '';
  const birth = parseISO(birthDate);
  const years = differenceInYears(new Date(), birth);
  if (years >= 1) return `${years} ano${years > 1 ? 's' : ''}`;
  const months = differenceInMonths(new Date(), birth);
  return `${months} ${months === 1 ? 'mês' : 'meses'}`;
}

const personalityEmojis = {
  'Brincalhão': '🎾',
  'Calmo': '😌',
  'Aventureiro': '🏔️',
  'Tímido': '🙈',
  'Protetor': '🛡️',
  'Bagunceiro': '🌪️',
};

export default function PetSocialCard() {
  const { pet, activePetId } = usePet();
  const { petCards, followedGroups, groups } = useCommunity();
  const [showEdit, setShowEdit] = useState(false);

  const card = petCards[activePetId] || { visibleFields: { name: true, breed: true, age: true, weight: true, city: true, personality: true, photo: true } };
  const v = card.visibleFields || {};

  const followedGroupNames = groups
    .filter((g) => followedGroups.includes(g.id))
    .slice(0, 3);
  const extraGroups = Math.max(0, followedGroups.length - 3);

  return (
    <div className="animate-fade-in-up">
      {/* Card */}
      <div className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50/50 rounded-3xl border border-primary-lighter/30 shadow-lg shadow-primary/10 p-6 overflow-hidden">
        {/* Edit button */}
        <button
          onClick={() => setShowEdit(true)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md active:scale-90 transition-all"
        >
          <Pencil size={16} className="text-primary" />
        </button>

        {/* Photo */}
        {v.photo && (
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-primary-50 border-4 border-primary-lighter shadow-lg flex items-center justify-center text-4xl">
              {pet.photo ? (
                <img src={pet.photo} alt={pet.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                pet.species === 'cat' ? '🐱' : '🐶'
              )}
            </div>
          </div>
        )}

        {/* Name & Breed */}
        <div className="text-center mb-4">
          {v.name && (
            <h2 className="font-display text-2xl text-text-primary">{pet.name}</h2>
          )}
          {v.breed && (
            <p className="text-sm text-text-secondary mt-0.5">{pet.breed}</p>
          )}
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {v.age && pet.birthDate && (
            <div className="bg-white/70 rounded-xl p-3 text-center border border-gray-100/50">
              <p className="text-[10px] text-text-secondary uppercase tracking-wide">Idade</p>
              <p className="text-sm font-semibold text-text-primary">{formatAge(pet.birthDate)}</p>
            </div>
          )}
          {v.weight && pet.weight > 0 && (
            <div className="bg-white/70 rounded-xl p-3 text-center border border-gray-100/50">
              <p className="text-[10px] text-text-secondary uppercase tracking-wide">Peso</p>
              <p className="text-sm font-semibold text-text-primary">{pet.weight} kg</p>
            </div>
          )}
          {v.city && card.city && (
            <div className="bg-white/70 rounded-xl p-3 text-center border border-gray-100/50">
              <p className="text-[10px] text-text-secondary uppercase tracking-wide">Cidade</p>
              <p className="text-sm font-semibold text-text-primary">{card.city}</p>
            </div>
          )}
          {v.personality && card.personality && (
            <div className="bg-white/70 rounded-xl p-3 text-center border border-gray-100/50">
              <p className="text-[10px] text-text-secondary uppercase tracking-wide">Personalidade</p>
              <p className="text-sm font-semibold text-text-primary">
                {personalityEmojis[card.personality] || ''} {card.personality}
              </p>
            </div>
          )}
        </div>

        {/* Group badges */}
        {followedGroupNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {followedGroupNames.map((g) => (
              <span
                key={g.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/80 rounded-full text-xs font-medium text-text-secondary border border-gray-100/50"
              >
                {g.emoji} {g.name}
              </span>
            ))}
            {extraGroups > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 bg-primary-50 rounded-full text-xs font-medium text-primary">
                +{extraGroups}
              </span>
            )}
          </div>
        )}
      </div>

      <EditCardModal open={showEdit} onClose={() => setShowEdit(false)} />
    </div>
  );
}
