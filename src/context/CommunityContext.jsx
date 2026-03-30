import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  communityPosts as mockPosts,
  communityComments as mockComments,
  communityGroups,
  defaultFollowedGroups,
  defaultPetCards,
} from '../data/communityMockData';

const CommunityContext = createContext(null);

const STORAGE_KEY = 'petlife_community_data';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function CommunityProvider({ children }) {
  const stored = loadFromStorage();

  const [followedGroups, setFollowedGroups] = useState(stored?.followedGroups || defaultFollowedGroups);
  const [posts, setPosts] = useState(stored?.posts || mockPosts);
  const [likedPosts, setLikedPosts] = useState(stored?.likedPosts || []);
  const [comments, setComments] = useState(stored?.comments || mockComments);
  const [petCards, setPetCards] = useState(stored?.petCards || defaultPetCards);

  useEffect(() => {
    saveToStorage({ followedGroups, posts, likedPosts, comments, petCards });
  }, [followedGroups, posts, likedPosts, comments, petCards]);

  const toggleFollow = useCallback((groupId) => {
    setFollowedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  const toggleLike = useCallback((postId) => {
    setLikedPosts((prev) => {
      const isLiked = prev.includes(postId);
      if (isLiked) {
        setPosts((p) => p.map((post) => post.id === postId ? { ...post, likes: post.likes - 1 } : post));
        return prev.filter((id) => id !== postId);
      } else {
        setPosts((p) => p.map((post) => post.id === postId ? { ...post, likes: post.likes + 1 } : post));
        return [...prev, postId];
      }
    });
  }, []);

  const addComment = useCallback((postId, text, tutorName) => {
    const newComment = {
      id: `cm${Date.now()}`,
      tutorId: 'me',
      tutorName,
      text,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));
  }, []);

  const createPost = useCallback((post) => {
    const newPost = {
      ...post,
      id: `p${Date.now()}`,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const updatePetCard = useCallback((petId, cardData) => {
    setPetCards((prev) => ({
      ...prev,
      [petId]: { ...(prev[petId] || {}), ...cardData },
    }));
  }, []);

  return (
    <CommunityContext.Provider
      value={{
        groups: communityGroups,
        followedGroups,
        posts,
        likedPosts,
        comments,
        petCards,
        toggleFollow,
        toggleLike,
        addComment,
        createPost,
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
