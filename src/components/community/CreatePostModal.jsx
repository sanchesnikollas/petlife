import { useState } from 'react';
import Modal from '../Modal';
import { useCommunity } from '../../context/CommunityContext';
import { usePet } from '../../context/PetContext';

export default function CreatePostModal({ groupId, open, onClose }) {
  const { createPost, groups } = useCommunity();
  const { pet } = usePet();
  const [caption, setCaption] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(groupId || '');

  const handlePost = () => {
    const trimmed = caption.trim();
    if (!trimmed) return;
    createPost({
      caption: trimmed,
      groupId: selectedGroup || null,
      petName: pet?.name,
      petBreed: pet?.breed,
    });
    setCaption('');
    setSelectedGroup(groupId || '');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo Post">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-lg">
            {pet?.species === 'CAT' || pet?.species === 'cat' ? '🐱' : '🐶'}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{pet?.name || 'Meu pet'}</p>
            <p className="text-xs text-text-secondary">{pet?.breed || ''}</p>
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Compartilhe uma dica, momento ou pergunta..."
          maxLength={2000}
          className="w-full bg-surface rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-light resize-none h-28"
        />
        <p className="text-[10px] text-text-secondary text-right -mt-2">{caption.length}/2000</p>

        {!groupId && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Publicar em (opcional)</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-surface rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Feed geral</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handlePost}
          disabled={!caption.trim()}
          className={`w-full py-3 rounded-full font-semibold text-sm transition-all duration-200 ${
            caption.trim()
              ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Publicar
        </button>
      </div>
    </Modal>
  );
}
