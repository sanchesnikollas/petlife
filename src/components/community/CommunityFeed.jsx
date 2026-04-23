import { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import PostCard from './PostCard';
import CommentModal from './CommentModal';
import CreatePostModal from './CreatePostModal';
import EmptyState from '../EmptyState';
import { Users, Plus } from 'lucide-react';

export default function CommunityFeed({ onGoToGroups }) {
  const { posts } = useCommunity();
  const [commentPostId, setCommentPostId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const feedPosts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (feedPosts.length === 0) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="Nenhum post ainda"
          description="Seja o primeiro a compartilhar algo com a comunidade!"
          action={{ label: 'Criar primeiro post', onClick: () => setCreateOpen(true) }}
        />
        <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </>
    );
  }

  return (
    <div className="space-y-4 stagger-children">
      <button
        onClick={() => setCreateOpen(true)}
        className="w-full flex items-center gap-3 p-4 bg-surface-alt border border-dashed border-primary/30 rounded-2xl text-left hover:bg-primary-50/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Plus size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">Criar novo post</p>
          <p className="text-xs text-text-secondary">Compartilhe com a comunidade</p>
        </div>
      </button>

      {feedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onOpenComments={setCommentPostId}
        />
      ))}

      <CommentModal
        postId={commentPostId}
        open={!!commentPostId}
        onClose={() => setCommentPostId(null)}
      />
      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
