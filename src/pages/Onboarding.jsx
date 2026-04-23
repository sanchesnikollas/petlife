import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { usePetsMutations } from '../hooks/usePets';
import {
  Dog, Cat, ChevronRight, ChevronLeft, Camera, X, Plus, PawPrint,
  Heart, Sparkles, Check,
} from 'lucide-react';
import { dogBreeds, catBreeds } from '../data/breeds';

const STEPS = [
  { label: 'Identidade', emoji: '🐾' },
  { label: 'Saúde', emoji: '💊' },
  { label: 'Alimentação', emoji: '🍽️' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setHasCompletedOnboarding, showToast, addingNewPet, finishAddingPet, cancelAddingPet } = usePet();
  const { create: createPet } = usePetsMutations();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [isFinishing, setIsFinishing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    birthDate: '',
    sex: 'male',
    photo: null,
    weight: '',
    allergies: [],
    conditions: '',
    microchip: '',
    activityLevel: 'MODERATE',
    healthPlan: '',
    neutered: false,
    neuteredDate: '',
    hasAllergies: false,
    hasConditions: false,
    foodBrand: '',
    foodType: 'dry',
    portionGrams: '',
    mealsPerDay: 2,
    schedule: ['08:00', '19:00'],
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [errors, setErrors] = useState({});
  const [breedQuery, setBreedQuery] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const breedRef = useRef(null);

  // Close breed dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (breedRef.current && !breedRef.current.contains(e.target)) {
        setShowBreedDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset breed when species changes
  useEffect(() => {
    set('breed', '');
    setBreedQuery('');
  }, [form.species]);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      set('allergies', [...form.allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (i) => set('allergies', form.allergies.filter((_, idx) => idx !== i));

  const addScheduleTime = () => set('schedule', [...form.schedule, '12:00']);
  const updateScheduleTime = (i, val) => {
    const next = [...form.schedule];
    next[i] = val;
    set('schedule', next);
  };
  const removeScheduleTime = (i) => set('schedule', form.schedule.filter((_, idx) => idx !== i));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => set('photo', reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Breed autocomplete logic
  const breedList = form.species === 'dog' ? dogBreeds : catBreeds;
  const filteredBreeds = breedQuery.trim()
    ? breedList.filter((b) => b.toLowerCase().includes(breedQuery.toLowerCase()))
    : breedList;

  const selectBreed = (breed) => {
    set('breed', breed);
    setBreedQuery(breed);
    setShowBreedDropdown(false);
  };

  const handleBreedInput = (val) => {
    setBreedQuery(val);
    setShowBreedDropdown(true);
    // Only set breed if it exactly matches a list entry
    const exact = breedList.find((b) => b.toLowerCase() === val.toLowerCase());
    set('breed', exact || '');
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!form.name.trim()) newErrors.name = true;
      if (!form.breed) newErrors.breed = true;
      if (!form.birthDate) newErrors.birthDate = true;
      else if (new Date(form.birthDate) > new Date()) newErrors.birthDate = 'future';
    } else if (step === 1) {
      if (!form.weight || parseFloat(form.weight) <= 0) newErrors.weight = true;
    } else if (step === 2) {
      if (!form.foodBrand.trim()) newErrors.foodBrand = true;
      if (!form.portionGrams || parseInt(form.portionGrams) <= 0) newErrors.portionGrams = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setDirection('forward');
    setStep(step + 1);
  };

  const goBack = () => {
    setDirection('back');
    setStep(step - 1);
  };

  const finish = () => {
    if (!validateStep()) return;
    setIsFinishing(true);

    const petData = {
      name: form.name,
      species: form.species.toUpperCase(),
      breed: form.breed,
      birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
      sex: form.sex?.toUpperCase() || undefined,
      weight: parseFloat(form.weight) || undefined,
      allergies: form.allergies.length ? form.allergies : undefined,
      conditions: form.conditions ? [form.conditions] : undefined,
      microchip: form.microchip || undefined,
      neutered: form.neutered,
      neuteredDate: form.neutered && form.neuteredDate
        ? new Date(form.neuteredDate).toISOString()
        : undefined,
      activityLevel: form.activityLevel,
      healthPlan: form.healthPlan || undefined,
    };

    createPet.mutate(petData, {
      onSuccess: (newPet) => {
        const petId = newPet?.id || newPet?.data?.id;
        if (petId) {
          finishAddingPet(petId);
        }
        setHasCompletedOnboarding(true);
        showToast(`Bem-vindo(a), ${form.name}! 🐾`);
        navigate('/');
      },
      onError: () => {
        setIsFinishing(false);
        showToast('Erro ao criar pet. Tente novamente.', 'error');
      },
    });
  };

  const inputClass = (key) =>
    `w-full bg-surface rounded-xl border px-4 py-3 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none transition-all ${
      errors[key] ? 'border-danger ring-2 ring-danger/20' : 'border-gray-200'
    }`;

  // Reusable toggle button pair
  const ToggleButtons = ({ value, onToggle, labelYes = 'Sim', labelNo = 'Não' }) => (
    <div className="grid grid-cols-2 gap-3">
      {[
        { val: true, label: labelYes },
        { val: false, label: labelNo },
      ].map(({ val, label }) => (
        <button
          key={String(val)}
          type="button"
          onClick={() => onToggle(val)}
          className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
            value === val
              ? 'border-primary bg-primary-50 text-primary shadow-sm shadow-primary/10'
              : 'border-gray-200 text-text-secondary hover:border-gray-300'
          }`}
        >
          <span className="font-semibold text-sm">{label}</span>
        </button>
      ))}
    </div>
  );

  const stepContent = (
    <div
      key={step}
      className={`animate-fade-in-up`}
    >
      {step === 0 && (
        <div className="space-y-4">
          {/* Photo */}
          <div className="flex justify-center mb-2">
            <label className="relative cursor-pointer group">
              <div className={`w-28 h-28 rounded-3xl bg-primary-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-primary-lighter group-hover:border-primary transition-colors ${form.photo ? 'border-solid border-primary' : ''}`}>
                {form.photo ? (
                  <img src={form.photo} alt="Pet" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera size={28} className="text-primary-light" />
                    <span className="text-[10px] font-medium text-primary-light">Adicionar foto</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                {form.photo ? <Check size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Nome do pet <span className="text-danger">*</span>
            </label>
            <input
              className={inputClass('name')}
              placeholder="Ex: Luna"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus
            />
            {errors.name && <p className="text-xs text-danger mt-1">Informe o nome do pet</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Espécie</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'dog', label: 'Cão', Icon: Dog },
                { val: 'cat', label: 'Gato', Icon: Cat },
              ].map(({ val, label, Icon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('species', val)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                    form.species === val
                      ? 'border-primary bg-primary-50 text-primary shadow-sm shadow-primary/10'
                      : 'border-gray-200 text-text-secondary hover:border-gray-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${form.species === val ? 'bg-primary/10' : 'bg-gray-100'}`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-semibold text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Breed Autocomplete */}
          <div ref={breedRef} className="relative">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Raça <span className="text-danger">*</span>
            </label>
            <input
              className={inputClass('breed')}
              placeholder={form.species === 'dog' ? 'Ex: Golden Retriever' : 'Ex: Siamês'}
              value={breedQuery}
              onChange={(e) => handleBreedInput(e.target.value)}
              onFocus={() => setShowBreedDropdown(true)}
            />
            {showBreedDropdown && filteredBreeds.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-surface-alt rounded-xl shadow-lg max-h-48 overflow-y-auto border border-gray-100">
                {filteredBreeds.map((breed) => (
                  <li
                    key={breed}
                    onClick={() => selectBreed(breed)}
                    className="py-2 px-4 text-sm text-text-primary hover:bg-primary-50 cursor-pointer transition-colors"
                  >
                    {breed}
                  </li>
                ))}
              </ul>
            )}
            {errors.breed && <p className="text-xs text-danger mt-1">Selecione uma raça da lista</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Nascimento <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className={inputClass('birthDate')}
                value={form.birthDate}
                onChange={(e) => set('birthDate', e.target.value)}
              />
              {errors.birthDate && <p className="text-xs text-danger mt-1">{errors.birthDate === 'future' ? 'Data não pode ser no futuro' : 'Obrigatório'}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Sexo</label>
              <select
                className={inputClass('')}
                value={form.sex}
                onChange={(e) => set('sex', e.target.value)}
              >
                <option value="male">Macho</option>
                <option value="female">Fêmea</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nível de atividade</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'LOW', label: 'Leve', desc: 'Calmo' },
                { val: 'MODERATE', label: 'Moderado', desc: 'Normal' },
                { val: 'HIGH', label: 'Alto', desc: 'Agitado' },
              ].map(({ val, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('activityLevel', val)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    form.activityLevel === val
                      ? 'border-primary bg-primary-50 text-primary shadow-sm'
                      : 'border-gray-200 text-text-secondary hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Peso atual (kg) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              className={inputClass('weight')}
              placeholder="Ex: 28.5"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              autoFocus
            />
            {errors.weight && <p className="text-xs text-danger mt-1">Informe um peso válido (maior que 0)</p>}
          </div>

          {/* Allergies toggle */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tem alergias conhecidas?</label>
            <ToggleButtons
              value={form.hasAllergies}
              onToggle={(val) => {
                set('hasAllergies', val);
                if (!val) {
                  set('allergies', []);
                  setAllergyInput('');
                }
              }}
            />
          </div>

          {form.hasAllergies && (
            <div className="animate-fade-in-up">
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Alergias</label>
              <div className="flex gap-2">
                <input
                  className={`${inputClass('')} flex-1`}
                  placeholder="Digite e pressione adicionar"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>
              {form.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {form.allergies.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-warning-light text-warning px-3 py-1.5 rounded-full text-xs font-semibold animate-scale-in"
                    >
                      {a}
                      <button type="button" onClick={() => removeAllergy(i)} className="hover:text-danger transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conditions toggle */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tem condições crônicas?</label>
            <ToggleButtons
              value={form.hasConditions}
              onToggle={(val) => {
                set('hasConditions', val);
                if (!val) set('conditions', '');
              }}
            />
          </div>

          {form.hasConditions && (
            <div className="animate-fade-in-up">
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Condições crônicas</label>
              <textarea
                className={`${inputClass('')} resize-none h-20`}
                placeholder="Descreva condições de saúde relevantes..."
                value={form.conditions}
                onChange={(e) => set('conditions', e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Microchip (opcional)</label>
            <input
              className={inputClass('')}
              placeholder="Número do microchip"
              value={form.microchip}
              onChange={(e) => set('microchip', e.target.value)}
            />
          </div>

          {/* Neutered toggle */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              É castrado(a)?
            </label>
            <ToggleButtons
              value={form.neutered}
              onToggle={(val) => {
                set('neutered', val);
                if (!val) set('neuteredDate', '');
              }}
            />
          </div>

          {form.neutered && (
            <div className="animate-fade-in-up">
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Data da castração</label>
              <input
                type="date"
                className={inputClass('')}
                value={form.neuteredDate}
                onChange={(e) => set('neuteredDate', e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Convênio / Plano de Saúde</label>
            <input
              className={inputClass('')}
              placeholder="Ex: PetLove Saúde, Porto Seguro Pet"
              value={form.healthPlan}
              onChange={(e) => set('healthPlan', e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Marca da ração <span className="text-danger">*</span>
            </label>
            <input
              className={inputClass('foodBrand')}
              placeholder="Ex: Royal Canin"
              value={form.foodBrand}
              onChange={(e) => set('foodBrand', e.target.value)}
              autoFocus
            />
            {errors.foodBrand && <p className="text-xs text-danger mt-1">Informe a marca</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tipo de alimentação</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'dry', label: 'Seca', desc: 'Ração' },
                { val: 'wet', label: 'Úmida', desc: 'Sachê' },
                { val: 'mixed', label: 'Mista', desc: 'Ambas' },
              ].map(({ val, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('foodType', val)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    form.foodType === val
                      ? 'border-primary bg-primary-50 text-primary shadow-sm'
                      : 'border-gray-200 text-text-secondary hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Porção (g) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className={inputClass('portionGrams')}
                placeholder="280"
                value={form.portionGrams}
                onChange={(e) => set('portionGrams', e.target.value)}
              />
              {errors.portionGrams && <p className="text-xs text-danger mt-1">Obrigatório</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Refeições/dia</label>
              <select
                className={inputClass('')}
                value={form.mealsPerDay}
                onChange={(e) => set('mealsPerDay', parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}x ao dia</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Horários das refeições</label>
            <div className="space-y-2">
              {form.schedule.map((time, i) => (
                <div key={i} className="flex items-center gap-2 animate-fade-in-up">
                  <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <input
                    type="time"
                    className={`${inputClass('')} flex-1`}
                    value={time}
                    onChange={(e) => updateScheduleTime(i, e.target.value)}
                  />
                  {form.schedule.length > 1 && (
                    <button type="button" onClick={() => removeScheduleTime(i)} className="p-2 text-danger hover:bg-danger-light rounded-xl active:scale-90 transition-transform">
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addScheduleTime}
              className="mt-2.5 text-sm font-semibold text-primary flex items-center gap-1 hover:text-primary-light active:scale-95 transition-transform"
            >
              <Plus size={16} /> Adicionar horário
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Finishing screen
  if (isFinishing) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
        <div className="animate-confetti-pop">
          <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
            <Heart size={40} className="text-primary" fill="#2D6A4F" />
          </div>
        </div>
        <h1 className="font-display text-3xl text-text-primary mb-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Tudo pronto!
        </h1>
        <p className="text-text-secondary text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          O perfil de <span className="font-semibold text-primary">{form.name}</span> foi criado com sucesso.
        </p>
        <div className="flex items-center gap-2 mt-4 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <Sparkles size={16} className="text-accent" />
          <span className="text-sm text-text-secondary">Preparando seu dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <PawPrint size={20} className="text-white" />
          </div>
          <span className="font-display text-2xl text-primary">PetLife</span>
          {addingNewPet && (
            <button
              type="button"
              onClick={() => { cancelAddingPet(); navigate('/'); }}
              className="ml-auto text-sm font-semibold text-text-secondary hover:text-danger transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
        <h2 className="font-display text-xl text-text-primary">
          {step === 0 && 'Quem é seu companheiro(a)?'}
          {step === 1 && 'Como está a saúde?'}
          {step === 2 && 'Qual a rotina alimentar?'}
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          {step === 0 && 'Conte-nos sobre a identidade do seu pet'}
          {step === 1 && 'Informações de saúde importantes'}
          {step === 2 && 'Última etapa! Configure a alimentação'}
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700 ease-out"
                  style={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{STEPS[step].emoji}</span>
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              Etapa {step + 1}/3
            </span>
          </div>
          <span className="text-xs font-medium text-text-secondary">{STEPS[step].label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {stepContent}
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 pt-4 bg-surface/80 backdrop-blur-sm border-t border-gray-100 sticky bottom-0">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="btn-secondary flex items-center gap-1 px-5 py-3 text-sm"
            >
              <ChevronLeft size={18} />
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={() => (step < 2 ? goNext() : finish())}
            className="btn-primary flex-1 flex items-center justify-center gap-1.5 px-5 py-3 text-sm"
          >
            {step < 2 ? (
              <>
                Próximo <ChevronRight size={18} />
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Começar a usar o PetLife
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
