import { useState } from 'react';
import Modal from '../Modal';
import { useCommunity } from '../../context/CommunityContext';
import { usePet } from '../../context/PetContext';
import { mockTutorProfiles } from '../../data/communityMockData';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send } from 'lucide-react';

export default function CommentModal({ postId, open, onClose }) {
  const { comments, addComment } = useCommunity();
  const { tutor } = usePet();
  const [text, setText] = useState('');

  const postComments = comments[postId] || [];

  const handleSend = () => {
    if (!text.trim()) return;
    addComment(postId, text.trim(), tutor.name);
    setText('');
  };

  const getTutorName = (comment) => {
    if (comment.tutorId === 'me') return comment.tutorName || tutor.name;
    const t = mockTutorProfiles.find((p) => p.id === comment.tutorId);
    return t?.name || 'Tutor';
  };

  const getTutorAvatar = (comment) => {
    if (comment.tutorId === 'me') return '🧑';
    const t = mockTutorProfiles.find((p) => p.id === comment.tutorId);
    return t?.avatar || '🐾';
  };

  return (
    <Modal open={open} onClose={onClose} title="Comentários">
      <div className="flex flex-col" style={{ minHeight: '40vh' }}>
        {/* Comments list */}
        <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[50vh]">
          {postComments.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-8">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          )}
          {postComments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 animate-fade-in-up">
              <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-sm shrink-0">
                {getTutorAvatar(comment)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-text-primary">{getTutorName(comment)} </span>
                  <span className="text-text-primary">{comment.text}</span>
                </p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Adicione um comentário..."
            className="flex-1 bg-surface rounded-full px-4 py-2.5 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-light border border-gray-200"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={`p-2.5 rounded-full transition-all duration-200 ${
              text.trim()
                ? 'bg-primary text-white shadow-md active:scale-90'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
