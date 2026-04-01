import { useState } from 'react';
import { usePet } from '../context/PetContext';
import { useAuth } from '../context/AuthContext';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { usePetsMutations } from '../hooks/usePets';
import { useNavigate } from 'react-router-dom';
import {
  Dog, Cat, User, Bell, CreditCard, LogOut,
  ChevronRight, Edit3, Crown, PawPrint, Shield,
  ToggleLeft, ToggleRight, AlertTriangle, Plus, Trash2,
} from 'lucide-react';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import Modal from '../components/Modal';

function getAge(birthDate) {
  const birth = parseISO(birthDate);
  const years = differenceInYears(new Date(), birth);
  const months = differenceInMonths(new Date(), birth) % 12;
  if (years === 0) return `${months}m`;
  return `${years}a ${months}m`;
}

export default function Settings() {
  const {
    pet, pets, activePetId, switchPet, startAddingPet,
    setHasCompletedOnboarding, showToast, resetLocalState,
  } = usePet();
  const auth = useAuth();
  const { data: profile } = useProfile();
  const updateProfileMut = useUpdateProfile();
  const { remove: removePetMut } = usePetsMutations();
  const tutor = profile || { name: '', email: '', phone: '', plan: 'free' };
  const navigate = useNavigate();
  const [reminders, setReminders] = useState({ vaccines: true, medications: true, food: true, consultations: true });

  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [removePetConfirm, setRemovePetConfirm] = useState(null);

  // Tutor edit form state
  const [tutorForm, setTutorForm] = useState({ name: '', email: '', phone: '' });

  const openTutorModal = () => {
    setTutorForm({ name: tutor.name, email: tutor.email, phone: tutor.phone });
    setTutorModalOpen(true);
  };

  const saveTutor = () => {
    updateProfileMut.mutate({ name: tutorForm.name, email: tutorForm.email, phone: tutorForm.phone }, {
      onSuccess: () => { setTutorModalOpen(false); showToast('Informações do tutor atualizadas!'); },
      onError: () => showToast('Erro ao salvar.', 'error'),
    });
  };

  const toggleReminder = (key) => {
    setReminders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetData = async () => {
    setResetConfirmOpen(false);
    resetLocalState();
    await auth.logout();
    showToast('Dados restaurados ao padrão!');
    navigate('/');
  };

  const reminderLabels = [
    { key: 'vaccines', label: 'Vacinas', emoji: '' },
    { key: 'medications', label: 'Medicações', emoji: '' },
    { key: 'food', label: 'Alimentação', emoji: '' },
    { key: 'consultations', label: 'Consultas', emoji: '' },
  ];

  const menuSections = [
    {
      title: 'Preferências',
      items: [
        {
          icon: Bell,
          label: 'Gerenciar lembretes',
          sublabel: 'Vacinas, medicações, alimentação',
          action: () => setRemindersModalOpen(true),
        },
      ],
    },
    {
      title: 'Conta',
      items: [
        {
          icon: User,
          label: 'Informações do tutor',
          sublabel: tutor.name,
          action: openTutorModal,
        },
        {
          icon: CreditCard,
          label: 'Plano de assinatura',
          sublabel: tutor.plan === 'free' ? 'Gratuito' : 'Premium',
          badge: tutor.plan === 'free' ? 'Upgrade' : null,
        },
        {
          icon: Shield,
          label: 'Privacidade e dados',
          sublabel: 'Exportar, excluir dados',
          action: () => setResetConfirmOpen(true),
        },
      ],
    },
  ];

  return (
    <div className="pt-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl text-text-primary mb-1">Configurações</h1>
        <p className="text-sm text-text-secondary mb-5">Gerencie seu perfil e preferências</p>
      </div>

      {/* Meus Pets */}
      <div className="animate-fade-in-up mb-5">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">Meus pets</h3>
        <div className="bg-surface-alt rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {pets.map((p) => {
            const isActive = p.id === activePetId;
            const Icon = p.species === 'cat' ? Cat : Dog;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-4 transition-colors ${isActive ? 'bg-primary-50/30' : ''}`}
              >
                <button onClick={() => switchPet(p.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${isActive ? 'ring-2 ring-primary bg-primary-50' : 'bg-gray-100'}`}>
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={22} className={isActive ? 'text-primary' : 'text-text-secondary'} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-text-primary'}`}>{p.name}</h3>
                      {isActive && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Ativo</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate">
                      {p.breed}{p.birthDate ? ` · ${getAge(p.birthDate)}` : ''}{p.weight ? ` · ${p.weight}kg` : ''}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { switchPet(p.id); setHasCompletedOnboarding(false); navigate('/onboarding'); }}
                    className="p-2 rounded-xl text-text-secondary hover:bg-primary-50 hover:text-primary transition-colors"
                    title="Editar"
                  >
                    <Edit3 size={15} />
                  </button>
                  {pets.length > 1 && (
                    <button
                      onClick={() => setRemovePetConfirm(p)}
                      className="p-2 rounded-xl text-text-secondary hover:bg-danger-light hover:text-danger transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {/* Add pet button */}
          <button
            onClick={() => { startAddingPet(); navigate('/onboarding'); }}
            className="w-full flex items-center gap-3 p-4 text-primary hover:bg-primary-50/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center">
              <Plus size={20} className="text-primary" />
            </div>
            <span className="text-sm font-semibold">Adicionar novo pet</span>
          </button>
        </div>
      </div>

      {/* Premium Upsell */}
      {tutor.plan === 'free' && (
        <div className="animate-fade-in-up bg-gradient-to-r from-primary to-primary-light rounded-2xl p-4 mb-5 text-white shadow-lg shadow-primary/20 card-interactive group hover:shimmer relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 1s ease-in-out, opacity 0.3s' }} />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Crown size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold">PetLife Premium</h3>
              <p className="text-xs text-white/80">Lembretes ilimitados, exportação de dados e mais</p>
            </div>
            <ChevronRight size={18} className="text-white/60" />
          </div>
        </div>
      )}

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="mb-4 animate-fade-in-up">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
            {section.title}
          </h3>
          <div className="bg-surface-alt rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50 stagger-children">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="card-interactive w-full flex items-center gap-3 p-4 hover:bg-surface text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-secondary truncate">{item.sublabel}</p>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button
        onClick={async () => { resetLocalState(); await auth.logout(); navigate('/'); }}
        className="animate-fade-in-up w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-danger/20 text-danger text-sm font-semibold hover:bg-danger-light active:scale-[0.97] transition-all mt-2 mb-8"
      >
        <LogOut size={16} />
        Sair da conta
      </button>

      {/* Footer */}
      <div className="text-center pb-8 animate-fade-in-up">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <PawPrint size={14} className="text-primary-light" />
          <span className="text-xs font-semibold text-text-secondary">PetLife v1.0</span>
        </div>
        <p className="text-[10px] text-gray-400">Feito com amor para seu pet</p>
      </div>

      {/* Tutor Info Modal */}
      <Modal open={tutorModalOpen} onClose={() => setTutorModalOpen(false)} title="Informações do tutor">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nome</label>
            <input
              type="text"
              value={tutorForm.name}
              onChange={(e) => setTutorForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={tutorForm.email}
              onChange={(e) => setTutorForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Telefone</label>
            <input
              type="tel"
              value={tutorForm.phone}
              onChange={(e) => setTutorForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="(00) 00000-0000"
            />
          </div>
          <button
            onClick={saveTutor}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-[0.98] transition-transform"
          >
            Salvar alterações
          </button>
        </div>
      </Modal>

      {/* Reminders Modal */}
      <Modal open={remindersModalOpen} onClose={() => setRemindersModalOpen(false)} title="Gerenciar lembretes">
        <div className="space-y-1 stagger-children">
          {reminderLabels.map(({ key, label }) => {
            const active = reminders[key];
            return (
              <button
                key={key}
                onClick={() => toggleReminder(key)}
                className="card-interactive w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface text-left"
              >
                <span className="text-sm font-semibold text-text-primary">{label}</span>
                {active ? (
                  <ToggleRight size={28} className="text-primary" />
                ) : (
                  <ToggleLeft size={28} className="text-gray-300" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-secondary mt-4 text-center">
          Ative ou desative as notificações para cada categoria.
        </p>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} title="Privacidade e dados">
        <div className="space-y-4">
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex gap-3">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">Restaurar dados padrão</p>
              <p className="text-xs text-text-secondary">
                Todos os seus dados serão substituídos pelos dados de exemplo. Essa ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setResetConfirmOpen(false)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-text-secondary font-semibold text-sm hover:bg-surface active:scale-[0.98] transition-transform"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetData}
              className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold text-sm hover:bg-danger/90 active:scale-[0.98] transition-transform"
            >
              Restaurar
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Pet Confirmation Modal */}
      <Modal open={!!removePetConfirm} onClose={() => setRemovePetConfirm(null)} title="Remover pet">
        {removePetConfirm && (
          <div className="space-y-4">
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Remover {removePetConfirm.name}?
                </p>
                <p className="text-xs text-text-secondary">
                  Todos os dados de {removePetConfirm.name} (vacinas, consultas, prontuário) serão removidos. Essa ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRemovePetConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-text-secondary font-semibold text-sm hover:bg-surface active:scale-[0.98] transition-transform"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  removePetMut.mutate(removePetConfirm.id, {
                    onSuccess: () => { showToast('Pet removido.'); setRemovePetConfirm(null); },
                    onError: () => showToast('Erro ao remover pet.', 'error'),
                  });
                }}
                className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold text-sm hover:bg-danger/90 active:scale-[0.98] transition-transform"
              >
                Remover
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
