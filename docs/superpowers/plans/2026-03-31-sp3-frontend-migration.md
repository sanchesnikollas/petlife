# SP3 Implementation Plan — Frontend Migration from localStorage to Real API

**Date:** 2026-03-31
**Spec:** `docs/superpowers/specs/2026-03-31-sp3-frontend-migration-design.md`
**Backend:** `https://petlife-api-production-d707.up.railway.app`

---

## Task 1: Install React Query + Create API Layer

### Step 1.1 — Install dependency

```bash
cd ~/Documents/petlife && npm install @tanstack/react-query
```

### Step 1.2 — Create `.env`

**New file:** `~/Documents/petlife/.env`

```
VITE_API_URL=http://localhost:3001
```

### Step 1.3 — Create `src/lib/api.js`

**New file:** `~/Documents/petlife/src/lib/api.js`

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Module-level token — AuthContext sets this, api.js reads it directly.
// This avoids React re-renders and avoids stale closures.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

let isRefreshing = false;
let refreshPromise = null;

async function refreshToken() {
  // Deduplicate concurrent refresh attempts
  if (isRefreshing) return refreshPromise;
  isRefreshing = true;
  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      accessToken = data.accessToken;
      return data;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
}

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;

  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const opts = {
    method,
    headers,
    credentials: 'include',
  };

  if (body !== undefined && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  let res = await fetch(url, opts);

  // 401 interceptor — try refresh once, then retry
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    try {
      await refreshToken();
      // Retry with new token
      const retryHeaders = { ...headers, Authorization: `Bearer ${accessToken}` };
      res = await fetch(url, { ...opts, headers: retryHeaders });
    } catch {
      // Refresh failed — force logout handled by AuthContext
      accessToken = null;
      throw new ApiError(401, 'SESSION_EXPIRED', 'Sessão expirada. Faça login novamente.', null);
    }
  }

  // Parse response
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code = data?.error?.code || `HTTP_${res.status}`;
    const message = data?.error?.message || data?.message || 'Erro inesperado.';
    const fields = data?.error?.fields || null;
    throw new ApiError(res.status, code, message, fields);
  }

  return data;
}

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};

export default api;
```

### Step 1.4 — Commit

```
feat(sp3): add React Query and API layer with auth interceptor
```

---

## Task 2: AuthContext

### Step 2.1 — Create `src/context/AuthContext.jsx`

**New file:** `~/Documents/petlife/src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setAccessToken, ApiError } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true during initial silent refresh

  const isAuthenticated = !!user;

  // Called after successful login/register/refresh
  const setSession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setSession(data);
    return data;
  }, [setSession]);

  // Register
  const register = useCallback(async (name, email, password) => {
    const data = await api.post('/auth/register', { name, email, password });
    setSession(data);
    return data;
  }, [setSession]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.del('/auth/logout');
    } catch {
      // Ignore errors — we clear locally regardless
    }
    clearSession();
  }, [clearSession]);

  // Silent refresh on mount (cookie may hold valid refresh token)
  useEffect(() => {
    let cancelled = false;
    async function silentRefresh() {
      try {
        const data = await api.post('/auth/refresh');
        if (!cancelled) setSession(data);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    silentRefresh();
    return () => { cancelled = true; };
  }, [setSession, clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Step 2.2 — Update `src/App.jsx`

**Replace full file content of** `~/Documents/petlife/src/App.jsx`

```
old_string: entire file
```

The full new content:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PetProvider, usePet } from './context/PetContext';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Health from './pages/Health';
import Food from './pages/Food';
import Community from './pages/Community';
import Records from './pages/Records';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30 * 1000,       // 30 seconds
      gcTime: 5 * 60 * 1000,      // 5 minutes
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasSeenWelcome, setHasSeenWelcome, hasCompletedOnboarding, addingNewPet } = usePet();

  // Show nothing while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Step 1: Welcome intro (only first time)
  if (!hasSeenWelcome) {
    return <Welcome onContinue={() => setHasSeenWelcome(true)} />;
  }

  // Step 2: Login / Register
  if (!isAuthenticated) {
    return <Login />;
  }

  // Step 3: Onboarding (first pet setup)
  if (!hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Step 3.5: Adding a new pet — show onboarding without Layout
  if (addingNewPet) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Step 4: Main app
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/health" element={<Health />} />
        <Route path="/food" element={<Food />} />
        <Route path="/community" element={<Community />} />
        <Route path="/records" element={<Records />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PetProvider>
            <AppRoutes />
          </PetProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

**Exact edit (old_string -> new_string):**

```
old_string:
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PetProvider, usePet } from './context/PetContext';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Health from './pages/Health';
import Food from './pages/Food';
import Community from './pages/Community';
import Records from './pages/Records';
import Settings from './pages/Settings';

function AppRoutes() {
  const {
    isAuthenticated, hasSeenWelcome, setHasSeenWelcome,
    hasCompletedOnboarding, login, addingNewPet,
  } = usePet();

  // Step 1: Welcome intro (only first time)
  if (!hasSeenWelcome) {
    return <Welcome onContinue={() => setHasSeenWelcome(true)} />;
  }

  // Step 2: Login / Register
  if (!isAuthenticated) {
    return <Login onLogin={(userData) => login(userData)} />;
  }

  // Step 3: Onboarding (first pet setup)
  if (!hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Step 3.5: Adding a new pet — show onboarding without Layout
  if (addingNewPet) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Step 4: Main app
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/health" element={<Health />} />
        <Route path="/food" element={<Food />} />
        <Route path="/community" element={<Community />} />
        <Route path="/records" element={<Records />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PetProvider>
        <AppRoutes />
      </PetProvider>
    </BrowserRouter>
  );
}

new_string:
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PetProvider, usePet } from './context/PetContext';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Health from './pages/Health';
import Food from './pages/Food';
import Community from './pages/Community';
import Records from './pages/Records';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasSeenWelcome, setHasSeenWelcome, hasCompletedOnboarding, addingNewPet } = usePet();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Step 1: Welcome intro (only first time)
  if (!hasSeenWelcome) {
    return <Welcome onContinue={() => setHasSeenWelcome(true)} />;
  }

  // Step 2: Login / Register
  if (!isAuthenticated) {
    return <Login />;
  }

  // Step 3: Onboarding (first pet setup)
  if (!hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Step 3.5: Adding a new pet — show onboarding without Layout
  if (addingNewPet) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Step 4: Main app
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/health" element={<Health />} />
        <Route path="/food" element={<Food />} />
        <Route path="/community" element={<Community />} />
        <Route path="/records" element={<Records />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PetProvider>
            <AppRoutes />
          </PetProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### Step 2.3 — Commit

```
feat(sp3): add AuthContext with real login/register/refresh
```

---

## Task 3: Skeleton Component + PetContext Rewrite

### Step 3.1 — Create `src/components/Skeleton.jsx`

**New file:** `~/Documents/petlife/src/components/Skeleton.jsx`

```jsx
export default function Skeleton({ width, height, rounded = 'xl', className = '' }) {
  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }[rounded] || 'rounded-xl';

  return (
    <div
      className={`bg-gray-200 animate-pulse ${roundedClass} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton width={44} height={44} rounded="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton height={14} width="60%" rounded="md" />
          <Skeleton height={10} width="40%" rounded="md" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height={10} width="100%" rounded="md" />
        <Skeleton height={10} width="80%" rounded="md" />
      </div>
    </div>
  );
}

export function SkeletonStatusGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton width={32} height={32} rounded="lg" />
            <Skeleton height={10} width="50%" rounded="md" />
          </div>
          <Skeleton height={16} width="70%" rounded="md" />
          <Skeleton height={10} width="40%" rounded="md" className="mt-1" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <Skeleton width={40} height={40} rounded="xl" />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="50%" rounded="md" />
            <Skeleton height={10} width="70%" rounded="md" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Step 3.2 — Rewrite `src/context/PetContext.jsx`

**Replace full file content of** `~/Documents/petlife/src/context/PetContext.jsx`

```
old_string (lines 1-270, entire file)
```

New full content:

```jsx
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
```

**Exact edit (replaces entire file from line 1 to line 270):**

```
old_string:
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

new_string:
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
```

Then replace the PetProvider function body and export (the rest of the file from `export function PetProvider` to end):

```
old_string:
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

new_string:
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
```

### Step 3.3 — Commit

```
feat(sp3): add Skeleton component and rewrite PetContext as thin UI layer
```

---

## Task 4: React Query Hooks (Pets + Health)

### Step 4.1 — Create `src/hooks/usePets.js`

**New file:** `~/Documents/petlife/src/hooks/usePets.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: () => api.get('/pets'),
  });
}

export function usePetsMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (petData) => api.post('/pets', petData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  const update = useMutation({
    mutationFn: ({ petId, data }) => api.patch(`/pets/${petId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  const remove = useMutation({
    mutationFn: (petId) => api.del(`/pets/${petId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  return { create, update, remove };
}
```

### Step 4.2 — Create `src/hooks/useVaccines.js`

**New file:** `~/Documents/petlife/src/hooks/useVaccines.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useVaccines(petId) {
  return useQuery({
    queryKey: ['vaccines', petId],
    queryFn: () => api.get(`/pets/${petId}/vaccines`),
    enabled: !!petId,
  });
}

export function useVaccinesMutations(petId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vaccines', petId] });
    queryClient.invalidateQueries({ queryKey: ['records', petId] });
  };

  const add = useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/vaccines`, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ vaccineId, data }) => api.patch(`/pets/${petId}/vaccines/${vaccineId}`, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (vaccineId) => api.del(`/pets/${petId}/vaccines/${vaccineId}`),
    onSuccess: invalidate,
  });

  return { add, update, remove };
}
```

### Step 4.3 — Create `src/hooks/useDewormings.js`

**New file:** `~/Documents/petlife/src/hooks/useDewormings.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useDewormings(petId) {
  return useQuery({
    queryKey: ['dewormings', petId],
    queryFn: () => api.get(`/pets/${petId}/dewormings`),
    enabled: !!petId,
  });
}

export function useDewormingsMutations(petId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dewormings', petId] });
    queryClient.invalidateQueries({ queryKey: ['records', petId] });
  };

  const add = useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/dewormings`, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ dewormingId, data }) => api.patch(`/pets/${petId}/dewormings/${dewormingId}`, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (dewormingId) => api.del(`/pets/${petId}/dewormings/${dewormingId}`),
    onSuccess: invalidate,
  });

  return { add, update, remove };
}
```

### Step 4.4 — Create `src/hooks/useMedications.js`

**New file:** `~/Documents/petlife/src/hooks/useMedications.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useMedications(petId) {
  return useQuery({
    queryKey: ['medications', petId],
    queryFn: () => api.get(`/pets/${petId}/medications`),
    enabled: !!petId,
  });
}

export function useMedicationsMutations(petId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['medications', petId] });
    queryClient.invalidateQueries({ queryKey: ['records', petId] });
  };

  const add = useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/medications`, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ medicationId, data }) => api.patch(`/pets/${petId}/medications/${medicationId}`, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (medicationId) => api.del(`/pets/${petId}/medications/${medicationId}`),
    onSuccess: invalidate,
  });

  return { add, update, remove };
}
```

### Step 4.5 — Create `src/hooks/useConsultations.js`

**New file:** `~/Documents/petlife/src/hooks/useConsultations.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useConsultations(petId) {
  return useQuery({
    queryKey: ['consultations', petId],
    queryFn: () => api.get(`/pets/${petId}/consultations`),
    enabled: !!petId,
  });
}

export function useConsultationsMutations(petId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['consultations', petId] });
    queryClient.invalidateQueries({ queryKey: ['records', petId] });
  };

  const add = useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/consultations`, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ consultationId, data }) => api.patch(`/pets/${petId}/consultations/${consultationId}`, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (consultationId) => api.del(`/pets/${petId}/consultations/${consultationId}`),
    onSuccess: invalidate,
  });

  return { add, update, remove };
}
```

### Step 4.6 — Commit

```
feat(sp3): add React Query hooks for pets, vaccines, dewormings, medications, consultations
```

---

## Task 5: React Query Hooks (Food + Records + Profile)

### Step 5.1 — Create `src/hooks/useFood.js`

**New file:** `~/Documents/petlife/src/hooks/useFood.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useFood(petId) {
  return useQuery({
    queryKey: ['food', petId],
    queryFn: () => api.get(`/pets/${petId}/food`),
    enabled: !!petId,
  });
}

