// Firebase Cloud Messaging integration.
// In dev, if no credentials are configured, fall back to console logging.
// In production, FCM_SERVICE_ACCOUNT_JSON must be a base64-encoded JSON service account.

let admin = null;
let app = null;
let initialized = false;
let available = false;

async function init() {
  if (initialized) return;
  initialized = true;

  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.log('[fcm] FCM_SERVICE_ACCOUNT_JSON not set — push notifications will be logged only.');
    return;
  }

  try {
    const module = await import('firebase-admin');
    admin = module.default || module;
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decoded);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    available = true;
    console.log('[fcm] Initialized.');
  } catch (e) {
    console.warn('[fcm] Initialization failed:', e.message);
  }
}

export async function sendPush({ token, title, body, data = {} }) {
  await init();
  if (!available) {
    console.log(`[fcm:dry-run] token=${token?.slice(0, 8)}... title="${title}" body="${body}"`);
    return { success: true, dryRun: true };
  }
  try {
    const res = await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: 'high',
        notification: { channelId: 'petlife-reminders' },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });
    return { success: true, messageId: res };
  } catch (e) {
    return { success: false, error: e.message, code: e.code };
  }
}

export async function sendMulticast({ tokens, title, body, data = {} }) {
  const results = await Promise.all(
    tokens.map((token) => sendPush({ token, title, body, data }))
  );
  const failed = results.filter((r) => !r.success);
  return { total: tokens.length, failed: failed.length, results };
}
