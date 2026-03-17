import { useLanguage } from '../contexts/LanguageContext'
import { useWeightUnit } from '../contexts/WeightUnitContext'
import { useUserProfile } from '../contexts/UserProfileContext'
import { kgToLb, lbToKg } from '../helpers/weightConversion'
import { cn } from '../lib/utils'

export function User() {
  const { t } = useLanguage()
  const { weightUnit } = useWeightUnit()
  const { profile, setName, setWeightKg, setHeightCm, setGender } = useUserProfile()

  const weightDisplayValue =
    profile.weightKg != null
      ? weightUnit === 'lb'
        ? (kgToLb(profile.weightKg) % 1 === 0
            ? kgToLb(profile.weightKg).toString()
            : kgToLb(profile.weightKg).toFixed(1))
        : profile.weightKg.toString()
      : ''

  const handleWeightChange = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') {
      setWeightKg(null)
      return
    }
    const num = parseFloat(trimmed)
    if (!Number.isNaN(num) && num >= 0) {
      const kg = weightUnit === 'lb' ? lbToKg(num) : num
      setWeightKg(kg)
    }
  }

  const handleHeightChange = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') {
      setHeightCm(null)
      return
    }
    const num = parseFloat(trimmed)
    if (!Number.isNaN(num) && num >= 0) {
      setHeightCm(num)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">{t('user_title')}</h1>
      <p className="text-brand-text-muted mb-8">{t('user_description')}</p>

      <section className="mb-10">
        <h2 className="text-lg font-medium text-brand-dark mb-4">{t('user_profileHeading')}</h2>

        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
              {t('settings_nameHeading')}
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings_namePlaceholder')}
              className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
              {t('settings_weightHeading')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={weightUnit === 'kg' ? 0.5 : 1}
                value={weightDisplayValue}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder={t('settings_weightPlaceholder')}
                className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder w-28"
              />
              <span className="text-brand-text-muted text-sm">
                {t(weightUnit === 'kg' ? 'unit_kg' : 'unit_lb')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
              {t('settings_heightHeading')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                value={profile.heightCm ?? ''}
                onChange={(e) => handleHeightChange(e.target.value)}
                placeholder={t('settings_heightPlaceholder')}
                className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder w-28"
              />
              <span className="text-brand-text-muted text-sm">{t('unit_cm')}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
              {t('settings_genderHeading')}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender(profile.gender === 'male' ? null : 'male')}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  profile.gender === 'male'
                    ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
                    : 'border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft',
                )}
              >
                {t('settings_genderMale')}
              </button>
              <button
                type="button"
                onClick={() => setGender(profile.gender === 'female' ? null : 'female')}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  profile.gender === 'female'
                    ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
                    : 'border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft',
                )}
              >
                {t('settings_genderFemale')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
