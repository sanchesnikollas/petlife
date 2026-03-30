import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { mockPet, mockPet2, tutorInfo as mockTutor } from '../data/mockData';

const PetContext = createContext(null);

const STORAGE_KEY = 'petlife_data';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// Template for a brand new pet
function createEmptyPet(id) {
  return {
    id,
    name: '',
    species: 'dog',
    breed: '',
    birthDate: '',
    sex: 'male',
    weight: 0,
    photo: null,
    allergies: [],
    conditions: '',
    microchip: '',
    food: { brand: '', line: '', type: 'dry', portionGrams: 0, mealsPerDay: 2, schedule: ['08:00', '19:00'] },
    vaccines: [],
    dewormings: [],
    medications: [],
    weightHistory: [],
    consultations: [],
    nextConsultation: null,
    mealLog: [],
    records: [],
  };
}

export function PetProvider({ children }) {
  const stored = loadFromStorage();

  // Multi-pet state
  const [pets, setPets] = useState(stored?.pets || [mockPet, mockPet2]);
  const [activePetId, setActivePetId] = useState(stored?.activePetId || '1');
  const [tutor, setTutor] = useState(stored?.tutor || mockTutor);
  const [isAuthenticated, setIsAuthenticated] = useState(stored?.isAuthenticated ?? false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(stored?.hasSeenWelcome ?? false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(stored?.hasCompletedOnboarding ?? false);
  const [toast, setToast] = useState(null);
  const [reminders, setReminders] = useState(
    stored?.reminders || { vaccines: true, medications: true, food: true, consultations: true }
  );
  // When adding a new pet, this flag triggers onboarding for that pet
  const [addingNewPet, setAddingNewPet] = useState(false);

  // Derived: the currently active pet
  const pet = useMemo(() => pets.find((p) => p.id === activePetId) || pets[0], [pets, activePetId]);

  // Persist
  useEffect(() => {
    saveToStorage({ pets, activePetId, tutor, isAuthenticated, hasSeenWelcome, hasCompletedOnboarding, reminders });
  }, [pets, activePetId, tutor, isAuthenticated, hasSeenWelcome, hasCompletedOnboarding, reminders]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Helper: update the active pet in the array
  const updateActivePet = useCallback((updater) => {
    setPets((prev) => prev.map((p) => p.id === activePetId ? (typeof updater === 'function' ? updater(p) : { ...p, ...updater }) : p));
  }, [activePetId]);

  const updatePet = useCallback((updates) => {
    updateActivePet(updates);
  }, [updateActivePet]);

  const addVaccine = useCallback((vaccine) => {
    updateActivePet((prev) => ({
      ...prev,
      vaccines: [...prev.vaccines, { ...vaccine, id: `v${Date.now()}` }],
      records: [
        { id: `r${Date.now()}`, date: vaccine.lastDone, type: 'vaccine', title: `Vacina ${vaccine.name}`, description: `Aplicada em ${vaccine.clinic || 'clínica não informada'}. Próximo reforço: ${vaccine.nextDue || 'não agendado'}.`, attachments: [] },
        ...prev.records,
      ],
    }));
    showToast(`Vacina "${vaccine.name}" registrada!`);
  }, [updateActivePet, showToast]);

  const addMedication = useCallback((medication) => {
    updateActivePet((prev) => ({
      ...prev,
      medications: [...prev.medications, { ...medication, id: `m${Date.now()}` }],
      records: [
        { id: `r${Date.now()}`, date: medication.startDate || new Date().toISOString().split('T')[0], type: 'medication', title: `Início ${medication.name}`, description: `${medication.dose} · ${medication.frequency} · ${medication.duration} dias.`, attachments: [] },
        ...prev.records,
      ],
    }));
    showToast(`Medicação "${medication.name}" adicionada!`);
  }, [updateActivePet, showToast]);

  const addWeightEntry = useCallback((entry) => {
    updateActivePet((prev) => ({
      ...prev,
      weight: entry.value,
      weightHistory: [...prev.weightHistory, entry],
      records: [
        { id: `r${Date.now()}`, date: new Date().toISOString().split('T')[0], type: 'consultation', title: `Peso registrado: ${entry.value}kg`, description: 'Atualização de peso.', attachments: [] },
        ...prev.records,
      ],
    }));
    showToast(`Peso atualizado para ${entry.value}kg!`);
  }, [updateActivePet, showToast]);

  const logMeal = useCallback((meal) => {
    updateActivePet((prev) => ({ ...prev, mealLog: [meal, ...prev.mealLog] }));
    showToast('Refeição registrada!');
  }, [updateActivePet, showToast]);

  const addRecord = useCallback((record) => {
    updateActivePet((prev) => ({ ...prev, records: [{ ...record, id: `r${Date.now()}` }, ...prev.records] }));
    showToast('Registro adicionado ao prontuário!');
  }, [updateActivePet, showToast]);

  const addConsultation = useCallback((consultation) => {
    updateActivePet((prev) => ({
      ...prev,
      consultations: [{ ...consultation, id: `c${Date.now()}` }, ...prev.consultations],
      records: [
        { id: `r${Date.now()}`, date: consultation.date, type: 'consultation', title: `Consulta — ${consultation.type}`, description: consultation.notes || '', attachments: [] },
        ...prev.records,
      ],
    }));
    showToast('Consulta registrada!');
  }, [updateActivePet, showToast]);

  const addDeworming = useCallback((deworming) => {
    updateActivePet((prev) => ({
      ...prev,
      dewormings: [...prev.dewormings, { ...deworming, id: `d${Date.now()}` }],
      records: [
        { id: `r${Date.now()}`, date: deworming.lastDone, type: 'deworming', title: `Vermifugação — ${deworming.product}`, description: `Próxima dose: ${deworming.nextDue || 'não agendada'}.`, attachments: [] },
        ...prev.records,
      ],
    }));
    showToast('Vermifugação registrada!');
  }, [updateActivePet, showToast]);

  // Multi-pet actions
  const switchPet = useCallback((petId) => {
    setActivePetId(petId);
  }, []);

  const startAddingPet = useCallback(() => {
    const newId = `pet_${Date.now()}`;
    const newPet = createEmptyPet(newId);
    setPets((prev) => [...prev, newPet]);
    setActivePetId(newId);
    setAddingNewPet(true);
  }, []);

  const finishAddingPet = useCallback((petData) => {
    updateActivePet(petData);
    setAddingNewPet(false);
    showToast(`${petData.name} adicionado(a) à família!`);
  }, [updateActivePet, showToast]);

  const cancelAddingPet = useCallback(() => {
    // Remove the empty pet that was being added
    setPets((prev) => prev.filter((p) => p.id !== activePetId));
    setActivePetId(pets[0]?.id || '1');
    setAddingNewPet(false);
  }, [activePetId, pets]);

  const removePet = useCallback((petId) => {
    setPets((prev) => {
      const next = prev.filter((p) => p.id !== petId);
      if (next.length === 0) return prev;
      // If removing active pet, switch to first remaining
      if (petId === activePetId) {
        setActivePetId(next[0].id);
      }
      return next;
    });
    showToast('Pet removido.');
  }, [activePetId, showToast]);

  const login = useCallback((userData) => {
    if (userData?.name) {
      setTutor((prev) => ({ ...prev, name: userData.name, email: userData.email || prev.email }));
    }
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setHasSeenWelcome(true);
  }, []);

  const resetData = useCallback(() => {
    setPets([mockPet, mockPet2]);
    setActivePetId('1');
    setTutor(mockTutor);
    setIsAuthenticated(false);
    setHasSeenWelcome(false);
    setHasCompletedOnboarding(false);
    setAddingNewPet(false);
    setReminders({ vaccines: true, medications: true, food: true, consultations: true });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <PetContext.Provider
      value={{
        // Multi-pet
        pets,
        pet,
        activePetId,
        switchPet,
        startAddingPet,
        finishAddingPet,
        cancelAddingPet,
        removePet,
        addingNewPet,
        // Single-pet actions (operate on active pet)
        tutor,
        setTutor,
        updatePet,
        addVaccine,
        addMedication,
        addWeightEntry,
        logMeal,
        addRecord,
        addConsultation,
        addDeworming,
        // Auth & flow
        isAuthenticated,
        hasSeenWelcome,
        setHasSeenWelcome,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        login,
        logout,
        // UI
        toast,
        showToast,
        reminders,
        setReminders,
        resetData,
      }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  const context = useContext(PetContext);
  if (!context) throw new Error('usePet must be used within PetProvider');
  return context;
}
