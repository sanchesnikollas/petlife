import { prisma } from '../lib/prisma.js';
import { sendPush } from './fcm.js';

/**
 * Check vaccines, medications, dewormings, consultations with nextDue
 * in the next 24h / 3 days / 7 days window and send notifications.
 * Idempotent per (user, resource, dueDate) via PushSent table.
 */
export async function runPushCycle() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let sent = 0;
  let skipped = 0;

  // Vaccines
  const vaccines = await prisma.vaccine.findMany({
    where: { nextDue: { gte: now, lte: in7d } },
    include: { pet: { select: { id: true, name: true, userId: true } } },
  });
  for (const v of vaccines) {
    const window = v.nextDue <= in24h ? '24h' : v.nextDue <= in3d ? '3d' : '7d';
    const body = window === '24h'
      ? `Vacina ${v.name} de ${v.pet.name} é amanhã`
      : window === '3d'
      ? `Vacina ${v.name} de ${v.pet.name} em 3 dias`
      : `Vacina ${v.name} de ${v.pet.name} em 7 dias`;
    const result = await sendToUser({
      userId: v.pet.userId,
      resourceId: v.id,
      resourceType: `VACCINE_${window}`,
      dueDate: v.nextDue,
      title: 'Lembrete de vacina 💉',
      body,
      data: { type: 'vaccine', petId: v.pet.id, vaccineId: v.id },
    });
    if (result === 'sent') sent++;
    else skipped++;
  }

  // Medications
  const medications = await prisma.medication.findMany({
    where: { active: true, nextDue: { gte: now, lte: in24h } },
    include: { pet: { select: { id: true, name: true, userId: true } } },
  });
  for (const m of medications) {
    const result = await sendToUser({
      userId: m.pet.userId,
      resourceId: m.id,
      resourceType: 'MEDICATION_24h',
      dueDate: m.nextDue,
      title: 'Hora da medicação 💊',
      body: `${m.name} para ${m.pet.name} em breve`,
      data: { type: 'medication', petId: m.pet.id, medicationId: m.id },
    });
    if (result === 'sent') sent++;
    else skipped++;
  }

  // Consultations
  const consultations = await prisma.consultation.findMany({
    where: { date: { gte: now, lte: in24h } },
    include: { pet: { select: { id: true, name: true, userId: true } } },
  });
  for (const c of consultations) {
    const result = await sendToUser({
      userId: c.pet.userId,
      resourceId: c.id,
      resourceType: 'CONSULTATION_24h',
      dueDate: c.date,
      title: 'Consulta amanhã 🩺',
      body: `${c.type || 'Consulta'} de ${c.pet.name}${c.clinic ? ` • ${c.clinic}` : ''}`,
      data: { type: 'consultation', petId: c.pet.id, consultationId: c.id },
    });
    if (result === 'sent') sent++;
    else skipped++;
  }

  return { sent, skipped, checkedAt: now.toISOString() };
}

async function sendToUser({ userId, resourceId, resourceType, dueDate, title, body, data }) {
  // Idempotency
  const existing = await prisma.pushSent.findUnique({
    where: {
      userId_resourceId_resourceType_dueDate: { userId, resourceId, resourceType, dueDate },
    },
  }).catch(() => null);
  if (existing) return 'skipped';

  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  if (!tokens.length) return 'skipped';

  for (const t of tokens) {
    await sendPush({ token: t.token, title, body, data });
  }

  await prisma.pushSent.create({
    data: { userId, resourceId, resourceType, dueDate },
  }).catch(() => {});
  return 'sent';
}

let intervalHandle = null;

export function startScheduler(intervalMs = 60 * 60 * 1000) {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    runPushCycle()
      .then((r) => console.log('[push] cycle:', r))
      .catch((e) => console.error('[push] cycle failed:', e));
  }, intervalMs);
  // Run once on startup after 30s
  setTimeout(() => {
    runPushCycle()
      .then((r) => console.log('[push] initial cycle:', r))
      .catch((e) => console.error('[push] initial cycle failed:', e));
  }, 30000);
  console.log(`[push] scheduler started (interval=${intervalMs}ms)`);
}

export function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
