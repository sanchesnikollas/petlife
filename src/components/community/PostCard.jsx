import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { mockTutorProfiles } from '../../data/communityMockData';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PostCard({ post, onOpenComments }) {
  const { toggleLike, likedPosts, comments, groups } = useCommunity();
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const lastTap = useRef(0);

  const tutor = mockTutorProfiles.find((t) => t.id === post.tutorId);
  const group = groups.find((g) => g.id === post.groupId);
  const isLiked = likedPosts.includes(post.id);
  const postComments = comments[post.id] || [];
  const timeAgo = formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true, locale: ptBR });

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) toggleLike(post.id);
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 800);
    }
    lastTap.current = now;
  };

  const handleShare = async () => {
    const shareData = {
      title: `PetLife — ${tutor?.petName}`,
      text: post.caption,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${post.caption}\n\n${window.location.href}`);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="bg-surface-alt rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-lg shrink-0">
          {tutor?.avatar || '🐾'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{tutor?.petName || 'Pet'}</p>
          <p className="text-[11px] text-text-secondary truncate">
            {group?.emoji} {group?.name} · {timeAgo}
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="relative" onClick={handleDoubleTap}>
        <img
          src={post.image}
          alt=""
          className="w-full aspect-[4/3] object-cover"
          loading="lazy"
        />
        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart size={80} className="text-white fill-white animate-scale-in opacity-90" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-2.5">
        <div className="flex items-center gap-4 mb-1.5">
          <button
            onClick={() => toggleLike(post.id)}
            className="flex items-center gap-1.5 active:scale-90 transition-transform"
          >
            <Heart
              size={22}
              className={`transition-all duration-200 ${isLiked ? 'text-danger fill-danger animate-scale-in' : 'text-text-secondary'}`}
              strokeWidth={isLiked ? 0 : 1.8}
            />
          </button>
          <button
            onClick={() => onOpenComments(post.id)}
            className="flex items-center gap-1.5 active:scale-90 transition-transform"
          >
            <MessageCircle size={22} className="text-text-secondary" strokeWidth={1.8} />
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 active:scale-90 transition-transform"
          >
            <Share2 size={20} className="text-text-secondary" strokeWidth={1.8} />
          </button>
        </div>

        <p className="text-sm font-semibold text-text-primary mb-1">{post.likes} curtidas</p>

        {/* Caption */}
        <div className="mb-2">
          <span className="text-sm">
            <span className="font-semibold text-text-primary">{tutor?.petName} </span>
            <span className="text-text-primary">
              {showFullCaption || post.caption.length <= 100
                ? post.caption
                : `${post.caption.slice(0, 100)}...`}
            </span>
          </span>
          {!showFullCaption && post.caption.length > 100 && (
            <button onClick={() => setShowFullCaption(true)} className="text-sm text-text-secondary ml-1">
              ver mais
            </button>
          )}
        </div>

        {/* Comments teaser */}
        {postComments.length > 0 && (
          <button
            onClick={() => onOpenComments(post.id)}
            className="text-sm text-text-secondary mb-2.5 block"
          >
            Ver todos os {postComments.length} comentários
          </button>
        )}
        {postComments.length === 0 && <div className="mb-2" />}
      </div>
    </div>
  );
}
