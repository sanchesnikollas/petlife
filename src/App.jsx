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
