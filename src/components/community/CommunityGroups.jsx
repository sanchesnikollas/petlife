import { useCommunity } from '../../context/CommunityContext';

const categoryLabels = {
  breed: { title: 'Por Raça', emoji: '🐾' },
  city: { title: 'Por Cidade', emoji: '📍' },
  topic: { title: 'Por Tema', emoji: '💡' },
};

export default function CommunityGroups({ onSelectGroup }) {
  const { groups, followedGroups, toggleFollow } = useCommunity();

  const categories = ['breed', 'city', 'topic'];

  return (
    <div className="space-y-5">
      {categories.map((cat) => {
        const catGroups = groups.filter((g) => g.category === cat);
        const label = categoryLabels[cat];
        return (
          <div key={cat} className="animate-fade-in-up">
            <h3 className="font-display text-base text-text-primary mb-3 flex items-center gap-2">
              {label.emoji} {label.title}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {catGroups.map((group) => {
                const isFollowed = followedGroups.includes(group.id);
                return (
                  <div
                    key={group.id}
                    className="bg-surface-alt rounded-2xl border border-gray-100 shadow-sm p-3 active:scale-[0.97] transition-all duration-200 hover:shadow-md"
                  >
                    <div
                      onClick={() => onSelectGroup(group.id)}
                      className="cursor-pointer"
                    >
                      <div className="text-2xl mb-1.5">{group.emoji}</div>
                      <p className="text-sm font-semibold text-text-primary truncate">{group.name}</p>
                      <p className="text-[11px] text-text-secondary">{group.members.toLocaleString()} membros</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFollow(group.id); }}
                      className={`mt-2 w-full py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isFollowed
                          ? 'bg-primary-50 text-primary border border-primary/20'
                          : 'bg-primary text-white shadow-sm'
                      }`}
                    >
                      {isFollowed ? 'Seguindo ✓' : 'Seguir'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
