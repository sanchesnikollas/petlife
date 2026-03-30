import { useState } from 'react';
import { usePet } from '../context/PetContext';
import PetHeader from '../components/PetHeader';
import StatusCard from '../components/StatusCard';
import Modal from '../components/Modal';
import {
  Syringe, UtensilsCrossed, Pill, Weight, Clock, CalendarCheck,
  ChevronRight, ChevronDown, Plus, Stethoscope, FileText, Upload,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getNextMealTime(schedule) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (const t of schedule) {
    const [h, m] = t.split(':').map(Number);
    if (h * 60 + m > currentMinutes) return t;
  }
  return schedule[0] + ' (amanha)';
}

function formatDateShort(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Hoje';
  if (isTomorrow(d)) return 'Amanha';
  return format(d, "dd 'de' MMM", { locale: ptBR });
}

export default function Dashboard() {
  const { pet, addVaccine, addMedication, addWeightEntry, addRecord, showToast } = usePet();
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedEvent, setExpandedEvent] = useState(null);

  const nextVaccine = pet.vaccines.find((v) => v.status !== 'ok') || pet.vaccines[0];
  const nextMeal = getNextMealTime(pet.food.schedule);
  const activeMeds = pet.medications.filter((m) => m.active);

  const today = new Date();
  const weekEnd = addDays(today, 7);
  const upcomingEvents = [];

  // Meals for today
  pet.food.schedule.forEach((time) => {
    upcomingEvents.push({
      type: 'meal',
      icon: UtensilsCrossed,
      color: 'text-accent',
      bg: 'bg-warning-light',
      title: `Refeicao -- ${time}`,
      subtitle: `${pet.food.portionGrams}g de ${pet.food.brand}`,
      details: `Racao: ${pet.food.brand}\nPorcao: ${pet.food.portionGrams}g\nHorario: ${time}`,
      date: today,
      time,
    });
  });

  // Vaccines
  pet.vaccines.forEach((v) => {
    const d = parseISO(v.nextDue);
    if (isWithinInterval(d, { start: today, end: weekEnd }) || v.status === 'overdue') {
      upcomingEvents.push({
        type: 'vaccine',
        icon: Syringe,
        color: v.status === 'overdue' ? 'text-danger' : 'text-primary',
        bg: v.status === 'overdue' ? 'bg-danger-light' : 'bg-primary-50',
        title: `Vacina ${v.name}`,
        subtitle: v.status === 'overdue' ? 'Atrasada!' : `Vence ${formatDateShort(v.nextDue)}`,
        details: `Vacina: ${v.name}\nProximo reforco: ${formatDateShort(v.nextDue)}\nClinica: ${v.clinic || 'Nao informada'}\nVeterinario(a): ${v.vet || 'Nao informado(a)'}`,
        date: d,
      });
    }
  });

  // Medications
  pet.medications.filter((m) => m.active).forEach((m) => {
    upcomingEvents.push({
      type: 'medication',
      icon: Pill,
      color: 'text-primary-light',
      bg: 'bg-success-light',
      title: m.name,
      subtitle: `${m.dose} -- ${m.frequency}`,
      details: `Remedio: ${m.name}\nDose: ${m.dose}\nFrequencia: ${m.frequency}\nProxima dose: ${formatDateShort(m.nextDue)}`,
      date: parseISO(m.nextDue),
    });
  });

  // Next consultation
  if (pet.nextConsultation) {
    const d = parseISO(pet.nextConsultation.date);
    upcomingEvents.push({
      type: 'consultation',
      icon: Stethoscope,
      color: 'text-primary',
      bg: 'bg-primary-50',
      title: `Consulta -- ${pet.nextConsultation.type}`,
      subtitle: `${formatDateShort(pet.nextConsultation.date)} -- ${pet.nextConsultation.vet}`,
      details: `Tipo: ${pet.nextConsultation.type}\nData: ${formatDateShort(pet.nextConsultation.date)}\nVeterinario(a): ${pet.nextConsultation.vet}`,
      date: d,
    });
  }

  upcomingEvents.sort((a, b) => a.date - b.date);

  const inputClass =
    'w-full bg-surface rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-light';

  const inputErrorClass =
    'w-full bg-surface rounded-xl border border-red-300 px-4 py-3 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300';

  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1.5';

  // Validation helpers
  const isVaccineValid = Boolean(formData.name && formData.date && formData.nextDue);
  const isMedicationValid = Boolean(formData.name && formData.dose && formData.frequency);
  const isWeightValid = Boolean(formData.weight && parseFloat(formData.weight) > 0);
  const isExamValid = Boolean(formData.title);

  const isSaveDisabled = () => {
    if (modal === 'vaccine') return !isVaccineValid;
    if (modal === 'medication') return !isMedicationValid;
    if (modal === 'weight') return !isWeightValid;
    if (modal === 'exam') return !isExamValid;
    return false;
  };

  const getInputClass = (field) => {
    if (!formData._touched?.[field]) return inputClass;
    if (!formData[field]) return inputErrorClass;
    return inputClass;
  };

  const touchField = (field) => {
    setFormData((p) => ({
      ...p,
      _touched: { ...(p._touched || {}), [field]: true },
    }));
  };

  const updateField = (field, value) => {
    setFormData((p) => ({
      ...p,
      [field]: value,
      _touched: { ...(p._touched || {}), [field]: true },
    }));
  };

  // Weight difference indicator
  const lastWeight = pet.weight;
  const prevWeight = pet.weightHistory.length >= 2 ? pet.weightHistory[pet.weightHistory.length - 2]?.value : null;

  const handleSave = () => {
    if (isSaveDisabled()) return;

    if (modal === 'vaccine') {
      addVaccine({
        name: formData.name || '',
        lastDone: formData.date || new Date().toISOString().split('T')[0],
        nextDue: formData.nextDue || '',
        status: 'ok',
        clinic: formData.clinic || '',
        vet: formData.vet || '',
      });
    } else if (modal === 'medication') {
      addMedication({
        name: formData.name || '',
        dose: formData.dose || '',
        frequency: formData.frequency || '',
        startDate: new Date().toISOString().split('T')[0],
        duration: parseInt(formData.duration) || 30,
        daysElapsed: 0,
        nextDue: formData.nextDue || '',
        active: true,
      });
    } else if (modal === 'weight') {
      addWeightEntry({
        date: format(new Date(), 'yyyy-MM'),
        value: parseFloat(formData.weight) || 0,
      });
    } else if (modal === 'exam') {
      addRecord({
        date: new Date().toISOString().split('T')[0],
        type: 'exam',
        title: formData.title || 'Exame',
        description: formData.description || '',
        attachments: [],
      });
    }
    setModal(null);
    setFormData({});
  };

  const handleFileUploadClick = () => {
    showToast('Upload de arquivos estará disponível em breve. Registre as informações nos campos acima.', 'error');
  };

  const btnBase = 'w-full py-3 rounded-full font-semibold text-sm transition-all duration-200';
  const btnEnabled = `${btnBase} bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]`;
  const btnDisabled = `${btnBase} bg-gray-200 text-gray-400 cursor-not-allowed`;

  return (
    <div>
      <PetHeader />

      {/* Greeting */}
      <div className="mb-4 animate-fade-in-up">
        <h1 className="font-display text-xl text-text-primary">
          {getGreeting()}, {pet.name}!
        </h1>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5 stagger-children animate-fade-in-up">
        <StatusCard
          icon={Syringe}
          iconColor={nextVaccine?.status === 'overdue' ? 'bg-danger' : 'bg-primary'}
          label="Proxima vacina"
          value={nextVaccine?.name || '--'}
          sublabel={nextVaccine ? formatDateShort(nextVaccine.nextDue) : ''}
        />
        <StatusCard
          icon={Clock}
          iconColor="bg-accent"
          label="Proxima refeicao"
          value={nextMeal}
          sublabel={`${pet.food.portionGrams}g`}
        />
        <StatusCard
          icon={Pill}
          iconColor="bg-primary-light"
          label="Medicacao ativa"
          value={activeMeds.length > 0 ? activeMeds[0].name : 'Nenhuma'}
          sublabel={activeMeds.length > 1 ? `+${activeMeds.length - 1} outra(s)` : ''}
        />
        <StatusCard
          icon={Weight}
          iconColor="bg-text-secondary"
          label="Ultimo peso"
          value={`${pet.weight} kg`}
          sublabel={pet.weightHistory.at(-1)?.date || ''}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-5 animate-fade-in-up">
        <h2 className="font-display text-lg text-text-primary mb-3">Acoes Rapidas</h2>
        <div className="grid grid-cols-4 gap-2 stagger-children">
          {[
            { icon: Syringe, label: 'Vacina', key: 'vaccine' },
            { icon: Pill, label: 'Medicacao', key: 'medication' },
            { icon: Weight, label: 'Peso', key: 'weight' },
            { icon: FileText, label: 'Exame', key: 'exam' },
          ].map(({ icon: Icon, label, key }) => (
            <button
              key={key}
              onClick={() => { setModal(key); setFormData({}); }}
              className="card-interactive flex flex-col items-center gap-1.5 p-3 bg-surface-alt rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Icon size={18} className="text-primary" />
              </div>
              <span className="text-xs font-medium text-text-secondary">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-text-primary">Proximos 7 dias</h2>
          <span className="text-xs text-text-secondary font-medium">{upcomingEvents.length} eventos</span>
        </div>
        <div className="space-y-2.5 stagger-children">
          {upcomingEvents.slice(0, 8).map((event, i) => (
            <div key={i}>
              <div
                onClick={() => setExpandedEvent(expandedEvent === i ? null : i)}
                className="card-interactive flex items-center gap-3 bg-surface-alt p-3.5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl ${event.bg} flex items-center justify-center shrink-0`}>
                  <event.icon size={18} className={event.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{event.title}</p>
                  <p className="text-xs text-text-secondary">{event.subtitle}</p>
                </div>
                <div className={`shrink-0 transition-transform duration-200 ${expandedEvent === i ? 'rotate-180' : ''}`}>
                  <ChevronDown size={16} className="text-gray-300" />
                </div>
              </div>
              {expandedEvent === i && (
                <div className="mt-1 ml-13 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-text-secondary whitespace-pre-line animate-fade-in-up">
                  {event.details}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vaccine Modal */}
      <Modal open={modal === 'vaccine'} onClose={() => { setModal(null); setFormData({}); }} title="Registrar Vacina">
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Nome da vacina *</label>
            <input
              className={getInputClass('name')}
              placeholder="Ex: V10, Antirrabica..."
              value={formData.name || ''}
              onBlur={() => touchField('name')}
              onChange={(e) => updateField('name', e.target.value)}
            />
            {formData._touched?.name && !formData.name && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatorio</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Data de aplicacao *</label>
            <input
              type="date"
              className={getInputClass('date')}
              value={formData.date || ''}
              onBlur={() => touchField('date')}
              onChange={(e) => updateField('date', e.target.value)}
            />
            {formData._touched?.date && !formData.date && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatorio</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Proximo reforco *</label>
            <input
              type="date"
              className={getInputClass('nextDue')}
              value={formData.nextDue || ''}
              onBlur={() => touchField('nextDue')}
              onChange={(e) => updateField('nextDue', e.target.value)}
            />
            {formData._touched?.nextDue && !formData.nextDue && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatorio</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Clinica</label>
            <input
              className={inputClass}
              placeholder="Ex: PetVet Clinica"
              value={formData.clinic || ''}
              onChange={(e) => updateField('clinic', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Veterinario(a)</label>
            <input
              className={inputClass}
              placeholder="Ex: Dra. Ana Silva"
              value={formData.vet || ''}
              onChange={(e) => updateField('vet', e.target.value)}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!isVaccineValid}
            className={isVaccineValid ? btnEnabled : btnDisabled}
          >
            Salvar Vacina
          </button>
        </div>
      </Modal>

      {/* Medication Modal */}
      <Modal open={modal === 'medication'} onClose={() => { setModal(null); setFormData({}); }} title="Adicionar Medicacao">
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Nome do remedio *</label>
            <input
              className={getInputClass('name')}
              placeholder="Ex: Doxiciclina"
              value={formData.name || ''}
              onBlur={() => touchField('name')}
              onChange={(e) => updateField('name', e.target.value)}
            />
            {formData._touched?.name && !formData.name && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatorio</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Dose *</label>
            <input
              className={getInputClass('dose')}
              placeholder="Ex: 1 comprimido"
              value={formData.dose || ''}
              onBlur={() => touchField('dose')}
              onChange={(e) => updateField('dose', e.target.value)}
            />
            {formData._touched?.dose && !formData.dose && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatorio</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Frequencia *</label>
            <input
              className={getInputClass('frequency')}
              placeholder="Ex: 2x ao dia"
              value={formData.frequency || ''}
              onBlur={() => touchField('frequency')}
              onChange={(e) => updateField('frequency', e.target.value)}
            />
            {formData._touched?.frequency && !formData.frequency && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatorio</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Duracao (dias)</label>
            <input
              type="number"
              className={inputClass}
              placeholder="Ex: 14"
              value={formData.duration || ''}
              onChange={(e) => updateField('duration', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Proxima dose</label>
            <input
              type="date"
              className={inputClass}
              value={formData.nextDue || ''}
              onChange={(e) => updateField('nextDue', e.target.value)}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!isMedicationValid}
            className={isMedicationValid ? btnEnabled : btnDisabled}
          >
            Salvar Medicacao
          </button>
        </div>
      </Modal>

      {/* Weight Modal */}
      <Modal open={modal === 'weight'} onClose={() => { setModal(null); setFormData({}); }} title="Registrar Peso">
        <div className="space-y-3">
          {/* Current weight display */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-xs text-text-secondary">Peso atual</p>
              <p className="text-lg font-bold text-text-primary">{lastWeight} kg</p>
            </div>
            {prevWeight !== null && (
              <div className="flex items-center gap-1">
                {lastWeight > prevWeight ? (
                  <>
                    <TrendingUp size={16} className="text-green-500" />
                    <span className="text-xs font-semibold text-green-500">
                      +{(lastWeight - prevWeight).toFixed(1)} kg
                    </span>
                  </>
                ) : lastWeight < prevWeight ? (
                  <>
                    <TrendingDown size={16} className="text-red-500" />
                    <span className="text-xs font-semibold text-red-500">
                      {(lastWeight - prevWeight).toFixed(1)} kg
                    </span>
                  </>
                ) : (
                  <>
                    <Minus size={16} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400">Estavel</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Novo peso (kg) *</label>
            <input
              type="number"
              step="0.1"
              className={getInputClass('weight')}
              placeholder="Ex: 8.5"
              value={formData.weight || ''}
              onBlur={() => touchField('weight')}
              onChange={(e) => updateField('weight', e.target.value)}
            />
            {formData._touched?.weight && !formData.weight && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatorio</p>
            )}
            {formData.weight && parseFloat(formData.weight) > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                {parseFloat(formData.weight) > lastWeight ? (
                  <>
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-xs text-green-500">
                      +{(parseFloat(formData.weight) - lastWeight).toFixed(1)} kg em relacao ao atual
                    </span>
                  </>
                ) : parseFloat(formData.weight) < lastWeight ? (
                  <>
                    <TrendingDown size={14} className="text-red-500" />
                    <span className="text-xs text-red-500">
                      {(parseFloat(formData.weight) - lastWeight).toFixed(1)} kg em relacao ao atual
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">Mesmo peso atual</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!isWeightValid}
            className={isWeightValid ? btnEnabled : btnDisabled}
          >
            Salvar Peso
          </button>
        </div>
      </Modal>

      {/* Exam Modal */}
      <Modal open={modal === 'exam'} onClose={() => { setModal(null); setFormData({}); }} title="Anexar Exame">
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Titulo do exame *</label>
            <input
              className={getInputClass('title')}
              placeholder="Ex: Hemograma completo"
              value={formData.title || ''}
              onBlur={() => touchField('title')}
              onChange={(e) => updateField('title', e.target.value)}
            />
            {formData._touched?.title && !formData.title && (
              <p className="text-xs text-red-400 mt-1">Campo obrigatorio</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Descricao / observacoes</label>
            <textarea
              className={`${inputClass} resize-none h-20`}
              placeholder="Descreva os resultados ou observacoes..."
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>
          <div
            onClick={handleFileUploadClick}
            className="card-interactive border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary-50/30 transition-all duration-200"
          >
            <Upload size={24} className="mx-auto text-gray-400 mb-1" />
            <p className="text-xs font-medium text-text-secondary">Toque para anexar arquivo</p>
            <p className="text-[10px] text-gray-400 mt-0.5">PDF, imagem ou documento</p>
          </div>
          <button
            onClick={handleSave}
            disabled={!isExamValid}
            className={isExamValid ? btnEnabled : btnDisabled}
          >
            Salvar Exame
          </button>
        </div>
      </Modal>
    </div>
  );
}
