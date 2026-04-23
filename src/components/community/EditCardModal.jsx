import { useState, useEffect } from 'react';
import Modal from '../Modal';
import { usePet } from '../../context/PetContext';
import { useCommunity } from '../../context/CommunityContext';

const personalityOptions = ['Brincalhão', 'Calmo', 'Aventureiro', 'Tímido', 'Protetor', 'Bagunceiro'];

const fieldLabels = {
  name: 'Nome',
  breed: 'Raça',
  age: 'Idade',
  weight: 'Peso',
  city: 'Cidade',
  personality: 'Personalidade',
  photo: 'Foto',
};

export default function EditCardModal({ open, onClose }) {
  const { activePetId } = usePet();
  const { petCards, updatePetCard } = useCommunity();

  const card = petCards[activePetId] || {
    city: '',
    personality: '',
    visibleFields: { name: true, breed: true, age: true, weight: true, city: true, personality: true, photo: true },
  };

  const [city, setCity] = useState(card.city || '');
  const [personality, setPersonality] = useState(card.personality || '');
  const [visibleFields, setVisibleFields] = useState(card.visibleFields || {});

  useEffect(() => {
    if (open) {
      const c = petCards[activePetId] || { city: '', personality: '', visibleFields: { name: true, breed: true, age: true, weight: true, city: true, personality: true, photo: true } };
      setCity(c.city || '');
      setPersonality(c.personality || '');
      setVisibleFields(c.visibleFields || {});
    }
  }, [open, activePetId, petCards]);

  const toggleField = (field) => {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    updatePetCard(activePetId, { city, personality, visibleFields });
    onClose();
  };

  const inputClass = 'w-full bg-surface rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-light';
  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1.5';

  return (
    <Modal open={open} onClose={onClose} title="Editar Cartão">
      <div className="space-y-4">
        {/* City */}
        <div>
          <label className={labelClass}>Cidade</label>
          <input
            className={inputClass}
            placeholder="Ex: São Paulo"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Personality */}
        <div>
          <label className={labelClass}>Personalidade</label>
          <select
            className={inputClass}
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          >
            <option value="">Selecione...</option>
            {personalityOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Visibility toggles */}
        <div>
          <label className={labelClass}>Campos visíveis no cartão</label>
          <div className="space-y-2">
            {Object.keys(fieldLabels).map((field) => (
              <label
                key={field}
                className="flex items-center justify-between p-3 bg-surface rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-text-primary">{fieldLabels[field]}</span>
                <div
                  onClick={() => toggleField(field)}
                  className={`w-10 h-6 rounded-full transition-all duration-200 relative cursor-pointer ${
                    visibleFields[field] ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      visibleFields[field] ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-full font-semibold text-sm bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-[0.98] transition-all duration-200"
        >
          Salvar Cartão
        </button>
      </div>
    </Modal>
  );
}
