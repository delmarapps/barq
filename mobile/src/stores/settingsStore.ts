import { create } from 'zustand';
import { I18nManager } from 'react-native';
import i18n from '../i18n';

interface SettingsState {
  language: 'en' | 'ar';
  isRTL:    boolean;
  setLanguage: (lang: 'en' | 'ar') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  isRTL:    false,

  setLanguage: (lang) => {
    const rtl = lang === 'ar';
    i18n.changeLanguage(lang);
    I18nManager.forceRTL(rtl);
    set({ language: lang, isRTL: rtl });
  },
}));
