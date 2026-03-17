import { useLanguage } from '../contexts/LanguageContext'
import { useWeightUnit } from '../contexts/WeightUnitContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { cn } from '../lib/utils'

export function Settings() {
  const { t } = useLanguage()
  const { weightUnit, setWeightUnit } = useWeightUnit()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">{t('settings_title')}</h1>
      <p className="text-brand-text-muted mb-8">{t('settings_description')}</p>

      <h2 className="text-lg font-medium text-brand-dark mb-3">{t('settings_languageHeading')}</h2>
      <LanguageSwitcher />

      <h2 className="text-lg font-medium text-brand-dark mt-8 mb-3">{t('settings_weightUnit')}</h2>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setWeightUnit('kg')}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            weightUnit === 'kg'
              ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
              : 'border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft'
          )}
        >
          {t('unit_kg')}
        </button>
        <button
          type="button"
          onClick={() => setWeightUnit('lb')}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            weightUnit === 'lb'
              ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
              : 'border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft'
          )}
        >
          {t('unit_lb')}
        </button>
      </div>
    </div>
  )
}
