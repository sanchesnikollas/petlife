import { useState } from 'react';
import Modal from '../Modal';
import { useCommunity } from '../../context/CommunityContext';
import { usePet } from '../../context/PetContext';
import { ImagePlus } from 'lucide-react';

const placeholderImages = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=450&fit=crop',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=450&fit=crop',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=450&fit=crop',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=450&fit=crop',
];

export default function CreatePostModal({ groupId, open, onClose }) {
  const { createPost } = useCommunity();
  const { pet, tutor } = usePet();
  const [caption, setCaption] = useState('');

  const handlePost = () => {
    if (!caption.trim()) return;
    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    createPost({
      tutorId: 'me',
      tutorName: tutor.name,
      petName: pet.name,
      groupId,
      image: randomImage,
      caption: caption.trim(),
    });
    setCaption('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo Post">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-lg">
            {pet.species === 'cat' ? '🐱' : '🐶'}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{pet.name}</p>
            <p className="text-xs text-text-secondary">{tutor.name}</p>
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Compartilhe uma dica, momento ou pergunta..."
          className="w-full bg-surface rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-light resize-none h-28"
        />

        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <ImagePlus size={20} className="text-text-secondary" />
          <p className="text-xs text-text-secondary">Uma foto aleatória será adicionada ao post</p>
        </div>

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
