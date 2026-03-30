import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import Toast from './Toast';

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopBar />
      <Toast />
      <main key={location.pathname} className="max-w-lg mx-auto w-full flex-1 px-5 pt-32 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] animate-fade-in-up">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
