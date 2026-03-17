import { useLanguage } from '../contexts/LanguageContext'

export function PageLoader() {
  const { t } = useLanguage()
  return (
    <div className="min-h-[12rem] flex items-center justify-center">
      <span className="text-brand-text-muted text-sm">{t('loading')}</span>
    </div>
  )
}
