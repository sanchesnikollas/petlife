const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let posthog = null;
let initialized = false;
let optedOut = false;

function getOptOut() {
  try { return localStorage.getItem('petlife_analytics_opt_out') === 'true'; } catch { return false; }
}

export function setAnalyticsOptOut(value) {
  optedOut = value;
  try { localStorage.setItem('petlife_analytics_opt_out', String(value)); } catch { /* */ }
  if (posthog) {
    if (value) posthog.opt_out_capturing();
    else posthog.opt_in_capturing();
  }
}

export function isAnalyticsOptedOut() {
  return optedOut;
}

export async function initAnalytics() {
  if (initialized || !POSTHOG_KEY) return;
  initialized = true;
  optedOut = getOptOut();
  try {
    const { default: PostHog } = await import('posthog-js');
    posthog = PostHog;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: true,
      persistence: 'localStorage',
    });
    if (optedOut) posthog.opt_out_capturing();
  } catch (e) {
    console.warn('[analytics] PostHog init failed:', e.message);
  }
}

export function identify(userId, props = {}) {
  if (optedOut || !posthog) return;
  posthog.identify(userId, props);
}

export function track(event, props = {}) {
  if (optedOut || !posthog) return;
  posthog.capture(event, props);
}

export function reset() {
  if (posthog) posthog.reset();
}
