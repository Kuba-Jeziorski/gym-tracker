import { useLanguage } from '../contexts/LanguageContext'
import { useMobileFontSizeMode } from '../contexts/AccountPreferencesContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { cn } from '../lib/utils'

export function Settings() {
  const { t } = useLanguage()
  const { mobileFontSizeMode, setMobileFontSizeMode } = useMobileFontSizeMode()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">{t('settings_title')}</h1>
      <p className="text-brand-text-muted mb-8">{t('settings_description')}</p>

      <h2 className="text-lg font-medium text-brand-dark mb-3">{t('settings_languageHeading')}</h2>
      <LanguageSwitcher />

      <h2 className="text-lg font-medium text-brand-dark mt-8 mb-3">
        {t('settings_mobileFontSizeHeading')}
      </h2>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMobileFontSizeMode('standard')}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            mobileFontSizeMode === 'standard'
              ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
              : 'border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft'
          )}
        >
          {t('settings_mobileFontSizeStandard')}
        </button>
        <button
          type="button"
          onClick={() => setMobileFontSizeMode('enlarged')}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            mobileFontSizeMode === 'enlarged'
              ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
              : 'border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft'
          )}
        >
          {t('settings_mobileFontSizeEnlarged')}
        </button>
      </div>
    </div>
  )
}
