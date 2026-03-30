import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import Toast from './Toast';

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Toast />
      <main key={location.pathname} className="max-w-lg mx-auto w-full flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in-up">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
