export default function StatusCard({ icon: Icon, iconColor, label, value, sublabel, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card-interactive p-4 text-left w-full group"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${iconColor} group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-text-primary mt-0.5 truncate">{value}</p>
      {sublabel && <p className="text-xs text-text-secondary mt-0.5">{sublabel}</p>}
    </button>
  );
}
