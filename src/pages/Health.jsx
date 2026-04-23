import { useState } from 'react';
import { usePet } from '../context/PetContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import { useVaccines, useAddVaccine } from '../hooks/useVaccines';
import { useDewormings, useAddDeworming } from '../hooks/useDewormings';
import { useMedications, useAddMedication } from '../hooks/useMedications';
import { useConsultations, useAddConsultation } from '../hooks/useConsultations';
import {
  Syringe, Bug, Stethoscope, Pill, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Clock, Plus,
  Calendar, Building2, User, FileText, Beaker,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  ok: { icon: CheckCircle2, label: 'Em dia', color: 'text-success', bg: 'bg-success-light' },
  due_soon: { icon: AlertTriangle, label: 'Vencendo', color: 'text-warning', bg: 'bg-warning-light' },
  overdue: { icon: XCircle, label: 'Atrasada', color: 'text-danger', bg: 'bg-danger-light' },
};

const tabs = [
  { key: 'vaccines', label: 'Vacinas', icon: Syringe },
  { key: 'dewormings', label: 'Vermífugos', icon: Bug },
  { key: 'medications', label: 'Medicações', icon: Pill },
  { key: 'consultations', label: 'Consultas', icon: Stethoscope },
];

const initialVaccineForm = { name: '', lastDone: '', nextDue: '', clinic: '', vet: '' };
const initialDewormingForm = { name: '', product: '', lastDone: '', nextDue: '' };
const initialMedicationForm = { name: '', dose: '', frequency: '', duration: '', nextDue: '' };
const initialConsultationForm = { date: '', type: '', clinic: '', vet: '', notes: '' };

