import { useState } from 'react';
import { usePet } from '../context/PetContext';
import { useAuth } from '../context/AuthContext';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { usePetsMutations } from '../hooks/usePets';
import { useVeterinarians, useAddVeterinarian, useUpdateVeterinarian, useDeleteVeterinarian } from '../hooks/useVeterinarians';
import { useRoutine, useUpdateRoutine } from '../hooks/useRoutine';
import { useNavigate } from 'react-router-dom';
import {
  Dog, Cat, User, Bell, CreditCard, LogOut,
  ChevronRight, Edit3, Crown, PawPrint, Shield,
  ToggleLeft, ToggleRight, AlertTriangle, Plus, Trash2,
  Stethoscope, Phone, FileDown,
} from 'lucide-react';
import { exportPetPdf } from '../hooks/usePdfExport';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import Modal from '../components/Modal';
import { validateVetForm, formatPhoneBR } from '../lib/validation';

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

  // Veterinarians
  const { data: veterinarians = [] } = useVeterinarians();
  const addVetMut = useAddVeterinarian();
  const updateVetMut = useUpdateVeterinarian();
  const deleteVetMut = useDeleteVeterinarian();
  const [vetModalOpen, setVetModalOpen] = useState(false);
  const [editingVet, setEditingVet] = useState(null);
  const [vetForm, setVetForm] = useState({ name: '', clinic: '', phone: '', email: '', specialty: '', notes: '' });
  const [vetErrors, setVetErrors] = useState({});
  const [deleteVetConfirm, setDeleteVetConfirm] = useState(null);

  const openAddVet = () => {
    setEditingVet(null);
    setVetForm({ name: '', clinic: '', phone: '', email: '', specialty: '', notes: '' });
    setVetErrors({});
    setVetModalOpen(true);
  };

  const openEditVet = (vet) => {
    setEditingVet(vet);
    setVetForm({
      name: vet.name || '',
      clinic: vet.clinic || '',
      phone: vet.phone || '',
      email: vet.email || '',
      specialty: vet.specialty || '',
      notes: vet.notes || '',
    });
    setVetErrors({});
    setVetModalOpen(true);
  };

  const saveVet = () => {
    const errors = validateVetForm(vetForm);
    if (Object.keys(errors).length > 0) {
      setVetErrors(errors);
      return;
    }
    setVetErrors({});
    const payload = {
      name: vetForm.name,
      clinic: vetForm.clinic || undefined,
      phone: vetForm.phone || undefined,
      email: vetForm.email || undefined,
      specialty: vetForm.specialty || undefined,
      notes: vetForm.notes || undefined,
    };
    if (editingVet) {
      updateVetMut.mutate({ id: editingVet.id, ...payload }, {
        onSuccess: () => { setVetModalOpen(false); showToast('Veterinário atualizado!'); },
        onError: () => showToast('Erro ao salvar.', 'error'),
      });
    } else {
      addVetMut.mutate(payload, {
        onSuccess: () => { setVetModalOpen(false); showToast('Veterinário adicionado!'); },
        onError: () => showToast('Erro ao salvar.', 'error'),
      });
    }
  };

  const confirmDeleteVet = (vet) => setDeleteVetConfirm(vet);

  const handleDeleteVet = () => {
    if (!deleteVetConfirm) return;
    deleteVetMut.mutate(deleteVetConfirm.id, {
      onSuccess: () => { setDeleteVetConfirm(null); showToast('Veterinário removido.'); },
      onError: () => showToast('Erro ao remover.', 'error'),
    });
  };

  // Routine
  const { data: routineData } = useRoutine(activePetId);
  const updateRoutineMut = useUpdateRoutine(activePetId);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [routineForm, setRoutineForm] = useState({
    walksPerDay: 2,
    walkDurationMinutes: 30,
    bathFrequency: 'BIWEEKLY',
    bathLocation: 'PETSHOP',
    hasDaycare: false,
    daycareName: '',
    daycarePhone: '',
  });

  const openRoutineModal = () => {
    if (routineData) {
      setRoutineForm({
        walksPerDay: routineData.walksPerDay ?? 2,
        walkDurationMinutes: routineData.walkDurationMinutes ?? 30,
        bathFrequency: routineData.bathFrequency ?? 'BIWEEKLY',
        bathLocation: routineData.bathLocation ?? 'PETSHOP',
        hasDaycare: routineData.hasDaycare ?? false,
        daycareName: routineData.daycareName ?? '',
        daycarePhone: routineData.daycarePhone ?? '',
      });
    }
    setRoutineModalOpen(true);
  };

  const saveRoutine = () => {
    updateRoutineMut.mutate({
      walksPerDay: parseInt(routineForm.walksPerDay) || 0,
      walkDurationMinutes: parseInt(routineForm.walkDurationMinutes) || 0,
      bathFrequency: routineForm.bathFrequency,
      bathLocation: routineForm.bathLocation,
      hasDaycare: routineForm.hasDaycare,
      daycareName: routineForm.hasDaycare ? routineForm.daycareName || undefined : undefined,
      daycarePhone: routineForm.hasDaycare ? routineForm.daycarePhone || undefined : undefined,
    }, {
      onSuccess: () => { setRoutineModalOpen(false); showToast('Rotina atualizada!'); },
      onError: () => showToast('Erro ao salvar rotina.', 'error'),
    });
  };

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

  const handleExportPdf = async () => {
    if (!pet) {
      showToast('Selecione um pet primeiro.', 'error');
      return;
    }
    try {
      await exportPetPdf(pet.id, pet.name);
      showToast('Prontuário exportado!');
    } catch {
      showToast('Erro ao gerar PDF.', 'error');
    }
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
          icon: FileDown,
          label: 'Exportar prontuário (PDF)',
          sublabel: pet ? `Gerar PDF completo de ${pet.name}` : 'Selecione um pet',
          action: handleExportPdf,
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

      {/* Meus Veterinários */}
      <div className="animate-fade-in-up mb-5">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">Meus veterinários</h3>
        <div className="bg-surface-alt rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {veterinarians.length === 0 && (
            <div className="p-4 text-center text-sm text-text-secondary">
              Nenhum veterinário cadastrado ainda.
            </div>
          )}
          {veterinarians.map((vet) => (
            <div key={vet.id} className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Stethoscope size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-text-primary truncate">{vet.name}</h4>
                <p className="text-xs text-text-secondary truncate">
                  {[vet.clinic, vet.specialty].filter(Boolean).join(' · ') || 'Veterinário'}
                </p>
                {vet.phone && (
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                    <Phone size={10} /> {vet.phone}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditVet(vet)}
                  className="p-2 rounded-xl text-text-secondary hover:bg-primary-50 hover:text-primary transition-colors"
                  title="Editar"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => confirmDeleteVet(vet)}
                  className="p-2 rounded-xl text-text-secondary hover:bg-danger-light hover:text-danger transition-colors"
                  title="Remover"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={openAddVet}
            className="w-full flex items-center gap-3 p-4 text-primary hover:bg-primary-50/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center">
              <Plus size={18} className="text-primary" />
            </div>
            <span className="text-sm font-semibold">Adicionar veterinário</span>
          </button>
        </div>
      </div>

      {/* Rotina do Pet */}
      {pet && (
        <div className="animate-fade-in-up mb-5">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
            Rotina de {pet.name}
          </h3>
          <div className="bg-surface-alt rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={openRoutineModal}
              className="w-full p-4 text-left hover:bg-surface active:scale-[0.98] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">Passeios</span>
                  </div>
                  <span className="text-xs font-medium text-text-secondary">
                    {routineData?.walksPerDay ?? '—'}x/dia · {routineData?.walkDurationMinutes ?? '—'} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">Banho</span>
                  <span className="text-xs font-medium text-text-secondary">
                    {{ WEEKLY: 'Semanal', BIWEEKLY: 'Quinzenal', MONTHLY: 'Mensal' }[routineData?.bathFrequency] ?? '—'}
                    {' · '}
                    {{ HOME: 'Em casa', PETSHOP: 'Petshop' }[routineData?.bathLocation] ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">Creche</span>
                  <span className="text-xs font-medium text-text-secondary">
                    {routineData?.hasDaycare ? (routineData.daycareName || 'Sim') : 'Não'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center mt-3">
                <span className="text-xs font-semibold text-primary">Editar rotina</span>
                <ChevronRight size={14} className="text-primary ml-1" />
              </div>
            </button>
          </div>
        </div>
      )}

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
                  className="w-full flex items-center gap-3 p-4 hover:bg-surface active:bg-gray-50 transition-colors text-left"
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

      {/* Veterinarian Modal */}
      <Modal open={vetModalOpen} onClose={() => setVetModalOpen(false)} title={editingVet ? 'Editar veterinário' : 'Adicionar veterinário'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nome <span className="text-danger">*</span></label>
            <input
              type="text"
              value={vetForm.name}
              onChange={(e) => { setVetForm((f) => ({ ...f, name: e.target.value })); setVetErrors((err) => ({ ...err, name: undefined })); }}
              className={`w-full px-4 py-3 rounded-xl border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 ${vetErrors.name ? 'border-danger focus:ring-danger/30' : 'border-gray-200 focus:ring-primary/30 focus:border-primary'}`}
              placeholder="Dr. João Silva"
            />
            {vetErrors.name && <p className="text-xs text-danger mt-1">{vetErrors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Clínica</label>
            <input
              type="text"
              value={vetForm.clinic}
              onChange={(e) => setVetForm((f) => ({ ...f, clinic: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Clínica Pet Center"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Telefone</label>
              <input
                type="tel"
                value={vetForm.phone}
                onChange={(e) => { setVetForm((f) => ({ ...f, phone: formatPhoneBR(e.target.value) })); setVetErrors((err) => ({ ...err, phone: undefined })); }}
                className={`w-full px-4 py-3 rounded-xl border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 ${vetErrors.phone ? 'border-danger focus:ring-danger/30' : 'border-gray-200 focus:ring-primary/30 focus:border-primary'}`}
                placeholder="(00) 00000-0000"
              />
              {vetErrors.phone && <p className="text-xs text-danger mt-1">{vetErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={vetForm.email}
                onChange={(e) => { setVetForm((f) => ({ ...f, email: e.target.value })); setVetErrors((err) => ({ ...err, email: undefined })); }}
                className={`w-full px-4 py-3 rounded-xl border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 ${vetErrors.email ? 'border-danger focus:ring-danger/30' : 'border-gray-200 focus:ring-primary/30 focus:border-primary'}`}
                placeholder="vet@email.com"
              />
              {vetErrors.email && <p className="text-xs text-danger mt-1">{vetErrors.email}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Especialidade</label>
            <input
              type="text"
              value={vetForm.specialty}
              onChange={(e) => setVetForm((f) => ({ ...f, specialty: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Ex: Dermatologia, Ortopedia"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Observações</label>
            <textarea
              value={vetForm.notes}
              onChange={(e) => setVetForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none h-20"
              placeholder="Notas adicionais..."
            />
          </div>
          <button
            onClick={saveVet}
            disabled={!vetForm.name.trim()}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingVet ? 'Salvar alterações' : 'Adicionar veterinário'}
          </button>
        </div>
      </Modal>

      {/* Delete Vet Confirmation Modal */}
      <Modal open={!!deleteVetConfirm} onClose={() => setDeleteVetConfirm(null)} title="Remover veterinário">
        {deleteVetConfirm && (
          <div className="space-y-4">
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Remover {deleteVetConfirm.name}?
                </p>
                <p className="text-xs text-text-secondary">
                  As informações deste veterinário serão removidas permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteVetConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-text-secondary font-semibold text-sm hover:bg-surface active:scale-[0.98] transition-transform"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteVet}
                className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold text-sm hover:bg-danger/90 active:scale-[0.98] transition-transform"
              >
                Remover
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Routine Modal */}
      <Modal open={routineModalOpen} onClose={() => setRoutineModalOpen(false)} title="Rotina do pet">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Passeios por dia</label>
            <select
              value={routineForm.walksPerDay}
              onChange={(e) => setRoutineForm((f) => ({ ...f, walksPerDay: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}x ao dia</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Duração do passeio (minutos)</label>
            <input
              type="number"
              value={routineForm.walkDurationMinutes}
              onChange={(e) => setRoutineForm((f) => ({ ...f, walkDurationMinutes: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Frequência do banho</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'WEEKLY', label: 'Semanal' },
                { val: 'BIWEEKLY', label: 'Quinzenal' },
                { val: 'MONTHLY', label: 'Mensal' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRoutineForm((f) => ({ ...f, bathFrequency: val }))}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    routineForm.bathFrequency === val
                      ? 'border-primary bg-primary-50 text-primary shadow-sm'
                      : 'border-gray-200 text-text-secondary hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Local do banho</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'HOME', label: 'Em casa' },
                { val: 'PETSHOP', label: 'Petshop' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRoutineForm((f) => ({ ...f, bathLocation: val }))}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    routineForm.bathLocation === val
                      ? 'border-primary bg-primary-50 text-primary shadow-sm'
                      : 'border-gray-200 text-text-secondary hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Frequenta creche?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: true, label: 'Sim' },
                { val: false, label: 'Não' },
              ].map(({ val, label }) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setRoutineForm((f) => ({ ...f, hasDaycare: val, ...(!val && { daycareName: '', daycarePhone: '' }) }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    routineForm.hasDaycare === val
                      ? 'border-primary bg-primary-50 text-primary shadow-sm shadow-primary/10'
                      : 'border-gray-200 text-text-secondary hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
          {routineForm.hasDaycare && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nome da creche</label>
                <input
                  type="text"
                  value={routineForm.daycareName}
                  onChange={(e) => setRoutineForm((f) => ({ ...f, daycareName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Ex: PetDay"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Telefone da creche</label>
                <input
                  type="tel"
                  value={routineForm.daycarePhone}
                  onChange={(e) => setRoutineForm((f) => ({ ...f, daycarePhone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          )}
          <button
            onClick={saveRoutine}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-[0.98] transition-transform"
          >
            Salvar rotina
          </button>
        </div>
      </Modal>
    </div>
  );
}
