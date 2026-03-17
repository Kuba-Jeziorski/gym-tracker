import { useLanguage } from '../contexts/LanguageContext'

export function Dashboard() {
  const { t } = useLanguage()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">{t('dashboard_title')}</h1>
      <p className="text-brand-text-muted">{t('dashboard_description')}</p>
    </div>
  )
}