export default function Health() {
  const { pet, activePetId, showToast } = usePet();
  const [activeTab, setActiveTab] = useState('vaccines');
  const [showModal, setShowModal] = useState(false);

  // React Query hooks
  const { data: vaccines = [], isLoading: vaccinesLoading } = useVaccines(activePetId);
  const { data: dewormings = [], isLoading: dewormingsLoading } = useDewormings(activePetId);
  const { data: medications = [], isLoading: medsLoading } = useMedications(activePetId);
  const { data: consultations = [], isLoading: consultationsLoading } = useConsultations(activePetId);
  const addVaccineMut = useAddVaccine(activePetId);
  const addDewormingMut = useAddDeworming(activePetId);
  const addMedicationMut = useAddMedication(activePetId);
  const addConsultationMut = useAddConsultation(activePetId);

  // Derive next consultation from future consultations
  const now = new Date();
  const nextConsultation = consultations
    .filter((c) => c.date && parseISO(c.date) >= now)
    .sort((a, b) => parseISO(a.date) - parseISO(b.date))[0] || null;

  const [vaccineForm, setVaccineForm] = useState(initialVaccineForm);
  const [dewormingForm, setDewormingForm] = useState(initialDewormingForm);
  const [medicationForm, setMedicationForm] = useState(initialMedicationForm);
  const [consultationForm, setConsultationForm] = useState(initialConsultationForm);
  const [formErrors, setFormErrors] = useState({});

  const formatDate = (d) => format(parseISO(d), "dd 'de' MMM, yyyy", { locale: ptBR });
  const inputCls = (errKey) => `w-full px-3 py-2.5 bg-surface border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${formErrors[errKey] ? 'border-danger ring-2 ring-danger/20' : 'border-gray-200'}`;

  const openModal = () => { setShowModal(true); setFormErrors({}); };
  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
    setVaccineForm(initialVaccineForm);
    setDewormingForm(initialDewormingForm);
    setMedicationForm(initialMedicationForm);
    setConsultationForm(initialConsultationForm);
  };

  const handleAddVaccine = () => {
    const errs = {};
    if (!vaccineForm.name) errs.vName = true;
    if (!vaccineForm.lastDone) errs.vLastDone = true;
    if (!vaccineForm.nextDue) errs.vNextDue = true;
    if (vaccineForm.lastDone && vaccineForm.nextDue && vaccineForm.lastDone > vaccineForm.nextDue) errs.vDateOrder = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    addVaccineMut.mutate({
      name: vaccineForm.name,
      lastDone: vaccineForm.lastDone,
      nextDue: vaccineForm.nextDue,
      status: 'ok',
      clinic: vaccineForm.clinic,
      vet: vaccineForm.vet,
    }, { onSuccess: () => { showToast('Vacina registrada!'); closeModal(); }, onError: () => showToast('Erro ao salvar.', 'error') });
  };

  const handleAddDeworming = () => {
    const errs = {};
    if (!dewormingForm.name) errs.dName = true;
    if (!dewormingForm.lastDone) errs.dLastDone = true;
    if (!dewormingForm.nextDue) errs.dNextDue = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    addDewormingMut.mutate({
      name: dewormingForm.name,
      product: dewormingForm.product,
      lastDone: dewormingForm.lastDone,
      nextDue: dewormingForm.nextDue,
      status: 'ok',
    }, { onSuccess: () => { showToast('Vermífugo registrado!'); closeModal(); }, onError: () => showToast('Erro ao salvar.', 'error') });
  };

  const handleAddMedication = () => {
    const errs = {};
    if (!medicationForm.name) errs.mName = true;
    if (!medicationForm.dose) errs.mDose = true;
    if (!medicationForm.frequency) errs.mFreq = true;
    if (!medicationForm.duration || Number(medicationForm.duration) <= 0) errs.mDuration = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    addMedicationMut.mutate({
      name: medicationForm.name,
      dose: medicationForm.dose,
      frequency: medicationForm.frequency,
      startDate: new Date().toISOString().split('T')[0],
      duration: Number(medicationForm.duration),
      daysElapsed: 0,
      nextDue: medicationForm.nextDue,
      active: true,
    }, { onSuccess: () => { showToast('Medicação registrada!'); closeModal(); }, onError: () => showToast('Erro ao salvar.', 'error') });
  };

  const handleAddConsultation = () => {
    const errs = {};
    if (!consultationForm.date) errs.cDate = true;
    if (!consultationForm.type) errs.cType = true;
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    addConsultationMut.mutate({
      date: consultationForm.date,
      type: consultationForm.type,
      clinic: consultationForm.clinic,
      vet: consultationForm.vet,
      notes: consultationForm.notes,
    }, { onSuccess: () => { showToast('Consulta registrada!'); closeModal(); }, onError: () => showToast('Erro ao salvar.', 'error') });
  };

  const modalTitles = {
    vaccines: 'Nova Vacina',
    dewormings: 'Novo Vermífugo',
    medications: 'Nova Medicação',
    consultations: 'Nova Consulta',
  };

  return (
    <div className="pt-6 animate-fade-in-up">
      <h1 className="font-display text-2xl text-text-primary mb-1">Saúde Preventiva</h1>
      <p className="text-sm text-text-secondary mb-5">Acompanhe vacinas, medicações e consultas</p>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === key
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-surface-alt text-text-secondary border border-gray-200 hover:border-gray-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Vaccines */}
      {activeTab === 'vaccines' && vaccinesLoading && <SkeletonList count={3} />}
      {activeTab === 'vaccines' && !vaccinesLoading && (
        <div className="space-y-3 stagger-children">
          {vaccines.length === 0 ? (
            <EmptyState
              icon={Syringe}
              title="Nenhuma vacina registrada"
              description="Adicione a primeira vacina do seu pet"
              action={{ label: 'Adicionar vacina', icon: Plus, onClick: openModal }}
            />
          ) : (
            vaccines.map((v) => {
              const s = statusConfig[v.status] || statusConfig.ok;
              return (
                <div key={v.id} className="card-interactive bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{v.name}</h3>
                      <p className="text-xs text-text-secondary">{v.clinic} · {v.vet}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                      <s.icon size={12} />
                      {s.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-surface rounded-xl p-2.5">
                      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Aplicação</p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5">{formatDate(v.lastDone)}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-2.5">
                      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Reforço</p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5">{formatDate(v.nextDue)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Dewormings */}
      {activeTab === 'dewormings' && dewormingsLoading && <SkeletonList count={3} />}
      {activeTab === 'dewormings' && !dewormingsLoading && (
        <div className="space-y-3 stagger-children">
          {dewormings.length === 0 ? (
            <EmptyState
              icon={Bug}
              title="Nenhum vermífugo registrado"
              description="Registre a vermifugação do seu pet"
              action={{ label: 'Adicionar vermífugo', icon: Plus, onClick: openModal }}
            />
          ) : (
            dewormings.map((d) => {
              const s = statusConfig[d.status] || statusConfig.ok;
              return (
                <div key={d.id} className="card-interactive bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{d.name}</h3>
                      <p className="text-xs text-text-secondary">Produto: {d.product}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                      <s.icon size={12} />
                      {s.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-surface rounded-xl p-2.5">
                      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Última</p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5">{formatDate(d.lastDone)}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-2.5">
                      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Próxima</p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5">{formatDate(d.nextDue)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Medications */}
      {activeTab === 'medications' && medsLoading && <SkeletonList count={3} />}
      {activeTab === 'medications' && !medsLoading && (
        <div className="space-y-3 stagger-children">
          {medications.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="Nenhuma medicação ativa"
              description="Adicione medicações quando necessário"
              action={{ label: 'Adicionar medicação', icon: Plus, onClick: openModal }}
            />
          ) : (
            medications.map((m) => {
              const duration = m.duration || 1;
              const elapsed = m.daysElapsed || 0;
              const progress = Math.min(100, Math.round((elapsed / duration) * 100));
              const daysRemaining = Math.max(0, duration - elapsed);
              return (
                <div key={m.id} className="card-interactive bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{m.name}</h3>
                      <p className="text-xs text-text-secondary">{m.dose} · {m.frequency}</p>
                    </div>
                    {m.active && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-success-light text-success">
                        <Clock size={12} />
                        Ativo
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">
                        Progresso do tratamento
                      </span>
                      <span className="text-xs font-semibold text-primary">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-1.5">
                      {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Consultations */}
      {activeTab === 'consultations' && consultationsLoading && <SkeletonList count={3} />}
      {activeTab === 'consultations' && !consultationsLoading && (
        <div className="space-y-3 stagger-children">
          {consultations.length === 0 && !nextConsultation ? (
            <EmptyState
              icon={Stethoscope}
              title="Nenhuma consulta registrada"
              description="Registre as consultas veterinárias"
              action={{ label: 'Adicionar consulta', icon: Plus, onClick: openModal }}
            />
          ) : (
            <>
              {/* Next consultation */}
              {nextConsultation && (
                <div className="bg-primary-50 rounded-2xl p-4 border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope size={16} className="text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Próxima consulta</span>
                  </div>
                  <h3 className="text-sm font-bold text-text-primary capitalize">{nextConsultation.type}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {formatDate(nextConsultation.date)} · {nextConsultation.vet}
                  </p>
                  <p className="text-xs text-text-secondary">{nextConsultation.clinic}</p>
                </div>
              )}

              {/* History */}
              {consultations.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-text-primary mt-4 mb-2">Histórico</h3>
                  {consultations.map((c) => (
                    <div key={c.id} className="card-interactive bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-text-primary capitalize">{c.type}</h3>
                          <p className="text-xs text-text-secondary">{formatDate(c.date)} · {c.vet}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                      {c.notes && (
                        <p className="text-xs text-text-secondary mt-2 bg-surface rounded-xl p-2.5">{c.notes}</p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* FAB - Floating Action Button */}
      <button
        onClick={openModal}
        className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary-dark active:scale-95 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      {/* Add Vaccine Modal */}
      <Modal open={showModal && activeTab === 'vaccines'} onClose={closeModal} title={modalTitles.vaccines}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Nome da vacina *</label>
            <input
              type="text"
              value={vaccineForm.name}
              onChange={(e) => { setVaccineForm({ ...vaccineForm, name: e.target.value }); setFormErrors((p) => ({ ...p, vName: false })); }}
              className={inputCls('vName')}
              placeholder="Ex: V10"
            />
            {formErrors.vName && <p className="text-xs text-danger mt-1">Obrigatório</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Aplicação *</label>
              <input
                type="date"
                value={vaccineForm.lastDone}
                onChange={(e) => { setVaccineForm({ ...vaccineForm, lastDone: e.target.value }); setFormErrors((p) => ({ ...p, vLastDone: false, vDateOrder: false })); }}
                className={inputCls('vLastDone')}
              />
              {formErrors.vLastDone && <p className="text-xs text-danger mt-1">Obrigatório</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Reforço *</label>
              <input
                type="date"
                value={vaccineForm.nextDue}
                onChange={(e) => { setVaccineForm({ ...vaccineForm, nextDue: e.target.value }); setFormErrors((p) => ({ ...p, vNextDue: false, vDateOrder: false })); }}
                className={inputCls('vNextDue')}
              />
              {formErrors.vNextDue && <p className="text-xs text-danger mt-1">Obrigatório</p>}
              {formErrors.vDateOrder && <p className="text-xs text-danger mt-1">Reforço deve ser após aplicação</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Clínica</label>
            <input
              type="text"
              value={vaccineForm.clinic}
              onChange={(e) => setVaccineForm({ ...vaccineForm, clinic: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Nome da clínica"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Veterinário(a)</label>
            <input
              type="text"
              value={vaccineForm.vet}
              onChange={(e) => setVaccineForm({ ...vaccineForm, vet: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Nome do(a) veterinário(a)"
            />
          </div>
          <button
            onClick={handleAddVaccine}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Salvar vacina
          </button>
        </div>
      </Modal>

      {/* Add Deworming Modal */}
      <Modal open={showModal && activeTab === 'dewormings'} onClose={closeModal} title={modalTitles.dewormings}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Nome</label>
            <input
              type="text"
              value={dewormingForm.name}
              onChange={(e) => setDewormingForm({ ...dewormingForm, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Ex: Vermifugação trimestral"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Produto</label>
            <input
              type="text"
              value={dewormingForm.product}
              onChange={(e) => setDewormingForm({ ...dewormingForm, product: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Nome do produto"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Última</label>
              <input
                type="date"
                value={dewormingForm.lastDone}
                onChange={(e) => setDewormingForm({ ...dewormingForm, lastDone: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Próxima</label>
              <input
                type="date"
                value={dewormingForm.nextDue}
                onChange={(e) => setDewormingForm({ ...dewormingForm, nextDue: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <button
            onClick={handleAddDeworming}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Salvar vermífugo
          </button>
        </div>
      </Modal>

      {/* Add Medication Modal */}
      <Modal open={showModal && activeTab === 'medications'} onClose={closeModal} title={modalTitles.medications}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Nome da medicação</label>
            <input
              type="text"
              value={medicationForm.name}
              onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Ex: Antibiótico"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Dose</label>
              <input
                type="text"
                value={medicationForm.dose}
                onChange={(e) => setMedicationForm({ ...medicationForm, dose: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: 1 comprimido"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Frequência</label>
              <input
                type="text"
                value={medicationForm.frequency}
                onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: 2x ao dia"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Duração (dias)</label>
              <input
                type="number"
                value={medicationForm.duration}
                onChange={(e) => setMedicationForm({ ...medicationForm, duration: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: 10"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Próxima dose</label>
              <input
                type="date"
                value={medicationForm.nextDue}
                onChange={(e) => setMedicationForm({ ...medicationForm, nextDue: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <button
            onClick={handleAddMedication}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Salvar medicação
          </button>
        </div>
      </Modal>

      {/* Add Consultation Modal */}
      <Modal open={showModal && activeTab === 'consultations'} onClose={closeModal} title={modalTitles.consultations}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Data</label>
              <input
                type="date"
                value={consultationForm.date}
                onChange={(e) => setConsultationForm({ ...consultationForm, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Tipo</label>
              <input
                type="text"
                value={consultationForm.type}
                onChange={(e) => setConsultationForm({ ...consultationForm, type: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: Check-up"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Clínica</label>
            <input
              type="text"
              value={consultationForm.clinic}
              onChange={(e) => setConsultationForm({ ...consultationForm, clinic: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Nome da clínica"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Veterinário(a)</label>
            <input
              type="text"
              value={consultationForm.vet}
              onChange={(e) => setConsultationForm({ ...consultationForm, vet: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Nome do(a) veterinário(a)"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Observações</label>
            <textarea
              value={consultationForm.notes}
              onChange={(e) => setConsultationForm({ ...consultationForm, notes: e.target.value })}
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              rows={3}
              placeholder="Anotações sobre a consulta..."
            />
          </div>
          <button
            onClick={handleAddConsultation}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Salvar consulta
          </button>
        </div>
      </Modal>
    </div>
  );
}
