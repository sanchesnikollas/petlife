import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarHeart, UtensilsCrossed, ClipboardList, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/health', icon: CalendarHeart, label: 'Saúde' },
  { to: '/food', icon: UtensilsCrossed, label: 'Alimentação' },
  { to: '/records', icon: ClipboardList, label: 'Prontuário' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-alt/80 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around h-[4.25rem] px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[3.5rem] py-1 rounded-2xl text-[10px] font-medium transition-all duration-200 active:scale-90"
            >
              <div
                className={`p-2 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                    : 'text-text-secondary hover:bg-gray-100'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </div>
              <span className={`transition-all duration-200 ${isActive ? 'text-primary font-bold' : 'text-text-secondary'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