export function useFoodMutations(petId) {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: (data) => api.patch(`/pets/${petId}/food`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food', petId] });
    },
  });

  return { update };
}
```

### Step 5.2 — Create `src/hooks/useMeals.js`

**New file:** `~/Documents/petlife/src/hooks/useMeals.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useMeals(petId, date) {
  return useQuery({
    queryKey: ['meals', petId, date],
    queryFn: () => api.get(`/pets/${petId}/meals?date=${date}`),
    enabled: !!petId && !!date,
  });
}

export function useMealsMutations(petId) {
  const queryClient = useQueryClient();

  const log = useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/meals`, data),
    onSuccess: (_, variables) => {
      // Invalidate the meals query for the date that was logged
      queryClient.invalidateQueries({ queryKey: ['meals', petId] });
    },
  });

  return { log };
}
```

### Step 5.3 — Create `src/hooks/useWeight.js`

**New file:** `~/Documents/petlife/src/hooks/useWeight.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useWeight(petId) {
  return useQuery({
    queryKey: ['weight', petId],
    queryFn: () => api.get(`/pets/${petId}/weight`),
    enabled: !!petId,
  });
}

export function useWeightMutations(petId) {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/weight`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight', petId] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  return { add };
}
```

### Step 5.4 — Create `src/hooks/useRecords.js`

**New file:** `~/Documents/petlife/src/hooks/useRecords.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useRecords(petId, params = {}) {
  const { type, page = 1, limit = 20 } = params;
  const queryParams = new URLSearchParams();
  if (type && type !== 'all') queryParams.set('type', type);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));

  return useQuery({
    queryKey: ['records', petId, { type, page, limit }],
    queryFn: () => api.get(`/pets/${petId}/records?${queryParams.toString()}`),
    enabled: !!petId,
  });
}

export function useRecordsMutations(petId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['records', petId] });
  };

  const create = useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/records`, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ recordId, data }) => api.patch(`/pets/${petId}/records/${recordId}`, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (recordId) => api.del(`/pets/${petId}/records/${recordId}`),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
```

### Step 5.5 — Create `src/hooks/useProfile.js`

