import { Link } from 'react-router-dom'
import { routes } from '../routes'
import { useLanguage } from '../contexts/LanguageContext'

export function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-semibold text-brand-dark mb-2">{t('notFound_title')}</h1>
      <p className="text-brand-text-muted mb-6">{t('notFound_message')}</p>
      <Link
        to={routes.dashboard}
        className="text-brand-primary hover:text-brand-primary-hover font-medium transition-colors duration-300"
      >
        {t('notFound_back')}
      </Link>
    </div>
  )
}
