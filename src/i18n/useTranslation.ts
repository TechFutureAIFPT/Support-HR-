import { useUserSettings } from '@/context/settings/UserSettingsProvider';
import { translations, type TranslationKey, type Locale } from '@/i18n/translations';

export function useTranslation() {
  const { settings } = useUserSettings();
  const locale = (settings.ui.language ?? 'vi-VN') as Locale;
  const dict = translations[locale] ?? translations['vi-VN'];

  function t(key: TranslationKey): string {
    return dict[key] ?? translations['vi-VN'][key] ?? key;
  }

  return { t, locale };
}
