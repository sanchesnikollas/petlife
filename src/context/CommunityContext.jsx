import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  useGroups,
  useJoinGroup,
  useLeaveGroup,
  usePosts,
  useCreatePost,
  useLikePost,
  usePostComments,
  useAddComment,
  useReport,
  useBlockUser,
} from '../hooks/useCommunity';
import api from '../lib/api.js';

const CommunityContext = createContext(null);

const CARDS_STORAGE_KEY = 'petlife_community_petcards';

function loadCards() {
  try {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

// Transform backend post into UI-friendly shape (mirrors old mock shape)
function mapPost(p) {
  if (!p) return null;
  return {
    id: p.id,
    tutorId: p.author?.id || 'unknown',
    tutorName: p.author?.name || 'Tutor',
    tutorAvatar: p.author?.avatarUrl || '🐾',
    petName: p.petName || 'Pet',
    petBreed: p.petBreed || '',
    groupId: p.groupId,
    group: p.group,
    image: p.images?.[0] || null,
    images: p.images || [],
    caption: p.content,
    likes: p.likesCount || 0,
    commentsCount: p.commentsCount || 0,
    likedByMe: Boolean(p.likedByMe),
    reported: Boolean(p.reported),
    createdAt: p.createdAt,
  };
}

function mapComment(c) {
  if (!c) return null;
  return {
    id: c.id,
    tutorId: c.author?.id || 'unknown',
    tutorName: c.author?.name || 'Tutor',
    text: c.content,
    createdAt: c.createdAt,
  };
}

export function CommunityProvider({ children }) {
  // Groups from backend
  const { data: groupsData = [] } = useGroups();
  const joinMut = useJoinGroup();
  const leaveMut = useLeaveGroup();

  // Posts from backend
  const { data: postsData = [] } = usePosts({ feed: 'global' });
  const createPostMut = useCreatePost();
  const likeMut = useLikePost();
  const reportMut = useReport();
  const blockMut = useBlockUser();

  // Comments are lazy-loaded per post — keep a local cache
  const [commentsCache, setCommentsCache] = useState({});

  // Pet cards remain local (per-user UI state)
  const [petCards, setPetCards] = useState(loadCards);
  useEffect(() => {
    try { localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(petCards)); } catch { /* ignore */ }
  }, [petCards]);

  // Derived
  const groups = useMemo(
    () => groupsData.map((g) => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji || '🐾',
      category: (g.category || '').toLowerCase(),
      members: g.membersCount || 0,
      following: Boolean(g.following),
      description: g.description,
      slug: g.slug,
    })),
    [groupsData]
  );

  const followedGroups = useMemo(
    () => groups.filter((g) => g.following).map((g) => g.id),
    [groups]
  );

  const posts = useMemo(() => postsData.map(mapPost), [postsData]);

  const likedPosts = useMemo(
    () => posts.filter((p) => p.likedByMe).map((p) => p.id),
    [posts]
  );

  // Public actions

  const toggleFollow = useCallback((groupId) => {
    const g = groups.find((x) => x.id === groupId);
    if (!g) return;
    if (g.following) leaveMut.mutate(groupId);
    else joinMut.mutate(groupId);
  }, [groups, joinMut, leaveMut]);

  const toggleLike = useCallback((postId) => {
    const p = posts.find((x) => x.id === postId);
    if (!p) return;
    likeMut.mutate({ postId, liked: p.likedByMe });
  }, [posts, likeMut]);

  const createPost = useCallback((data) => {
    createPostMut.mutate({
      content: data.caption || data.content || '',
      groupId: data.groupId || null,
      images: data.image ? [data.image] : data.images || [],
      petName: data.petName,
      petBreed: data.petBreed,
    });
  }, [createPostMut]);

  const addComment = useCallback(async (postId, text) => {
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text }).then((r) => r.data);
      setCommentsCache((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), mapComment(res)],
      }));
    } catch (e) {
      console.error('addComment failed', e);
    }
  }, []);

  const loadComments = useCallback(async (postId) => {
    if (commentsCache[postId]) return;
    try {
      const res = await api.get(`/posts/${postId}/comments`).then((r) => r.data);
      setCommentsCache((prev) => ({ ...prev, [postId]: res.map(mapComment) }));
    } catch (e) {
      console.error('loadComments failed', e);
    }
  }, [commentsCache]);

  const reportPost = useCallback((postId, reason) => {
    reportMut.mutate({ targetType: 'POST', targetId: postId, reason });
  }, [reportMut]);

  const reportComment = useCallback((commentId, reason) => {
    reportMut.mutate({ targetType: 'COMMENT', targetId: commentId, reason });
  }, [reportMut]);

  const blockUser = useCallback((userId) => {
    blockMut.mutate(userId);
  }, [blockMut]);

  const updatePetCard = useCallback((petId, cardData) => {
    setPetCards((prev) => ({
      ...prev,
      [petId]: { ...(prev[petId] || {}), ...cardData },
    }));
  }, []);

  // Object form so components like PostCard that do `comments[post.id]` still work
  const comments = commentsCache;

  return (
    <CommunityContext.Provider
      value={{
        groups,
        followedGroups,
        posts,
        likedPosts,
        comments,
        petCards,
        toggleFollow,
        toggleLike,
        addComment,
        loadComments,
        createPost,
        reportPost,
        reportComment,
        blockUser,
        updatePetCard,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) throw new Error('useCommunity must be used within CommunityProvider');
  return context;
}
