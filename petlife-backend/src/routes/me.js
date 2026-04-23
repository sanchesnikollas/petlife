import { updateProfileSchema } from '../schemas/me.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function meRoutes(fastify) {
  // GET /me
  fastify.get('/me', async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, plan: true, createdAt: true },
    });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return { data: user };
  });

  // PATCH /me
  fastify.patch('/me', async (request) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten().fieldErrors);
    }
    const user = await prisma.user.update({
      where: { id: request.user.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, plan: true },
    });
    return { data: user };
  });

  // DELETE /me — LGPD: hard delete user and all associated data
  fastify.delete('/me', async (request) => {
    const userId = request.user.id;
    await prisma.$transaction([
      prisma.pushSent.deleteMany({ where: { userId } }),
      prisma.deviceToken.deleteMany({ where: { userId } }),
      prisma.postLike.deleteMany({ where: { userId } }),
      prisma.postComment.deleteMany({ where: { authorId: userId } }),
      prisma.post.deleteMany({ where: { authorId: userId } }),
      prisma.groupMember.deleteMany({ where: { userId } }),
      prisma.report.deleteMany({ where: { reporterId: userId } }),
      prisma.userBlock.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    return { data: { message: 'Account and all data permanently deleted' } };
  });
}
