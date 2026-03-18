import { useLanguage } from '../contexts/LanguageContext'
import type { Locale } from '../i18n/translations'
import { cn } from '../lib/utils'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div className="flex gap-2" role="group" aria-label={t('settings_languageHeading')}>
      {(['en', 'pl'] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc as Locale)}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            locale === loc
              ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
              : 'border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft'
          )}
        >
          {t(loc === 'en' ? 'lang_en' : 'lang_pl')}
        </button>
      ))}
    </div>
  )
}
