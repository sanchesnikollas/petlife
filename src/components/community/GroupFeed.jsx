import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import PostCard from './PostCard';
import CommentModal from './CommentModal';
import CreatePostModal from './CreatePostModal';
import EmptyState from '../EmptyState';
import { MessageCircle } from 'lucide-react';

export default function GroupFeed({ groupId, onBack }) {
  const { groups, posts, followedGroups, toggleFollow } = useCommunity();
  const [commentPostId, setCommentPostId] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const group = groups.find((g) => g.id === groupId);
  const groupPosts = posts
    .filter((p) => p.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const isFollowed = followedGroups.includes(groupId);

  if (!group) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 animate-fade-in-up">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-surface hover:bg-gray-100 transition-colors active:scale-90"
        >
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg text-text-primary flex items-center gap-2">
            {group.emoji} {group.name}
          </h2>
          <p className="text-xs text-text-secondary">{group.members.toLocaleString()} membros</p>
        </div>
        <button
          onClick={() => toggleFollow(groupId)}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            isFollowed
              ? 'bg-primary-50 text-primary border border-primary/20'
              : 'bg-primary text-white shadow-sm'
          }`}
        >
          {isFollowed ? 'Seguindo ✓' : 'Seguir'}
        </button>
      </div>

      {/* Posts */}
      {groupPosts.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhum post ainda"
          description="Seja o primeiro a postar neste grupo!"
          actionLabel="Criar Post"
          onAction={() => setShowCreatePost(true)}
        />
      ) : (
        <div className="space-y-4 stagger-children">
          {groupPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenComments={setCommentPostId}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform hover:shadow-2xl"
        style={{ maxWidth: 'calc(50% + 14rem)', marginLeft: 'auto' }}
      >
        <Plus size={24} />
      </button>

      <CommentModal
        postId={commentPostId}
        open={!!commentPostId}
        onClose={() => setCommentPostId(null)}
      />

      <CreatePostModal
        groupId={groupId}
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />
    </div>
  );
}
