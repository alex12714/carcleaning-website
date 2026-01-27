import en from '@/locales/en.json';
import lv from '@/locales/lv.json';
import ru from '@/locales/ru.json';

export type Locale = 'en' | 'lv' | 'ru';

const translations: Record<Locale, typeof en> = { en, lv, ru };

export const getTranslation = (locale: Locale, key: string): string => {
  const keys = key.split('.');
  let value: unknown = translations[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = (value as Record<string, unknown>)[fallbackKey];
        } else {
          return key;
        }
      }
    }
  }
  
  return typeof value === 'string' ? value : key;
};

export const locales: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];
