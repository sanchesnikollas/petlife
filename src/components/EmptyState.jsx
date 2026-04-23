import { PawPrint } from 'lucide-react';

export default function EmptyState({ icon: Icon = PawPrint, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in-up">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mb-4">
        <Icon size={32} className="text-primary-lighter" />
      </div>
      <h3 className="font-display text-lg text-text-primary mb-1 text-center">{title}</h3>
      <p className="text-sm text-text-secondary text-center max-w-[240px] mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary px-6 py-2.5 text-sm flex items-center gap-1.5"
        >
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
