import { isNative } from './platform.js';

let Preferences = null;

async function getPreferences() {
  if (Preferences) return Preferences;
  if (isNative()) {
    const mod = await import('@capacitor/preferences');
    Preferences = mod.Preferences;
    return Preferences;
  }
  return null;
}

export async function getItem(key) {
  const prefs = await getPreferences();
  if (prefs) {
    const { value } = await prefs.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

export async function setItem(key, value) {
  const prefs = await getPreferences();
  if (prefs) {
    await prefs.set({ key, value: String(value) });
    return;
  }
  localStorage.setItem(key, value);
}

export async function removeItem(key) {
  const prefs = await getPreferences();
  if (prefs) {
    await prefs.remove({ key });
    return;
  }
  localStorage.removeItem(key);
}

export function getItemSync(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function setItemSync(key, value) {
  try { localStorage.setItem(key, value); } catch { /* */ }
}

export function removeItemSync(key) {
  try { localStorage.removeItem(key); } catch { /* */ }
}
