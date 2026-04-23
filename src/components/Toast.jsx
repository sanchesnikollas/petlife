import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { usePet } from '../context/PetContext';

export default function Toast() {
  const { toast } = usePet();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] flex justify-center pointer-events-none">
      <div
        key={toast.id}
        className={`toast-enter pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border max-w-sm w-full ${
          isSuccess
            ? 'bg-surface-alt border-success/20'
            : 'bg-surface-alt border-warning/20'
        }`}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isSuccess ? 'bg-success-light' : 'bg-warning-light'
        }`}>
          {isSuccess ? (
            <CheckCircle2 size={16} className="text-success animate-check-bounce" />
          ) : (
            <AlertTriangle size={16} className="text-warning" />
          )}
        </div>
        <p className="text-sm font-medium text-text-primary flex-1">{toast.message}</p>
      </div>
    </div>
  );
}
