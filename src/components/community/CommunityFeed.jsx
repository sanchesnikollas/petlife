import { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import PostCard from './PostCard';
import CommentModal from './CommentModal';
import EmptyState from '../EmptyState';
import { Users } from 'lucide-react';

export default function CommunityFeed({ onGoToGroups }) {
  const { posts, followedGroups } = useCommunity();
  const [commentPostId, setCommentPostId] = useState(null);

  const feedPosts = posts
    .filter((p) => followedGroups.includes(p.groupId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (feedPosts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Seu feed está vazio"
        description="Siga grupos para ver posts de outros tutores aqui!"
        action={{ label: 'Explorar Grupos', onClick: onGoToGroups }}
      />
    );
  }

  return (
    <div className="space-y-4 stagger-children">
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
    </div>
  );
}
