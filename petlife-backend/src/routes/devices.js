import { prisma } from '../lib/prisma.js';
import { AppError } from '../plugins/errorHandler.js';
import { runPushCycle } from '../services/pushScheduler.js';

export default async function devicesRoutes(fastify) {
  // POST /me/devices  body: { platform, token }
  fastify.post('/me/devices', async (request) => {
    const userId = request.user.id;
    const { platform, token } = request.body || {};
    if (!['IOS', 'ANDROID', 'WEB'].includes(platform)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid platform');
    }
    if (!token || typeof token !== 'string' || token.length < 10) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid token');
    }

    const device = await prisma.deviceToken.upsert({
      where: { token },
      update: { userId, lastSeen: new Date() },
      create: { userId, platform, token },
    });

    return { data: device };
  });

  // DELETE /me/devices/:id
  fastify.delete('/me/devices/:id', async (request) => {
    const userId = request.user.id;
    const { id } = request.params;
    const device = await prisma.deviceToken.findUnique({ where: { id } });
    if (!device || device.userId !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Device not found');
    }
    await prisma.deviceToken.delete({ where: { id } });
    return { data: { deleted: true } };
  });

  // GET /me/devices
  fastify.get('/me/devices', async (request) => {
    const userId = request.user.id;
    const devices = await prisma.deviceToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: devices };
  });

  // POST /me/push-test — trigger immediate push cycle for dev
  fastify.post('/me/push-test', async () => {
    const result = await runPushCycle();
    return { data: result };
  });
}
