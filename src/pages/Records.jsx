import { useState } from 'react';
import { usePet } from '../context/PetContext';
import EmptyState from '../components/EmptyState';
import {
  Syringe, Pill, Stethoscope, Bug, FileText, Image,
  Filter, ChevronDown, ClipboardList,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig = {
  vaccine: { icon: Syringe, label: 'Vacina', color: 'text-primary', bg: 'bg-primary-50' },
  medication: { icon: Pill, label: 'Medicação', color: 'text-primary-light', bg: 'bg-success-light' },
  consultation: { icon: Stethoscope, label: 'Consulta', color: 'text-accent', bg: 'bg-warning-light' },
  deworming: { icon: Bug, label: 'Vermífugo', color: 'text-primary', bg: 'bg-primary-50' },
  exam: { icon: FileText, label: 'Exame', color: 'text-danger', bg: 'bg-danger-light' },
};

const filterOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'vaccine', label: 'Vacinas' },
  { key: 'medication', label: 'Medicações' },
  { key: 'consultation', label: 'Consultas' },
  { key: 'exam', label: 'Exames' },
  { key: 'deworming', label: 'Vermífugos' },
];

export default function Records() {
  const { pet } = usePet();
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const sortedRecords = [...pet.records]
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const filteredRecords =
    filter === 'all' ? sortedRecords : sortedRecords.filter((r) => r.type === filter);

  const activeFilterLabel = filterOptions.find((f) => f.key === filter)?.label || 'Filtrar';

  return (
    <div className="pt-6 animate-fade-in-up">
      <h1 className="font-display text-2xl text-text-primary mb-1">Prontuário</h1>
      <p className="text-sm text-text-secondary mb-4">
        Histórico clínico completo · {sortedRecords.length} registros
      </p>

      {/* Filter */}
      <div className="mb-5">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-alt rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:border-gray-300 active:scale-[0.98] transition-all"
        >
          <Filter size={15} />
          {activeFilterLabel}
          {filter !== 'all' && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {filteredRecords.length}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-20 mt-2.5 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setShowFilters(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  filter === key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-alt text-text-secondary border border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {filteredRecords.length > 0 ? (
        <div className="relative">
          <div className="absolute left-5 top-3 bottom-3 w-px bg-gradient-to-b from-primary-lighter via-gray-200 to-transparent" />

          <div className="space-y-3 stagger-children">
            {filteredRecords.map((record) => {
              const config = typeConfig[record.type] || typeConfig.exam;
              const Icon = config.icon;
              const isExpanded = expandedId === record.id;
              return (
                <div key={record.id} className="flex gap-3 relative">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0 z-10 transition-transform ${isExpanded ? 'scale-110' : ''}`}>
                    <Icon size={16} className={config.color} />
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="flex-1 card-interactive p-4 text-left"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${config.color}`}>
                          {config.label}
                        </span>
                        <h3 className="text-sm font-bold text-text-primary">{record.title}</h3>
                      </div>
                      <span className="text-[10px] text-text-secondary font-medium whitespace-nowrap ml-2">
                        {format(parseISO(record.date), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 mt-2 opacity-100' : 'max-h-5 opacity-80'}`}>
                      <p className={`text-xs text-text-secondary ${!isExpanded ? 'truncate' : ''}`}>
                        {record.description}
                      </p>
                    </div>

                    {record.attachments.length > 0 && (
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-20 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-wrap gap-1.5">
                          {record.attachments.map((a, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[10px] font-medium bg-surface px-2.5 py-1 rounded-lg text-text-secondary"
                            >
                              <Image size={10} />
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum registro encontrado"
          description={filter !== 'all' ? `Sem registros do tipo "${activeFilterLabel}". Tente outro filtro.` : 'O prontuário do seu pet aparecerá aqui conforme você registrar eventos.'}
        />
      )}
    </div>
  );
}
