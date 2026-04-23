import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePets } from '../hooks/usePets';

const PetContext = createContext(null);

const ACTIVE_PET_KEY = 'petlife_active_pet_id';
const WELCOME_KEY = 'petlife_has_seen_welcome';
const ONBOARDING_KEY = 'petlife_has_completed_onboarding';

function loadKey(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function saveKey(key, val) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

export function PetProvider({ children }) {
  const [activePetId, setActivePetId] = useState(() => loadKey(ACTIVE_PET_KEY) || null);
  const [addingNewPet, setAddingNewPet] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasSeenWelcome, setHasSeenWelcomeState] = useState(() => loadKey(WELCOME_KEY) === 'true');
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(() => loadKey(ONBOARDING_KEY) === 'true');

  const queryClient = useQueryClient();

  // Pets from React Query cache
  const { data: petsData } = usePets();
  const pets = petsData || [];

  // Derive active pet from cache
  const pet = useMemo(() => {
    if (!pets.length) return null;
    return pets.find((p) => p.id === activePetId) || pets[0];
  }, [pets, activePetId]);

  // If we have pets but no activePetId set yet, pick the first one
  useMemo(() => {
    if (pets.length > 0 && !activePetId) {
      const firstId = pets[0].id;
      setActivePetId(firstId);
      saveKey(ACTIVE_PET_KEY, firstId);
    }
  }, [pets, activePetId]);

  // If user has pets, they've completed onboarding
  useMemo(() => {
    if (pets.length > 0 && !hasCompletedOnboarding) {
      setHasCompletedOnboardingState(true);
      saveKey(ONBOARDING_KEY, 'true');
    }
  }, [pets, hasCompletedOnboarding]);

  const switchPet = useCallback((petId) => {
    setActivePetId(petId);
    saveKey(ACTIVE_PET_KEY, petId);
  }, []);

  const startAddingPet = useCallback(() => {
    setAddingNewPet(true);
  }, []);

  const finishAddingPet = useCallback((newPetId) => {
    setActivePetId(newPetId);
    saveKey(ACTIVE_PET_KEY, newPetId);
    setAddingNewPet(false);
  }, []);

  const cancelAddingPet = useCallback(() => {
    setAddingNewPet(false);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const setHasSeenWelcome = useCallback((val) => {
    setHasSeenWelcomeState(val);
    saveKey(WELCOME_KEY, String(val));
  }, []);

  const setHasCompletedOnboarding = useCallback((val) => {
    setHasCompletedOnboardingState(val);
    saveKey(ONBOARDING_KEY, String(val));
  }, []);

  // For logout — reset local UI state
  const resetLocalState = useCallback(() => {
    setActivePetId(null);
    setAddingNewPet(false);
    setHasCompletedOnboardingState(false);
    saveKey(ONBOARDING_KEY, 'false');
    localStorage.removeItem(ACTIVE_PET_KEY);
    queryClient.clear();
  }, [queryClient]);

  return (
    <PetContext.Provider
      value={{
        pets,
        pet,
        activePetId,
        switchPet,
        startAddingPet,
        finishAddingPet,
        cancelAddingPet,
        addingNewPet,
        toast,
        showToast,
        hasSeenWelcome,
        setHasSeenWelcome,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        resetLocalState,
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