**New file:** `~/Documents/petlife/src/hooks/useProfile.js`

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/me'),
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: (data) => api.patch('/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const remove = useMutation({
    mutationFn: () => api.del('/me'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return { update, remove };
}
```

### Step 5.6 — Commit

```
feat(sp3): add React Query hooks for food, meals, weight, records, profile
```

---

## Task 6: Migrate Pages (Login + Onboarding + Dashboard)

### Step 6.1 — Rewrite `src/pages/Login.jsx`

**Replace full file content of** `~/Documents/petlife/src/pages/Login.jsx`

```
old_string:
import { useState } from 'react';
import { PawPrint, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validateForm = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) errs.email = 'Informe o email';
    else if (!emailRegex.test(form.email)) errs.email = 'Email inválido';
    if (!form.password) errs.password = 'Informe a senha';
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (mode === 'register' && !form.name.trim()) errs.name = 'Informe seu nome';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(form);
    }, 1200);
  };

new_string:
import { useState } from 'react';
import { PawPrint, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
    setApiError(null);
  };

  const validateForm = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) errs.email = 'Informe o email';
    else if (!emailRegex.test(form.email)) errs.email = 'Email inválido';
    if (!form.password) errs.password = 'Informe a senha';
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (mode === 'register' && !form.name.trim()) errs.name = 'Informe seu nome';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setApiError(null);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } catch (err) {
      // Handle field-level errors from API
      if (err.fields) {
        const fieldErrors = {};
        for (const [key, msg] of Object.entries(err.fields)) {
          fieldErrors[key] = msg;
        }
        setErrors(fieldErrors);
      } else if (err.status === 401) {
        setApiError('Email ou senha incorretos.');
      } else if (err.status === 409) {
        setApiError('Este email já está cadastrado.');
      } else if (err.message) {
        setApiError(err.message);
      } else {
        setApiError('Erro de conexão. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };
```

Then replace the social login button handlers and the forgot password handler:

```
old_string:
            type="button"
            onClick={() => alert('Um link de recuperação seria enviado para o email informado. (Funcionalidade disponível com backend)')}
            className="text-xs font-semibold text-primary hover:text-primary-light"

new_string:
            type="button"
            onClick={() => setApiError('Funcionalidade de recuperação de senha estará disponível em breve.')}
            className="text-xs font-semibold text-primary hover:text-primary-light"
```

Add the API error display after the form submit button block. Insert after the `</button>` that closes the submit button, before the `</form>`:

```
old_string:
          </button>
        </form>

new_string:
          </button>

          {apiError && (
            <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 mt-3 animate-fade-in-up">
              <p className="text-xs font-semibold text-danger">{apiError}</p>
            </div>
          )}
        </form>
```

Replace the social login button onClicks (both Google and Apple):

```
old_string:
            onClick={() => { setLoading(true); setTimeout(() => onLogin(form), 800); }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-surface-alt text-sm font-medium text-text-primary hover:border-gray-300 active:scale-[0.97] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => { setLoading(true); setTimeout(() => onLogin(form), 800); }}

new_string:
            onClick={() => setApiError('Login social estará disponível em breve.')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-surface-alt text-sm font-medium text-text-primary hover:border-gray-300 active:scale-[0.97] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => setApiError('Login social estará disponível em breve.')}
```

### Step 6.2 — Rewrite `src/pages/Onboarding.jsx`

Replace the imports and the `finish` function to use the API mutation:

```
old_string:
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import {
  Dog, Cat, ChevronRight, ChevronLeft, Camera, X, Plus, PawPrint,
  Heart, Sparkles, Check,
} from 'lucide-react';

new_string:
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { usePetsMutations } from '../hooks/usePets';
import {
  Dog, Cat, ChevronRight, ChevronLeft, Camera, X, Plus, PawPrint,
  Heart, Sparkles, Check,
} from 'lucide-react';
```

Replace the destructure at the top of the component:

```
old_string:
  const navigate = useNavigate();
  const { updatePet, setHasCompletedOnboarding, showToast, addingNewPet, finishAddingPet, cancelAddingPet } = usePet();
  const [step, setStep] = useState(0);

new_string:
  const navigate = useNavigate();
  const { setHasCompletedOnboarding, showToast, addingNewPet, finishAddingPet, cancelAddingPet } = usePet();
  const { create: createPetMutation } = usePetsMutations();
  const [step, setStep] = useState(0);
```

Replace the `finish` function:

```
old_string:
  const finish = () => {
    if (!validateStep()) return;
    setIsFinishing(true);

    const petData = {
      name: form.name,
      species: form.species,
      breed: form.breed,
      birthDate: form.birthDate,
      sex: form.sex,
      photo: form.photo,
      weight: parseFloat(form.weight),
      allergies: form.allergies,
      conditions: form.conditions,
      microchip: form.microchip,
      food: {
        brand: form.foodBrand,
        line: '',
        type: form.foodType,
        portionGrams: parseInt(form.portionGrams),
        mealsPerDay: form.mealsPerDay,
        schedule: form.schedule,
      },
      weightHistory: [{ date: new Date().toISOString().slice(0, 7), value: parseFloat(form.weight) }],
    };

    setTimeout(() => {
      if (addingNewPet) {
        finishAddingPet(petData);
      } else {
        updatePet(petData);
        setHasCompletedOnboarding(true);
      }
      showToast(`Bem-vindo(a), ${form.name}! 🐾`);
      navigate('/');
    }, 1200);
  };

new_string:
  const finish = async () => {
    if (!validateStep()) return;
    setIsFinishing(true);

    const petData = {
      name: form.name,
      species: form.species,
      breed: form.breed,
      birthDate: form.birthDate,
      sex: form.sex,
      photo: form.photo,
      weight: parseFloat(form.weight),
      allergies: form.allergies,
      conditions: form.conditions,
      microchip: form.microchip,
      food: {
        brand: form.foodBrand,
        line: '',
        type: form.foodType,
        portionGrams: parseInt(form.portionGrams),
        mealsPerDay: form.mealsPerDay,
        schedule: form.schedule,
      },
    };

    try {
      const created = await createPetMutation.mutateAsync(petData);
      if (addingNewPet) {
        finishAddingPet(created.id);
      } else {
        setHasCompletedOnboarding(true);
      }
      showToast(`Bem-vindo(a), ${form.name}! 🐾`);
      navigate('/');
    } catch (err) {
      setIsFinishing(false);
      showToast(err.message || 'Erro ao cadastrar pet. Tente novamente.', 'error');
    }
  };
```

### Step 6.3 — Rewrite `src/pages/Dashboard.jsx`

Replace the imports and initial hook usage:

```
old_string:
import { useState } from 'react';
import { usePet } from '../context/PetContext';
import PetHeader from '../components/PetHeader';
import StatusCard from '../components/StatusCard';
import Modal from '../components/Modal';
import {
  Syringe, UtensilsCrossed, Pill, Weight, Clock, CalendarCheck,
  ChevronRight, ChevronDown, Plus, Stethoscope, FileText, Upload,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

new_string:
import { useState } from 'react';
import { usePet } from '../context/PetContext';
import { useVaccines, useVaccinesMutations } from '../hooks/useVaccines';
import { useMedications, useMedicationsMutations } from '../hooks/useMedications';
import { useMeals, useMealsMutations } from '../hooks/useMeals';
import { useWeight, useWeightMutations } from '../hooks/useWeight';
import { useRecordsMutations } from '../hooks/useRecords';
import PetHeader from '../components/PetHeader';
import StatusCard from '../components/StatusCard';
import Skeleton, { SkeletonStatusGrid } from '../components/Skeleton';
import Modal from '../components/Modal';
import {
  Syringe, UtensilsCrossed, Pill, Weight, Clock, CalendarCheck,
  ChevronRight, ChevronDown, Plus, Stethoscope, FileText, Upload,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

Replace the component destructure and data derivation:

```
old_string:
export default function Dashboard() {
  const { pet, addVaccine, addMedication, addWeightEntry, addRecord, showToast } = usePet();
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedEvent, setExpandedEvent] = useState(null);

  const nextVaccine = pet.vaccines.find((v) => v.status !== 'ok') || pet.vaccines[0];
  const nextMeal = getNextMealTime(pet.food.schedule);
  const activeMeds = pet.medications.filter((m) => m.active);

new_string:
export default function Dashboard() {
  const { pet, activePetId, showToast } = usePet();
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  const petId = pet?.id || activePetId;

  // React Query hooks
  const { data: vaccines = [], isLoading: vaccinesLoading } = useVaccines(petId);
  const { data: medications = [], isLoading: medsLoading } = useMedications(petId);
  const { data: weightData = [], isLoading: weightLoading } = useWeight(petId);
  const { add: addVaccineMut } = useVaccinesMutations(petId);
  const { add: addMedicationMut } = useMedicationsMutations(petId);
  const { add: addWeightMut } = useWeightMutations(petId);
  const { create: addRecordMut } = useRecordsMutations(petId);

  const isLoading = vaccinesLoading || medsLoading || weightLoading;

  // Derived data — from hooks, not from pet object
  const nextVaccine = vaccines.find((v) => v.status !== 'ok') || vaccines[0];
  const food = pet?.food || { schedule: [], portionGrams: 0, mealsPerDay: 2, brand: '' };
  const nextMeal = getNextMealTime(food.schedule);
  const activeMeds = medications.filter((m) => m.active);

  // Last weight from weight history or pet
  const lastWeight = pet?.weight || (weightData.length > 0 ? weightData[weightData.length - 1]?.value : 0);
  const prevWeight = weightData.length >= 2 ? weightData[weightData.length - 2]?.value : null;
```

Replace the `handleSave` function:

```
old_string:
  const handleSave = () => {
    if (isSaveDisabled()) return;

    if (modal === 'vaccine') {
      addVaccine({
        name: formData.name || '',
        lastDone: formData.date || new Date().toISOString().split('T')[0],
        nextDue: formData.nextDue || '',
        status: 'ok',
        clinic: formData.clinic || '',
        vet: formData.vet || '',
      });
    } else if (modal === 'medication') {
      addMedication({
        name: formData.name || '',
        dose: formData.dose || '',
        frequency: formData.frequency || '',
        startDate: new Date().toISOString().split('T')[0],
        duration: parseInt(formData.duration) || 30,
        daysElapsed: 0,
        nextDue: formData.nextDue || '',
        active: true,
      });
    } else if (modal === 'weight') {
      addWeightEntry({
        date: format(new Date(), 'yyyy-MM'),
        value: parseFloat(formData.weight) || 0,
      });
    } else if (modal === 'exam') {
      addRecord({
        date: new Date().toISOString().split('T')[0],
        type: 'exam',
        title: formData.title || 'Exame',
        description: formData.description || '',
        attachments: [],
      });
    }
    setModal(null);
    setFormData({});
  };

new_string:
  const handleSave = async () => {
    if (isSaveDisabled() || saving) return;
    setSaving(true);

    try {
      if (modal === 'vaccine') {
        await addVaccineMut.mutateAsync({
          name: formData.name || '',
          lastDone: formData.date || new Date().toISOString().split('T')[0],
          nextDue: formData.nextDue || '',
          status: 'ok',
          clinic: formData.clinic || '',
          vet: formData.vet || '',
        });
        showToast(`Vacina "${formData.name}" registrada!`);
      } else if (modal === 'medication') {
        await addMedicationMut.mutateAsync({
          name: formData.name || '',
          dose: formData.dose || '',
          frequency: formData.frequency || '',
          startDate: new Date().toISOString().split('T')[0],
          duration: parseInt(formData.duration) || 30,
          daysElapsed: 0,
          nextDue: formData.nextDue || '',
          active: true,
        });
        showToast(`Medicação "${formData.name}" adicionada!`);
      } else if (modal === 'weight') {
        await addWeightMut.mutateAsync({
          date: format(new Date(), 'yyyy-MM'),
          value: parseFloat(formData.weight) || 0,
        });
        showToast(`Peso atualizado para ${formData.weight}kg!`);
      } else if (modal === 'exam') {
        await addRecordMut.mutateAsync({
          date: new Date().toISOString().split('T')[0],
          type: 'exam',
          title: formData.title || 'Exame',
          description: formData.description || '',
          attachments: [],
        });
        showToast('Registro adicionado ao prontuário!');
      }
      setModal(null);
      setFormData({});
    } catch (err) {
      showToast(err.message || 'Erro ao salvar. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };
```

Replace the weight references (remove old `lastWeight` / `prevWeight` derivation that used `pet.weight` and `pet.weightHistory`):

```
old_string:
  // Weight difference indicator
  const lastWeight = pet.weight;
  const prevWeight = pet.weightHistory.length >= 2 ? pet.weightHistory[pet.weightHistory.length - 2]?.value : null;

new_string:
  // (weight variables already derived above from hooks)
```

Replace the status cards `pet.food` references with `food`:

```
old_string:
        <StatusCard
          icon={Clock}
          iconColor="bg-accent"
          label="Proxima refeicao"
          value={nextMeal}
          sublabel={`${pet.food.portionGrams}g`}
        />

new_string:
        <StatusCard
          icon={Clock}
          iconColor="bg-accent"
          label="Proxima refeicao"
          value={nextMeal}
          sublabel={`${food.portionGrams}g`}
        />
```

Add loading skeleton before the status cards. Wrap the status card grid:

```
old_string:
      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5 stagger-children animate-fade-in-up">

new_string:
      {/* Status Cards */}
      {isLoading ? (
        <div className="mb-5 animate-fade-in-up"><SkeletonStatusGrid /></div>
      ) : null}
      {!isLoading && <div className="grid grid-cols-2 gap-3 mb-5 stagger-children animate-fade-in-up">
```

Add closing for the conditional status cards (after the last StatusCard's closing `/>` but before the closing `</div>` of the grid):

```
old_string:
        <StatusCard
          icon={Weight}
          iconColor="bg-text-secondary"
          label="Ultimo peso"
          value={`${pet.weight} kg`}
          sublabel={pet.weightHistory.at(-1)?.date || ''}
        />
      </div>

new_string:
        <StatusCard
          icon={Weight}
          iconColor="bg-text-secondary"
          label="Ultimo peso"
          value={`${lastWeight} kg`}
          sublabel={weightData.at(-1)?.date || ''}
        />
      </div>}
```

Replace timeline's `pet.food.schedule` and `pet.food` references:

```
old_string:
  // Meals for today
  pet.food.schedule.forEach((time) => {
    upcomingEvents.push({
      type: 'meal',
      icon: UtensilsCrossed,
      color: 'text-accent',
      bg: 'bg-warning-light',
      title: `Refeicao -- ${time}`,
      subtitle: `${pet.food.portionGrams}g de ${pet.food.brand}`,
      details: `Racao: ${pet.food.brand}\nPorcao: ${pet.food.portionGrams}g\nHorario: ${time}`,
      date: today,
      time,
    });
  });

  // Vaccines
  pet.vaccines.forEach((v) => {

new_string:
  // Meals for today
  food.schedule.forEach((time) => {
    upcomingEvents.push({
      type: 'meal',
      icon: UtensilsCrossed,
      color: 'text-accent',
      bg: 'bg-warning-light',
      title: `Refeicao -- ${time}`,
      subtitle: `${food.portionGrams}g de ${food.brand}`,
      details: `Racao: ${food.brand}\nPorcao: ${food.portionGrams}g\nHorario: ${time}`,
      date: today,
      time,
    });
  });

  // Vaccines
  vaccines.forEach((v) => {
```

Replace the medications events:

```
old_string:
  // Medications
  pet.medications.filter((m) => m.active).forEach((m) => {

new_string:
  // Medications
  medications.filter((m) => m.active).forEach((m) => {
```

Replace save button text with loading state for all modals — update the vaccine save button as example (same pattern for all):

```
old_string:
          <button
            onClick={handleSave}
            disabled={!isVaccineValid}
            className={isVaccineValid ? btnEnabled : btnDisabled}
          >
            Salvar Vacina
          </button>

new_string:
          <button
            onClick={handleSave}
            disabled={!isVaccineValid || saving}
            className={isVaccineValid && !saving ? btnEnabled : btnDisabled}
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Salvar Vacina'}
          </button>
```

Apply the same pattern to the Medication, Weight, and Exam save buttons (replace `disabled={!isMedicationValid}` with `disabled={!isMedicationValid || saving}`, etc., and add spinner).

### Step 6.4 — Update `src/components/TopBar.jsx`

```
old_string:
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { Dog, Cat, Plus, ChevronDown } from 'lucide-react';

export default function TopBar() {
  const { pets, activePetId, switchPet, startAddingPet, tutor, pet } = usePet();

new_string:
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { useProfile } from '../hooks/useProfile';
import { useVaccines } from '../hooks/useVaccines';
import { Dog, Cat, Plus, ChevronDown } from 'lucide-react';

export default function TopBar() {
  const { pets, activePetId, switchPet, startAddingPet, pet } = usePet();
  const { data: profile } = useProfile();
  const { data: vaccines = [] } = useVaccines(pet?.id);
  const tutor = profile || { name: '...' };
```

Replace the `hasOverdue` line:

```
old_string:
  const hasOverdue = pet.vaccines?.some((v) => v.status === 'overdue');

new_string:
  const hasOverdue = vaccines.some((v) => v.status === 'overdue');
```

### Step 6.5 — Update `src/components/PetHeader.jsx`

```
old_string:
import { usePet } from '../context/PetContext';
import { Dog, Cat, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';

new_string:
import { usePet } from '../context/PetContext';
import { useVaccines } from '../hooks/useVaccines';
import { Dog, Cat, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
```

```
old_string:
export default function PetHeader() {
  const { pet } = usePet();
  const hasOverdue = pet.vaccines.some((v) => v.status === 'overdue');

new_string:
export default function PetHeader() {
  const { pet } = usePet();
  const { data: vaccines = [] } = useVaccines(pet?.id);
  const hasOverdue = vaccines.some((v) => v.status === 'overdue');
```

Also guard against null pet:

```
old_string:
  const age = getAge(pet.birthDate);
  const greeting = getGreeting();

  return (
    <div className="pt-2 pb-4 animate-fade-in-up">

new_string:
  const age = getAge(pet?.birthDate);
  const greeting = getGreeting();

  if (!pet) return null;

  return (
    <div className="pt-2 pb-4 animate-fade-in-up">
```

### Step 6.6 — Commit

```
feat(sp3): migrate Login, Onboarding, Dashboard, TopBar, PetHeader to real API
```

---

## Task 7: Migrate Pages (Health + Food + Records + Settings)

### Step 7.1 — Update `src/pages/Health.jsx`

Replace imports:

```
old_string:
import { useState } from 'react';
import { usePet } from '../context/PetContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import {
  Syringe, Bug, Stethoscope, Pill, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Clock, Plus,
  Calendar, Building2, User, FileText, Beaker,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

new_string:
import { useState } from 'react';
import { usePet } from '../context/PetContext';
import { useVaccines, useVaccinesMutations } from '../hooks/useVaccines';
import { useDewormings, useDewormingsMutations } from '../hooks/useDewormings';
import { useMedications, useMedicationsMutations } from '../hooks/useMedications';
import { useConsultations, useConsultationsMutations } from '../hooks/useConsultations';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import {
  Syringe, Bug, Stethoscope, Pill, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Clock, Plus,
  Calendar, Building2, User, FileText, Beaker,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

Replace the component destructure:

```
old_string:
export default function Health() {
  const { pet, addVaccine, addMedication, addConsultation, addDeworming } = usePet();
  const [activeTab, setActiveTab] = useState('vaccines');
  const [showModal, setShowModal] = useState(false);

new_string:
export default function Health() {
  const { pet, activePetId, showToast } = usePet();
  const petId = pet?.id || activePetId;

  const { data: vaccinesList = [], isLoading: vaccinesLoading } = useVaccines(petId);
  const { data: dewormingsList = [], isLoading: dewormingsLoading } = useDewormings(petId);
  const { data: medicationsList = [], isLoading: medsLoading } = useMedications(petId);
  const { data: consultationsList = [], isLoading: consLoading } = useConsultations(petId);

  const { add: addVaccineMut } = useVaccinesMutations(petId);
  const { add: addDewormingMut } = useDewormingsMutations(petId);
  const { add: addMedicationMut } = useMedicationsMutations(petId);
  const { add: addConsultationMut } = useConsultationsMutations(petId);

  const [activeTab, setActiveTab] = useState('vaccines');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
```

Replace the add handler functions:

```
old_string:
  const handleAddVaccine = () => {
    const errs = {};
    if (!vaccineForm.name) errs.vName = true;
    if (!vaccineForm.lastDone) errs.vLastDone = true;
    if (!vaccineForm.nextDue) errs.vNextDue = true;
    if (vaccineForm.lastDone && vaccineForm.nextDue && vaccineForm.lastDone > vaccineForm.nextDue) errs.vDateOrder = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    addVaccine({
      name: vaccineForm.name,
      lastDone: vaccineForm.lastDone,
      nextDue: vaccineForm.nextDue,
      status: 'ok',
      clinic: vaccineForm.clinic,
      vet: vaccineForm.vet,
    });
    closeModal();
  };

new_string:
  const handleAddVaccine = async () => {
    const errs = {};
    if (!vaccineForm.name) errs.vName = true;
    if (!vaccineForm.lastDone) errs.vLastDone = true;
    if (!vaccineForm.nextDue) errs.vNextDue = true;
    if (vaccineForm.lastDone && vaccineForm.nextDue && vaccineForm.lastDone > vaccineForm.nextDue) errs.vDateOrder = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      await addVaccineMut.mutateAsync({
        name: vaccineForm.name,
        lastDone: vaccineForm.lastDone,
        nextDue: vaccineForm.nextDue,
        status: 'ok',
        clinic: vaccineForm.clinic,
        vet: vaccineForm.vet,
      });
      showToast(`Vacina "${vaccineForm.name}" registrada!`);
      closeModal();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar vacina.', 'error');
    } finally {
      setSaving(false);
    }
  };
```

```
old_string:
  const handleAddDeworming = () => {
    const errs = {};
    if (!dewormingForm.name) errs.dName = true;
    if (!dewormingForm.lastDone) errs.dLastDone = true;
    if (!dewormingForm.nextDue) errs.dNextDue = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    addDeworming({
      name: dewormingForm.name,
      product: dewormingForm.product,
      lastDone: dewormingForm.lastDone,
      nextDue: dewormingForm.nextDue,
      status: 'ok',
    });
    closeModal();
  };

new_string:
  const handleAddDeworming = async () => {
    const errs = {};
    if (!dewormingForm.name) errs.dName = true;
    if (!dewormingForm.lastDone) errs.dLastDone = true;
    if (!dewormingForm.nextDue) errs.dNextDue = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      await addDewormingMut.mutateAsync({
        name: dewormingForm.name,
        product: dewormingForm.product,
        lastDone: dewormingForm.lastDone,
        nextDue: dewormingForm.nextDue,
        status: 'ok',
      });
      showToast('Vermifugação registrada!');
      closeModal();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar vermífugo.', 'error');
    } finally {
      setSaving(false);
    }
  };
```

```
old_string:
  const handleAddMedication = () => {
    const errs = {};
    if (!medicationForm.name) errs.mName = true;
    if (!medicationForm.dose) errs.mDose = true;
    if (!medicationForm.frequency) errs.mFreq = true;
    if (!medicationForm.duration || Number(medicationForm.duration) <= 0) errs.mDuration = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    addMedication({
      name: medicationForm.name,
      dose: medicationForm.dose,
      frequency: medicationForm.frequency,
      startDate: new Date().toISOString().split('T')[0],
      duration: Number(medicationForm.duration),
      daysElapsed: 0,
      nextDue: medicationForm.nextDue,
      active: true,
    });
    closeModal();
  };

new_string:
  const handleAddMedication = async () => {
    const errs = {};
    if (!medicationForm.name) errs.mName = true;
    if (!medicationForm.dose) errs.mDose = true;
    if (!medicationForm.frequency) errs.mFreq = true;
    if (!medicationForm.duration || Number(medicationForm.duration) <= 0) errs.mDuration = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      await addMedicationMut.mutateAsync({
        name: medicationForm.name,
        dose: medicationForm.dose,
        frequency: medicationForm.frequency,
        startDate: new Date().toISOString().split('T')[0],
        duration: Number(medicationForm.duration),
        daysElapsed: 0,
        nextDue: medicationForm.nextDue,
        active: true,
      });
      showToast(`Medicação "${medicationForm.name}" adicionada!`);
      closeModal();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar medicação.', 'error');
    } finally {
      setSaving(false);
    }
  };
```

```
old_string:
  const handleAddConsultation = () => {
    const errs = {};
    if (!consultationForm.date) errs.cDate = true;
    if (!consultationForm.type) errs.cType = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    addConsultation({
      date: consultationForm.date,
      type: consultationForm.type,
      clinic: consultationForm.clinic,
      vet: consultationForm.vet,
      notes: consultationForm.notes,
    });
    closeModal();
  };

new_string:
  const handleAddConsultation = async () => {
    const errs = {};
    if (!consultationForm.date) errs.cDate = true;
    if (!consultationForm.type) errs.cType = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      await addConsultationMut.mutateAsync({
        date: consultationForm.date,
        type: consultationForm.type,
        clinic: consultationForm.clinic,
        vet: consultationForm.vet,
        notes: consultationForm.notes,
      });
      showToast('Consulta registrada!');
      closeModal();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar consulta.', 'error');
    } finally {
      setSaving(false);
    }
  };
```

Replace `pet.vaccines` / `pet.dewormings` / `pet.medications` / `pet.consultations` data references in the JSX:

```
old_string:
      {activeTab === 'vaccines' && (
        <div className="space-y-3 stagger-children">
          {pet.vaccines.length === 0 ? (

new_string:
      {activeTab === 'vaccines' && (
        <div className="space-y-3 stagger-children">
          {vaccinesLoading ? <SkeletonList count={3} /> : vaccinesList.length === 0 ? (
```

```
old_string:
            pet.vaccines.map((v) => {

new_string:
            vaccinesList.map((v) => {
```

```
old_string:
      {activeTab === 'dewormings' && (
        <div className="space-y-3 stagger-children">
          {pet.dewormings.length === 0 ? (

new_string:
      {activeTab === 'dewormings' && (
        <div className="space-y-3 stagger-children">
          {dewormingsLoading ? <SkeletonList count={2} /> : dewormingsList.length === 0 ? (
```

```
old_string:
            pet.dewormings.map((d) => {

new_string:
            dewormingsList.map((d) => {
```

```
old_string:
      {activeTab === 'medications' && (
        <div className="space-y-3 stagger-children">
          {pet.medications.length === 0 ? (

new_string:
      {activeTab === 'medications' && (
        <div className="space-y-3 stagger-children">
          {medsLoading ? <SkeletonList count={2} /> : medicationsList.length === 0 ? (
```

```
old_string:
            pet.medications.map((m) => {

new_string:
            medicationsList.map((m) => {
```

```
old_string:
      {activeTab === 'consultations' && (
        <div className="space-y-3 stagger-children">
          {pet.consultations.length === 0 && !pet.nextConsultation ? (

new_string:
      {activeTab === 'consultations' && (
        <div className="space-y-3 stagger-children">
          {consLoading ? <SkeletonList count={2} /> : consultationsList.length === 0 ? (
```

```
old_string:
              {/* Next consultation */}
              {pet.nextConsultation && (

new_string:
              {/* Next consultation — show first upcoming consultation */}
              {consultationsList.length > 0 && (
```

Replace `pet.nextConsultation` references in the JSX with the first consultation item:

```
old_string:
                  <h3 className="text-sm font-bold text-text-primary capitalize">{pet.nextConsultation.type}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {formatDate(pet.nextConsultation.date)} · {pet.nextConsultation.vet}
                  </p>
                  <p className="text-xs text-text-secondary">{pet.nextConsultation.clinic}</p>

new_string:
                  <h3 className="text-sm font-bold text-text-primary capitalize">{consultationsList[0].type}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {formatDate(consultationsList[0].date)} · {consultationsList[0].vet}
                  </p>
                  <p className="text-xs text-text-secondary">{consultationsList[0].clinic}</p>
```

```
old_string:
              {/* History */}
              {pet.consultations.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">Histórico</h3>
                  {pet.consultations.map((c) => (

new_string:
              {/* History */}
              {consultationsList.length > 1 && (
                <>
                  <h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">Histórico</h3>
                  {consultationsList.slice(1).map((c) => (
```

Add saving spinner to all save buttons in modals. Example for vaccine save button:

```
old_string:
          <button
            onClick={handleAddVaccine}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Salvar vacina
          </button>

new_string:
          <button
            onClick={handleAddVaccine}
            disabled={saving}
            className={`w-full py-3 bg-primary text-white font-semibold rounded-xl transition-all ${saving ? 'opacity-70 cursor-wait' : 'hover:bg-primary-dark active:scale-[0.98]'}`}
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Salvar vacina'}
          </button>
```

Apply same pattern to deworming, medication, and consultation save buttons.

### Step 7.2 — Update `src/pages/Food.jsx`

```
old_string:
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

new_string:
import { useState, useEffect } from 'react';
import { usePet } from '../context/PetContext';
import { useFood } from '../hooks/useFood';
import { useMeals, useMealsMutations } from '../hooks/useMeals';
import { useWeight } from '../hooks/useWeight';
import WeightChart from '../components/WeightChart';
import Skeleton, { SkeletonCard } from '../components/Skeleton';
import Modal from '../components/Modal';
import {
  UtensilsCrossed, Clock, CheckCircle2, Package, Scale,
  ScanLine, ToggleLeft, ToggleRight, PartyPopper, Flame,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Food() {
  const { pet, activePetId, showToast } = usePet();
  const petId = pet?.id || activePetId;

  const { data: foodData, isLoading: foodLoading } = useFood(petId);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: mealsData = [], isLoading: mealsLoading } = useMeals(petId, todayStr);
  const { data: weightHistory = [], isLoading: weightLoading } = useWeight(petId);
  const { log: logMealMut } = useMealsMutations(petId);

  const food = foodData || pet?.food || { brand: '', line: '', type: 'dry', portionGrams: 0, mealsPerDay: 2, schedule: ['08:00', '19:00'] };
```

Replace the old derivation lines:

```
old_string:
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

new_string:
  const [remindersOn, setRemindersOn] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanPhase, setScanPhase] = useState('scanning');
  const [justLogged, setJustLogged] = useState(null);

  const todayMeals = mealsData.filter((m) => m.given);
  const mealsDone = todayMeals.length;
  const allMealsDone = mealsDone >= food.mealsPerDay;

  const dailyKcal = Math.round(food.portionGrams * food.mealsPerDay * 3.5);

  const handleLogMeal = async (time) => {
    try {
      await logMealMut.mutateAsync({ date: todayStr, time, given: true });
      setJustLogged(time);
      setTimeout(() => setJustLogged(null), 1200);
      showToast('Refeição registrada!');
    } catch (err) {
      showToast(err.message || 'Erro ao registrar refeição.', 'error');
    }
  };
```

Replace all `pet.food.` references in JSX with `food.`:

```
old_string:
            <h3 className="text-sm font-bold text-text-primary">{pet.food.brand}</h3>
            <p className="text-xs text-text-secondary">{pet.food.line || foodTypeLabel[pet.food.type]}</p>

new_string:
            <h3 className="text-sm font-bold text-text-primary">{food.brand}</h3>
            <p className="text-xs text-text-secondary">{food.line || foodTypeLabel[food.type]}</p>
```

```
old_string:
            <p className="text-sm font-bold text-text-primary mt-0.5">{pet.food.portionGrams}g</p>

new_string:
            <p className="text-sm font-bold text-text-primary mt-0.5">{food.portionGrams}g</p>
```

```
old_string:
            <p className="text-sm font-bold text-text-primary mt-0.5">{pet.food.mealsPerDay}x/dia</p>

new_string:
            <p className="text-sm font-bold text-text-primary mt-0.5">{food.mealsPerDay}x/dia</p>
```

```
old_string:
            <p className="text-sm font-bold text-text-primary mt-0.5">{pet.food.portionGrams * pet.food.mealsPerDay}g</p>

new_string:
            <p className="text-sm font-bold text-text-primary mt-0.5">{food.portionGrams * food.mealsPerDay}g</p>
```

Replace the meals counter:

```
old_string:
            {mealsDone}/{pet.food.mealsPerDay}

new_string:
            {mealsDone}/{food.mealsPerDay}
```

Replace the schedule loop:

```
old_string:
          <div className="space-y-2">
            {pet.food.schedule.map((time, idx) => {

new_string:
          <div className="space-y-2">
            {food.schedule.map((time, idx) => {
```

Replace `pet.food.portionGrams` inside the meal row:

```
old_string:
                      <p className="text-xs text-text-secondary">{pet.food.portionGrams}g</p>

new_string:
                      <p className="text-xs text-text-secondary">{food.portionGrams}g</p>
```

Replace scanner result reference:

```
old_string:
                <p className="text-xs text-text-secondary">{pet.food.brand}</p>

new_string:
                <p className="text-xs text-text-secondary">{food.brand}</p>
```

Replace the weight chart:

```
old_string:
      {/* Weight Chart */}
      <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
        <WeightChart data={pet.weightHistory} />
      </div>

new_string:
      {/* Weight Chart */}
      <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
        {weightLoading ? <SkeletonCard /> : <WeightChart data={weightHistory} />}
      </div>
```

### Step 7.3 — Update `src/pages/Records.jsx`

```
old_string:
import { useState } from 'react';
import { usePet } from '../context/PetContext';
import EmptyState from '../components/EmptyState';
import {
  Syringe, Pill, Stethoscope, Bug, FileText, Image,
  Filter, ChevronDown, ClipboardList,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

new_string:
import { useState } from 'react';
import { usePet } from '../context/PetContext';
import { useRecords } from '../hooks/useRecords';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import {
  Syringe, Pill, Stethoscope, Bug, FileText, Image,
  Filter, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

```
old_string:
export default function Records() {
  const { pet } = usePet();
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const sortedRecords = [...pet.records]
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const filteredRecords =
    filter === 'all' ? sortedRecords : sortedRecords.filter((r) => r.type === filter);

new_string:
export default function Records() {
  const { pet, activePetId } = usePet();
  const petId = pet?.id || activePetId;
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { data: recordsResponse, isLoading } = useRecords(petId, { type: filter, page, limit: 20 });

  // The API may return { records: [...], total, page, totalPages } or just an array
  const recordsData = Array.isArray(recordsResponse) ? recordsResponse : (recordsResponse?.records || []);
  const totalPages = recordsResponse?.totalPages || 1;
  const totalRecords = recordsResponse?.total || recordsData.length;

  const sortedRecords = [...recordsData]
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const filteredRecords = sortedRecords;
```

Replace the count display:

```
old_string:
      <p className="text-sm text-text-secondary mb-4">
        Histórico clínico completo · {sortedRecords.length} registros
      </p>

new_string:
      <p className="text-sm text-text-secondary mb-4">
        Histórico clínico completo · {totalRecords} registros
      </p>
```

Replace the filter button click to reset page:

```
old_string:
                onClick={() => { setFilter(key); setShowFilters(false); }}

new_string:
                onClick={() => { setFilter(key); setPage(1); setShowFilters(false); }}
```

Add loading state and pagination. Replace the timeline section:

```
old_string:
      {/* Timeline */}
      {filteredRecords.length > 0 ? (

new_string:
      {/* Timeline */}
      {isLoading ? <SkeletonList count={5} /> : filteredRecords.length > 0 ? (
```

Add pagination controls after the timeline closing `</div>` but before the EmptyState closing `)`:

After the records timeline closing block, before the final closing of the component, add:

```
old_string:
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum registro encontrado"
          description={filter !== 'all' ? `Sem registros do tipo "${activeFilterLabel}". Tente outro filtro.` : 'O prontuário do seu pet aparecerá aqui conforme você registrar eventos.'}
        />
      )}
    </div>

new_string:
      ) : !isLoading ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum registro encontrado"
          description={filter !== 'all' ? `Sem registros do tipo "${activeFilterLabel}". Tente outro filtro.` : 'O prontuário do seu pet aparecerá aqui conforme você registrar eventos.'}
        />
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 mb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`p-2 rounded-xl transition-all ${page <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-primary hover:bg-primary-50 active:scale-95'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-text-secondary">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`p-2 rounded-xl transition-all ${page >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-primary hover:bg-primary-50 active:scale-95'}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
```

### Step 7.4 — Update `src/pages/Settings.jsx`

Replace imports:

```
old_string:
import { useState } from 'react';
import { usePet } from '../context/PetContext';
import { useNavigate } from 'react-router-dom';
import {
  Dog, Cat, User, Bell, CreditCard, LogOut,
  ChevronRight, Edit3, Crown, PawPrint, Shield,
  ToggleLeft, ToggleRight, AlertTriangle, Plus, Trash2,
} from 'lucide-react';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import Modal from '../components/Modal';

new_string:
import { useState } from 'react';
import { usePet } from '../context/PetContext';
import { useAuth } from '../context/AuthContext';
import { useProfile, useProfileMutations } from '../hooks/useProfile';
import { usePetsMutations } from '../hooks/usePets';
import { useNavigate } from 'react-router-dom';
import {
  Dog, Cat, User, Bell, CreditCard, LogOut,
  ChevronRight, Edit3, Crown, PawPrint, Shield,
  ToggleLeft, ToggleRight, AlertTriangle, Plus, Trash2,
} from 'lucide-react';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import Modal from '../components/Modal';
```

Replace the component destructure:

```
old_string:
export default function Settings() {
  const {
    pet, pets, activePetId, switchPet, startAddingPet, removePet,
    tutor, setTutor, reminders, setReminders,
    resetData, setHasCompletedOnboarding, showToast, logout,
  } = usePet();
  const navigate = useNavigate();

new_string:
export default function Settings() {
  const {
    pet, pets, activePetId, switchPet, startAddingPet,
    setHasCompletedOnboarding, showToast, resetLocalState,
  } = usePet();
  const { logout: authLogout } = useAuth();
  const { data: profile } = useProfile();
  const { update: updateProfileMut } = useProfileMutations();
  const { remove: removePetMut } = usePetsMutations();
  const navigate = useNavigate();

  const tutor = profile || { name: '...', email: '', phone: '', plan: 'free' };
  const [reminders, setReminders] = useState({ vaccines: true, medications: true, food: true, consultations: true });
```

Replace the `saveTutor` function:

```
old_string:
  const saveTutor = () => {
    setTutor({ ...tutor, name: tutorForm.name, email: tutorForm.email, phone: tutorForm.phone });
    setTutorModalOpen(false);
    showToast('Informações do tutor atualizadas!');
  };

new_string:
  const saveTutor = async () => {
    try {
      await updateProfileMut.mutateAsync({ name: tutorForm.name, email: tutorForm.email, phone: tutorForm.phone });
      setTutorModalOpen(false);
      showToast('Informações do tutor atualizadas!');
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar perfil.', 'error');
    }
  };
```

Replace the `handleResetData` function:

```
old_string:
  const handleResetData = () => {
    resetData();
    setResetConfirmOpen(false);
    showToast('Dados restaurados ao padrão!');
  };

new_string:
  const handleResetData = () => {
    setResetConfirmOpen(false);
    showToast('Funcionalidade de exportação/exclusão estará disponível em breve.', 'error');
  };
```

Replace the logout button handler:

```
old_string:
        onClick={() => { logout(); navigate('/'); }}

new_string:
        onClick={async () => { await authLogout(); resetLocalState(); navigate('/'); }}
```

Replace the pet remove handler:

```
old_string:
                onClick={() => {
                  removePet(removePetConfirm.id);
                  setRemovePetConfirm(null);
                }}

new_string:
                onClick={async () => {
                  try {
                    await removePetMut.mutateAsync(removePetConfirm.id);
                    showToast('Pet removido.');
                    setRemovePetConfirm(null);
                  } catch (err) {
                    showToast(err.message || 'Erro ao remover pet.', 'error');
                    setRemovePetConfirm(null);
                  }
                }}
```

### Step 7.5 — Commit

```
feat(sp3): migrate Health, Food, Records, Settings to real API with loading states
```

---

## Task 8: Cleanup + Production Deploy

### Step 8.1 — Remove `src/data/mockData.js`

```bash
rm ~/Documents/petlife/src/data/mockData.js
```

### Step 8.2 — Verify no remaining imports of mockData

Search the entire `src/` directory for any remaining `mockData` imports. If any are found (e.g., in Community.jsx), they should be left as-is since Community stays localStorage per the spec. If PetContext still imports it, that import was already removed in Task 3.

### Step 8.3 — Remove old localStorage key

Verify that no file references `petlife_data` anymore (the old STORAGE_KEY). The new PetContext uses `petlife_active_pet_id`, `petlife_has_seen_welcome`, and `petlife_has_completed_onboarding` instead.

### Step 8.4 — Set Railway environment variable

```bash
# Via Railway CLI or dashboard:
# VITE_API_URL=https://petlife-api-production-d707.up.railway.app
```

This must be set as a build-time variable in Railway since Vite inlines it during build.

### Step 8.5 — Build and test locally

```bash
cd ~/Documents/petlife
VITE_API_URL=https://petlife-api-production-d707.up.railway.app npm run build
npm run preview
```

### Step 8.6 — Test full flow in production

1. Open app - should show Welcome screen
2. Click continue - should show Login screen
3. Register a new user - should call POST /auth/register
4. Onboarding - create a pet via POST /pets
5. Dashboard - should load vaccines, medications, weight from API
6. Health - add a vaccine, verify it appears after refetch
7. Food - log a meal, verify it persists
8. Records - verify pagination works
9. Settings - update tutor info via PATCH /me, verify logout clears session

### Step 8.7 — Commit

```
feat(sp3): cleanup mockData, finalize production build for API migration
```

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `.env` | VITE_API_URL for development |
| `src/lib/api.js` | Fetch wrapper with auth interceptor |
| `src/context/AuthContext.jsx` | Real auth (login, register, refresh, logout) |
| `src/components/Skeleton.jsx` | Shimmer loading placeholders |
| `src/hooks/usePets.js` | React Query hook for pets CRUD |
| `src/hooks/useVaccines.js` | React Query hook for vaccines |
| `src/hooks/useDewormings.js` | React Query hook for dewormings |
| `src/hooks/useMedications.js` | React Query hook for medications |
| `src/hooks/useConsultations.js` | React Query hook for consultations |
| `src/hooks/useFood.js` | React Query hook for food config |
| `src/hooks/useMeals.js` | React Query hook for meal log |
| `src/hooks/useWeight.js` | React Query hook for weight history |
| `src/hooks/useRecords.js` | React Query hook for records with pagination |
| `src/hooks/useProfile.js` | React Query hook for tutor profile |

## Summary of Modified Files

| File | What Changed |
|------|-------------|
| `src/App.jsx` | Wrapped with QueryClientProvider + AuthProvider, auth gate uses AuthContext |
| `src/context/PetContext.jsx` | Rewritten to thin UI layer (activePetId + addingNewPet + toast + flags) |
| `src/pages/Login.jsx` | Real API login/register, field-level errors, no more `onLogin` prop |
| `src/pages/Onboarding.jsx` | Uses `usePetsMutations().create` instead of localStorage |
| `src/pages/Dashboard.jsx` | Uses React Query hooks, Skeleton loading, async handleSave |
| `src/pages/Health.jsx` | All 4 tabs use React Query hooks with loading states |
| `src/pages/Food.jsx` | Uses useFood/useMeals/useWeight hooks |
| `src/pages/Records.jsx` | Real pagination with useRecords hook |
| `src/pages/Settings.jsx` | Real profile PATCH, real logout, real pet delete |
| `src/components/TopBar.jsx` | Uses useProfile + useVaccines hooks |
| `src/components/PetHeader.jsx` | Uses useVaccines hook |

## Files Removed

| File | Reason |
|------|--------|
| `src/data/mockData.js` | Data now comes from API |
