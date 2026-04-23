import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

// ─── Groups ──────────────────────────────────────

export function useGroups(category) {
  return useQuery({
    queryKey: ['groups', category],
    queryFn: () => {
      const qs = category ? `?category=${category}` : '';
      return api.get(`/groups${qs}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId) => api.post(`/groups/${groupId}/join`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId) => api.del(`/groups/${groupId}/join`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

// ─── Posts ──────────────────────────────────────

export function usePosts({ groupId, feed = 'global' } = {}) {
  return useQuery({
    queryKey: ['posts', { groupId, feed }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (groupId) params.set('groupId', groupId);
      if (feed) params.set('feed', feed);
      return api.get(`/posts?${params}`).then((r) => r.data);
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/posts', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.del(`/posts/${postId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, liked }) =>
      liked
        ? api.del(`/posts/${postId}/like`).then((r) => r.data)
        : api.post(`/posts/${postId}/like`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

// ─── Comments ──────────────────────────────────────

export function usePostComments(postId) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.get(`/posts/${postId}/comments`).then((r) => r.data),
    enabled: !!postId,
  });
}

export function useAddComment(postId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content) => api.post(`/posts/${postId}/comments`, { content }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ─── Moderation ──────────────────────────────────────

export function useReport() {
  return useMutation({
    mutationFn: ({ targetType, targetId, reason }) =>
      api.post('/reports', { targetType, targetId, reason }).then((r) => r.data),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => api.post(`/users/${userId}/block`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}
