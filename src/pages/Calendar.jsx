import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { useVaccines } from '../hooks/useVaccines';
import { useMedications } from '../hooks/useMedications';
import { useConsultations } from '../hooks/useConsultations';
import { useDewormings } from '../hooks/useDewormings';
import Skeleton from '../components/Skeleton';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth,
  isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Syringe, Pill, Stethoscope, Bug,
  ArrowLeft,
} from 'lucide-react';

const EVENT_COLORS = {
  danger: 'bg-red-500',
  success: 'bg-green-500',
  primary: 'bg-blue-500',
  'primary-light': 'bg-blue-400',
  accent: 'bg-purple-500',
};

const EVENT_ICONS = {
  vaccine: Syringe,
  medication: Pill,
  consultation: Stethoscope,
  deworming: Bug,
};

const EVENT_BG = {
  vaccine: 'bg-red-50',
  medication: 'bg-blue-50',
  consultation: 'bg-green-50',
  deworming: 'bg-purple-50',
};

const EVENT_TEXT = {
  vaccine: 'text-red-600',
  medication: 'text-blue-600',
  consultation: 'text-green-600',
  deworming: 'text-purple-600',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function Calendar() {
  const navigate = useNavigate();
  const { activePetId } = usePet();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: vaccines, isLoading: vaccinesLoading } = useVaccines(activePetId);
  const { data: medications, isLoading: medsLoading } = useMedications(activePetId);
  const { data: consultations, isLoading: consLoading } = useConsultations(activePetId);
  const { data: dewormings, isLoading: dewLoading } = useDewormings(activePetId);

  const isLoading = vaccinesLoading || medsLoading || consLoading || dewLoading;

  // Build events map grouped by date
  const eventsByDate = useMemo(() => {
    const allEvents = [];

    vaccines?.forEach(v => {
      if (v.nextDue) allEvents.push({ date: v.nextDue.slice(0, 10), type: 'vaccine', title: `Vacina: ${v.name}`, color: 'danger' });
      if (v.lastDone) allEvents.push({ date: v.lastDone.slice(0, 10), type: 'vaccine', title: `Vacina: ${v.name} (aplicada)`, color: 'success' });
    });

    medications?.filter(m => m.active).forEach(m => {
      if (m.nextDue) allEvents.push({ date: m.nextDue.slice(0, 10), type: 'medication', title: `Medicação: ${m.name}`, color: 'primary-light' });
    });

    consultations?.forEach(c => {
      if (c.date) allEvents.push({ date: c.date.slice(0, 10), type: 'consultation', title: `Consulta: ${c.type || 'Check-up'}`, color: 'primary' });
    });

    dewormings?.forEach(d => {
      if (d.nextDue) allEvents.push({ date: d.nextDue.slice(0, 10), type: 'deworming', title: `Vermifugo: ${d.name}`, color: 'accent' });
    });

    const map = {};
    allEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [vaccines, medications, consultations, dewormings]);

  // Calendar days grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const selectedDateStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] || []) : [];

  if (isLoading) {
    return (
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton width={32} height={32} rounded="lg" />
          <Skeleton height={28} width="50%" rounded="md" />
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} height={16} rounded="md" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} height={44} rounded="xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-text-secondary mb-4 hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Voltar</span>
      </button>

      {/* Month header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="w-9 h-9 rounded-xl bg-surface-alt border border-gray-100 flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 transition-all"
        >
          <ChevronLeft size={18} className="text-text-secondary" />
        </button>
        <h1 className="font-display text-xl text-text-primary capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h1>
        <button
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="w-9 h-9 rounded-xl bg-surface-alt border border-gray-100 flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 transition-all"
        >
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wide py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateStr] || [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(selected ? null : day)}
              className={`
                min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200
                ${!inMonth ? 'opacity-30' : ''}
                ${today ? 'ring-2 ring-primary' : ''}
                ${selected ? 'bg-primary-50 shadow-sm' : 'hover:bg-gray-50'}
              `}
            >
              <span className={`text-sm font-medium ${selected ? 'text-primary font-bold' : inMonth ? 'text-text-primary' : 'text-gray-300'}`}>
                {format(day, 'd')}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[e.color] || 'bg-gray-400'}`} />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] font-bold text-text-secondary">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base text-text-primary">
              {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
            </h2>
            <span className="text-xs text-text-secondary font-medium">
              {selectedEvents.length} {selectedEvents.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="bg-surface-alt rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-sm text-text-secondary">Nenhum evento neste dia</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedEvents.map((event, i) => {
                const Icon = EVENT_ICONS[event.type] || Syringe;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-surface-alt p-3.5 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className={`w-10 h-10 rounded-xl ${EVENT_BG[event.type] || 'bg-gray-50'} flex items-center justify-center shrink-0`}>
                      <Icon size={18} className={EVENT_TEXT[event.type] || 'text-gray-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{event.title}</p>
                      <p className="text-xs text-text-secondary capitalize">{event.type}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${EVENT_COLORS[event.color] || 'bg-gray-400'}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
