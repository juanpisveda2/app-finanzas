import AsyncStorage from '@react-native-async-storage/async-storage';

import { Settings } from '../../domain/models';

const SETTINGS_KEY = 'settings_v1';
const PIN_KEY = 'pin_hash_v1';
const DEFAULT_SETTINGS: Settings = {
  currency: 'ARS',
  darkMode: false,
  createdAt: new Date().toISOString(),
};

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: Partial<Settings>) {
  const current = await getSettings();
  const merged = { ...current, ...next };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

export async function getPinHash() {
  return AsyncStorage.getItem(PIN_KEY);
}

export async function setPinHash(pin: string) {
  const hash = hashPin(pin);
  await AsyncStorage.setItem(PIN_KEY, hash);
  return hash;
}

export async function clearPinHash() {
  await AsyncStorage.removeItem(PIN_KEY);
}

export async function verifyPin(pin: string) {
  const stored = await getPinHash();
  if (!stored) {
    return false;
  }
  return stored === hashPin(pin);
}

export function hashPin(pin: string) {
  const salt = 'finanzas_v1';
  const input = `${pin}|${salt}`;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `v1_${hash}`;
}
