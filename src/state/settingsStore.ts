import { create } from 'zustand';

import { Settings } from '../domain/models';
import {
  clearPinHash,
  getPinHash,
  getSettings,
  saveSettings,
  setPinHash,
  verifyPin,
} from '../data/storage/settingsStorage';

type SettingsState = {
  settings: Settings;
  loading: boolean;
  pinHash: string | null;
  pinVerified: boolean;
  load: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  setDarkMode: (value: boolean) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  clearPin: () => Promise<void>;
  lock: () => void;
};

const fallbackSettings: Settings = {
  currency: 'ARS',
  darkMode: false,
  createdAt: new Date().toISOString(),
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: fallbackSettings,
  loading: true,
  pinHash: null,
  pinVerified: false,
  load: async () => {
    const [settings, pinHash] = await Promise.all([getSettings(), getPinHash()]);
    set({ settings, pinHash, loading: false });
  },
  toggleDarkMode: async () => {
    const current = get().settings.darkMode;
    const settings = await saveSettings({ darkMode: !current });
    set({ settings });
  },
  setDarkMode: async (value) => {
    const settings = await saveSettings({ darkMode: value });
    set({ settings });
  },
  setPin: async (pin) => {
    const pinHash = await setPinHash(pin);
    set({ pinHash, pinVerified: true });
  },
  verifyPin: async (pin) => {
    const isValid = await verifyPin(pin);
    if (isValid) {
      set({ pinVerified: true });
    }
    return isValid;
  },
  clearPin: async () => {
    await clearPinHash();
    set({ pinHash: null, pinVerified: true });
  },
  lock: () => set({ pinVerified: false }),
}));
