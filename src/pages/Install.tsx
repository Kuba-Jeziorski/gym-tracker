import { useLanguage } from '../contexts/LanguageContext'

export function Install() {
  const { t } = useLanguage()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">{t('install_title')}</h1>
      <p className="text-brand-text-muted">{t('install_description')}</p>
    </div>
  )
}
