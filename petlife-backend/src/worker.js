/**
 * PetLife Worker — Background jobs (separate from API server)
 *
 * Runs: push notification scheduler, cleanup jobs, moderation auto-hide.
 * Deploy as a separate Railway service pointing to Dockerfile.worker.
 */

import { startScheduler } from './services/pushScheduler.js';
import { prisma } from './lib/prisma.js';

const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

async function cleanupOldPushSent() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.pushSent.deleteMany({
    where: { sentAt: { lt: thirtyDaysAgo } },
  });
  if (count > 0) console.log(`[cleanup] deleted ${count} old push_sent records`);
}

async function cleanupStaleDeviceTokens() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.deviceToken.deleteMany({
    where: { lastSeen: { lt: ninetyDaysAgo } },
  });
  if (count > 0) console.log(`[cleanup] removed ${count} stale device tokens`);
}

async function autoHideReportedContent() {
  // Auto-hide posts with 3+ open reports
  const reportedPosts = await prisma.report.groupBy({
    by: ['targetId'],
    where: { targetType: 'POST', status: 'OPEN' },
    _count: true,
    having: { targetId: { _count: { gte: 3 } } },
  });
  for (const r of reportedPosts) {
    await prisma.post.updateMany({
      where: { id: r.targetId, hiddenAt: null },
      data: { hiddenAt: new Date() },
    });
  }
  if (reportedPosts.length) console.log(`[moderation] auto-hid ${reportedPosts.length} posts`);
}

function startCleanupJobs() {
  setInterval(async () => {
    try {
      await cleanupOldPushSent();
      await cleanupStaleDeviceTokens();
      await autoHideReportedContent();
    } catch (e) {
      console.error('[cleanup] error:', e.message);
    }
  }, CLEANUP_INTERVAL);

  // Run once after 60s
  setTimeout(async () => {
    await cleanupOldPushSent().catch(() => {});
    await cleanupStaleDeviceTokens().catch(() => {});
    await autoHideReportedContent().catch(() => {});
  }, 60000);
}

async function main() {
  console.log('PetLife Worker starting...');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

  // Test DB connection
  const userCount = await prisma.user.count();
  console.log(`DB connected (${userCount} users)`);

  // Start push scheduler (every hour)
  startScheduler(60 * 60 * 1000);

  // Start cleanup jobs (every 6h)
  startCleanupJobs();

  console.log('Worker running. Press Ctrl+C to stop.');

  // Keep alive
  process.on('SIGINT', async () => {
    console.log('Worker shutting down...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Worker shutting down (SIGTERM)...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error('Worker failed to start:', e);
  process.exit(1);
});
