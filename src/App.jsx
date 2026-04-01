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
import Calendar from './pages/Calendar';
import { useState, useCallback } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

const WELCOME_KEY = 'petlife_has_seen_welcome';

function AuthGate() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcomeState] = useState(
    () => localStorage.getItem(WELCOME_KEY) === 'true'
  );

  const setHasSeenWelcome = useCallback((val) => {
    setHasSeenWelcomeState(val);
    localStorage.setItem(WELCOME_KEY, String(val));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasSeenWelcome) {
    return <Welcome onContinue={() => setHasSeenWelcome(true)} />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Only mount PetProvider AFTER authentication
  return (
    <PetProvider>
      <AuthenticatedRoutes />
    </PetProvider>
  );
}

function AuthenticatedRoutes() {
  const { hasCompletedOnboarding, addingNewPet } = usePet();

  if (!hasCompletedOnboarding || addingNewPet) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/health" element={<Health />} />
        <Route path="/food" element={<Food />} />
        <Route path="/community" element={<Community />} />
        <Route path="/records" element={<Records />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/calendar" element={<Calendar />} />
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
          <AuthGate />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
