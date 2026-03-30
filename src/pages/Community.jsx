import { useState } from 'react';
import { CommunityProvider } from '../context/CommunityContext';
import CommunityFeed from '../components/community/CommunityFeed';
import CommunityGroups from '../components/community/CommunityGroups';
import GroupFeed from '../components/community/GroupFeed';
import PetSocialCard from '../components/community/PetSocialCard';

const tabs = [
  { id: 'feed', label: 'Feed' },
  { id: 'groups', label: 'Grupos' },
  { id: 'card', label: 'Meu Cartão' },
];

function CommunityContent() {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedGroup, setSelectedGroup] = useState(null);

  // When viewing a group feed
  if (selectedGroup) {
    return (
      <GroupFeed
        groupId={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="pt-2 pb-3 animate-fade-in-up">
        <h1 className="font-display text-xl text-text-primary mb-1">Comunidade</h1>
        <p className="text-xs text-text-secondary">Conecte-se com outros tutores</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-4 animate-fade-in-up">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-surface-alt text-text-secondary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'feed' && (
        <CommunityFeed onGoToGroups={() => setActiveTab('groups')} />
      )}
      {activeTab === 'groups' && (
        <CommunityGroups onSelectGroup={setSelectedGroup} />
      )}
      {activeTab === 'card' && (
        <PetSocialCard />
      )}
    </div>
  );
}

export default function Community() {
  return (
    <CommunityProvider>
      <CommunityContent />
    </CommunityProvider>
  );
}
