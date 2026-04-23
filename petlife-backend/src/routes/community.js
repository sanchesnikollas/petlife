import { prisma } from '../lib/prisma.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function communityRoutes(fastify) {
  // ─── GROUPS ──────────────────────────────────────

  // GET /groups?category=BREED
  fastify.get('/groups', async (request) => {
    const { category } = request.query || {};
    const where = category ? { category } : {};
    const groups = await prisma.group.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    // Attach "following" flag for current user
    const userId = request.user.id;
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const followingSet = new Set(memberships.map((m) => m.groupId));
    return {
      data: groups.map((g) => ({ ...g, following: followingSet.has(g.id) })),
    };
  });

  // POST /groups/:groupId/join
  fastify.post('/groups/:groupId/join', async (request) => {
    const userId = request.user.id;
    const { groupId } = request.params;
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError(404, 'NOT_FOUND', 'Group not found');
    try {
      await prisma.groupMember.create({ data: { userId, groupId } });
      await prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { increment: 1 } },
      });
    } catch (e) {
      if (e.code !== 'P2002') throw e;
    }
    return { data: { joined: true } };
  });

  // DELETE /groups/:groupId/join
  fastify.delete('/groups/:groupId/join', async (request) => {
    const userId = request.user.id;
    const { groupId } = request.params;
    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (existing) {
      await prisma.groupMember.delete({ where: { userId_groupId: { userId, groupId } } });
      await prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { decrement: 1 } },
      });
    }
    return { data: { joined: false } };
  });

  // ─── POSTS ──────────────────────────────────────

  // GET /posts?groupId=&feed=following|global
  fastify.get('/posts', async (request) => {
    const userId = request.user.id;
    const { groupId, feed = 'global', limit = '30' } = request.query || {};

    // Ignore posts from blocked users
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blockedIds = blocks.map((b) => b.blockedId);

    const where = {
      hiddenAt: null,
      ...(groupId ? { groupId } : {}),
      ...(blockedIds.length ? { authorId: { notIn: blockedIds } } : {}),
    };

    if (feed === 'following' && !groupId) {
      const memberships = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true },
      });
      const groupIds = memberships.map((m) => m.groupId);
      where.OR = [
        { groupId: { in: groupIds } },
        { authorId: userId },
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        group: { select: { id: true, slug: true, name: true, emoji: true } },
        likes: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit, 10) || 30, 100),
    });

    return {
      data: posts.map((p) => ({
        ...p,
        likedByMe: p.likes.length > 0,
        likes: undefined,
      })),
    };
  });

  // POST /posts
  fastify.post('/posts', async (request) => {
    const userId = request.user.id;
    const { content, groupId, images = [], petName, petBreed } = request.body || {};
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Content is required');
    }
    if (content.length > 2000) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Content too long (max 2000 chars)');
    }
    if (groupId) {
      const g = await prisma.group.findUnique({ where: { id: groupId } });
      if (!g) throw new AppError(404, 'NOT_FOUND', 'Group not found');
    }
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content: content.trim(),
        groupId: groupId || null,
        images: Array.isArray(images) ? images.slice(0, 4) : [],
        petName: petName || null,
        petBreed: petBreed || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        group: { select: { id: true, slug: true, name: true, emoji: true } },
      },
    });
    return { data: { ...post, likedByMe: false } };
  });

  // DELETE /posts/:postId
  fastify.delete('/posts/:postId', async (request) => {
    const userId = request.user.id;
    const { postId } = request.params;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    if (post.authorId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only delete your own posts');
    }
    await prisma.post.delete({ where: { id: postId } });
    return { data: { deleted: true } };
  });

  // ─── LIKES ──────────────────────────────────────

  // POST /posts/:postId/like
  fastify.post('/posts/:postId/like', async (request) => {
    const userId = request.user.id;
    const { postId } = request.params;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    try {
      await prisma.postLike.create({ data: { userId, postId } });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });
    } catch (e) {
      if (e.code !== 'P2002') throw e;
    }
    return { data: { liked: true } };
  });

  // DELETE /posts/:postId/like
  fastify.delete('/posts/:postId/like', async (request) => {
    const userId = request.user.id;
    const { postId } = request.params;
    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) {
      await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
    }
    return { data: { liked: false } };
  });

  // ─── COMMENTS ──────────────────────────────────────

  // GET /posts/:postId/comments
  fastify.get('/posts/:postId/comments', async (request) => {
    const { postId } = request.params;
    const comments = await prisma.postComment.findMany({
      where: { postId, hiddenAt: null },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return { data: comments };
  });

  // POST /posts/:postId/comments
  fastify.post('/posts/:postId/comments', async (request) => {
    const userId = request.user.id;
    const { postId } = request.params;
    const { content } = request.body || {};
    if (!content || typeof content !== 'string' || !content.trim()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Content is required');
    }
    if (content.length > 500) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Comment too long (max 500 chars)');
    }
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const comment = await prisma.postComment.create({
      data: { postId, authorId: userId, content: content.trim() },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });
    return { data: comment };
  });

  // DELETE /comments/:commentId
  fastify.delete('/comments/:commentId', async (request) => {
    const userId = request.user.id;
    const { commentId } = request.params;
    const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    if (comment.authorId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only delete your own comments');
    }
    await prisma.postComment.delete({ where: { id: commentId } });
    await prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    });
    return { data: { deleted: true } };
  });

  // ─── REPORTS (moderation) ──────────────────────────────────────

  // POST /reports  body: { targetType, targetId, reason }
  fastify.post('/reports', async (request) => {
    const userId = request.user.id;
    const { targetType, targetId, reason } = request.body || {};
    if (!['POST', 'COMMENT', 'USER'].includes(targetType)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid targetType');
    }
    if (!targetId || typeof targetId !== 'string') {
      throw new AppError(400, 'VALIDATION_ERROR', 'targetId is required');
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Reason is required (min 3 chars)');
    }

    const report = await prisma.report.create({
      data: { reporterId: userId, targetType, targetId, reason: reason.trim() },
    });

    // Flag content as reported immediately (auto-hide after 3 reports)
    if (targetType === 'POST') {
      const pendingCount = await prisma.report.count({
        where: { targetType: 'POST', targetId, status: { in: ['OPEN', 'REVIEWED'] } },
      });
      const update = { reported: true };
      if (pendingCount >= 3) update.hiddenAt = new Date();
      await prisma.post.update({ where: { id: targetId }, data: update }).catch(() => {});
    }
    if (targetType === 'COMMENT') {
      const pendingCount = await prisma.report.count({
        where: { targetType: 'COMMENT', targetId, status: { in: ['OPEN', 'REVIEWED'] } },
      });
      const update = { reported: true };
      if (pendingCount >= 3) update.hiddenAt = new Date();
      await prisma.postComment.update({ where: { id: targetId }, data: update }).catch(() => {});
    }

    return { data: report };
  });

  // ─── BLOCK ──────────────────────────────────────

  // POST /users/:userId/block
  fastify.post('/users/:userId/block', async (request) => {
    const blockerId = request.user.id;
    const blockedId = request.params.userId;
    if (blockerId === blockedId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Cannot block yourself');
    }
    try {
      await prisma.userBlock.create({ data: { blockerId, blockedId } });
    } catch (e) {
      if (e.code !== 'P2002') throw e;
    }
    return { data: { blocked: true } };
  });

  // DELETE /users/:userId/block
  fastify.delete('/users/:userId/block', async (request) => {
    const blockerId = request.user.id;
    const blockedId = request.params.userId;
    await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
    return { data: { blocked: false } };
  });
}
