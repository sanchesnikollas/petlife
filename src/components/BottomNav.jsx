import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarHeart, UtensilsCrossed, Users, ClipboardList, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/health', icon: CalendarHeart, label: 'Saúde' },
  { to: '/food', icon: UtensilsCrossed, label: 'Comida' },
  { to: '/community', icon: Users, label: 'Social' },
  { to: '/records', icon: ClipboardList, label: 'Registros' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

export default function BottomNav() {
  const location = useLocation();
  const [tooltip, setTooltip] = useState(null);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex justify-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center gap-1 bg-text-primary/90 backdrop-blur-2xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.25)] px-3 py-2 mb-4">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="relative group"
              onMouseEnter={() => setTooltip(to)}
              onMouseLeave={() => setTooltip(null)}
              onTouchStart={() => { setTooltip(to); setTimeout(() => setTooltip(null), 1500); }}
            >
              {/* Tooltip */}
              {tooltip === to && !isActive && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap animate-fade-in pointer-events-none">
                  {label}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-text-primary rotate-45" />
                </div>
              )}

              <div
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 active:scale-85 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-110'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.6}
                />
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
