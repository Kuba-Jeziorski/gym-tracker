import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useWeightUnit } from '../contexts/WeightUnitContext'
import { useUserProfile } from '../contexts/UserProfileContext'
import { kgToLb, lbToKg } from '../helpers/weightConversion'
import { cn } from '../lib/utils'
import { changeEmail } from '../services/authDb'
import { supabase } from '../services/supabaseClient'
import { ConfirmModal } from '../components/ConfirmModal'

type SaveUi = 'idle' | 'saving' | 'success' | 'error'
type PasswordUi = 'idle' | 'saving' | 'success' | 'error'
type EmailUi = 'idle' | 'saving' | 'success' | 'error'

export function User() {
  const { t } = useLanguage()
  const { user, signOut } = useAuth()
  const { weightUnit } = useWeightUnit()
  const {
    profile,
    setName,
    setWeightKg,
    setHeightCm,
    setGender,
    refreshProfileFromServer,
    saveProfileChanges,
  } = useUserProfile()

  const [saveUi, setSaveUi] = useState<SaveUi>('idle')
  const [saveError, setSaveError] = useState('')
  const saveSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordUi, setPasswordUi] = useState<PasswordUi>('idle')
  const [passwordError, setPasswordError] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [confirmNewEmail, setConfirmNewEmail] = useState('')
  const [emailUi, setEmailUi] = useState<EmailUi>('idle')
  const [emailError, setEmailError] = useState('')
  const [emailChangeConfirmed, setEmailChangeConfirmed] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteUi, setDeleteUi] = useState<'idle' | 'deleting' | 'error'>('idle')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    void refreshProfileFromServer()
  }, [refreshProfileFromServer])

  useEffect(() => {
    return () => {
      if (saveSuccessTimer.current) clearTimeout(saveSuccessTimer.current)
    }
  }, [])

  const passwordSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (passwordSuccessTimer.current) clearTimeout(passwordSuccessTimer.current)
    }
  }, [])

  const emailSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (emailSuccessTimer.current) clearTimeout(emailSuccessTimer.current)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash ?? ''
    if (!hash.includes('type=email_change')) return
    if (emailSuccessTimer.current) {
      clearTimeout(emailSuccessTimer.current)
      emailSuccessTimer.current = null
    }
    setEmailUi('success')
    setEmailError('')
    setEmailChangeConfirmed(true)
    window.history.replaceState(null, '', window.location.pathname)
    emailSuccessTimer.current = setTimeout(() => {
      setEmailUi('idle')
      emailSuccessTimer.current = null
    }, 4000)
  }, [])

  const handleSaveChanges = async () => {
    if (saveSuccessTimer.current) {
      clearTimeout(saveSuccessTimer.current)
      saveSuccessTimer.current = null
    }
    setSaveUi('saving')
    setSaveError('')
    const { ok, error } = await saveProfileChanges()
    if (ok) {
      setSaveUi('success')
      saveSuccessTimer.current = setTimeout(() => {
        setSaveUi('idle')
        saveSuccessTimer.current = null
      }, 2500)
    } else {
      setSaveUi('error')
      setSaveError(error ?? t('user_saveFailed'))
    }
  }

  const canSubmitPassword = useMemo(() => {
    if (!newPassword.trim() || !confirmNewPassword.trim()) return false
    return newPassword === confirmNewPassword
  }, [newPassword, confirmNewPassword])

  const currentEmail = user?.email ?? ''
  const pendingEmail = user?.new_email ?? ''

  const canSubmitEmail = useMemo(() => {
    const trimmed = newEmail.trim()
    const trimmedConfirm = confirmNewEmail.trim()
    if (!trimmed || !trimmedConfirm) return false
    if (trimmed === currentEmail) return false
    return trimmed === trimmedConfirm
  }, [newEmail, confirmNewEmail, currentEmail])

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim()
    const trimmedConfirm = confirmNewEmail.trim()
    if (!trimmed || !trimmedConfirm) {
      setEmailUi('error')
      setEmailError(t('auth_error_missingEmail'))
      return
    }
    if (trimmed !== trimmedConfirm) {
      setEmailUi('error')
      setEmailError(t('auth_error_emailMismatch'))
      return
    }
    if (trimmed === currentEmail) {
      setEmailUi('error')
      setEmailError(t('auth_error_sameEmail'))
      return
    }
    if (emailSuccessTimer.current) {
      clearTimeout(emailSuccessTimer.current)
      emailSuccessTimer.current = null
    }
    setEmailUi('saving')
    setEmailError('')
    setEmailChangeConfirmed(false)
    const { error } = await changeEmail(trimmed)
    if (error) {
      setEmailUi('error')
      setEmailError(error.message)
      return
    }
    setEmailUi('success')
    setNewEmail('')
    setConfirmNewEmail('')
    emailSuccessTimer.current = setTimeout(() => {
      setEmailUi('idle')
      emailSuccessTimer.current = null
    }, 5000)
  }

  const handleChangePassword = async () => {
    if (!canSubmitPassword) {
      setPasswordUi('error')
      setPasswordError(t('auth_error_passwordMismatch'))
      return
    }
    if (passwordSuccessTimer.current) {
      clearTimeout(passwordSuccessTimer.current)
      passwordSuccessTimer.current = null
    }
    setPasswordUi('saving')
    setPasswordError('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordUi('error')
      setPasswordError(error.message)
      return
    }
    setPasswordUi('success')
    setNewPassword('')
    setConfirmNewPassword('')
    passwordSuccessTimer.current = setTimeout(() => {
      setPasswordUi('idle')
      passwordSuccessTimer.current = null
    }, 2500)
  }

  const handleDeleteAccount = async () => {
    setDeleteUi('deleting')
    setDeleteError('')
    const { error } = await supabase.rpc('delete_current_user')
    if (error) {
      setDeleteUi('error')
      setDeleteError(error.message)
      return
    }
    await signOut()
  }

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

        <div className="space-y-6 max-w-3xl">
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

          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            <div className="md:flex-1">
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

            <div className="md:flex-1">
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

            <div className="md:flex-1">
              <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                {t('settings_genderHeading')}
              </label>
              <div className="flex gap-2 flex-wrap">
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

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleSaveChanges()}
              disabled={saveUi === 'saving'}
              className={cn(
                'w-fit rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
                'bg-brand-primary text-brand-bg hover:bg-brand-primary-hover',
                'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bg-soft',
                'disabled:opacity-60 disabled:pointer-events-none',
              )}
            >
              {saveUi === 'saving' ? t('user_saving') : t('user_saveChanges')}
            </button>
            {saveUi === 'success' && (
              <p className="text-sm text-brand-primary" role="status">
                {t('user_saved')}
              </p>
            )}
            {saveUi === 'error' && saveError && (
              <p className="text-sm text-red-400 max-w-xl" role="alert">
                {t('user_saveFailed')} {saveError}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-brand-dark mb-4">{t('user_accountHeading')}</h2>
        <div className="space-y-3 max-w-md">
          <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
            <h3 className="text-sm font-medium text-brand-dark mb-3">
              {t('user_changeEmail')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  {t('user_currentEmail')}
                </label>
                <p className="text-sm text-brand-text break-all">{currentEmail || '—'}</p>
              </div>
              {pendingEmail && (
                <p className="text-sm text-brand-text-muted" role="status">
                  {t('user_emailChangePending').replace('{email}', pendingEmail)}
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  {t('user_newEmail')}
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('auth_emailPlaceholder')}
                  className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  {t('user_confirmNewEmail')}
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={confirmNewEmail}
                  onChange={(e) => setConfirmNewEmail(e.target.value)}
                  placeholder={t('auth_emailPlaceholder')}
                  className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleChangeEmail()}
                disabled={emailUi === 'saving' || !canSubmitEmail}
                className={cn(
                  'w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  canSubmitEmail
                    ? 'bg-brand-primary text-brand-bg hover:bg-brand-primary-hover'
                    : 'border border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed',
                  'disabled:opacity-60 disabled:pointer-events-none',
                )}
              >
                {emailUi === 'saving' ? t('loading') : t('workoutEdit_save')}
              </button>
              {emailUi === 'success' && (
                <p className="text-sm text-brand-primary" role="status">
                  {emailChangeConfirmed
                    ? t('user_emailChangeConfirmed')
                    : t('user_emailChangeSuccess')}
                </p>
              )}
              {emailUi === 'error' && emailError && (
                <p className="text-sm text-red-400" role="alert">
                  {emailError}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
            <h3 className="text-sm font-medium text-brand-dark mb-3">
              {t('user_changePassword')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  {t('auth_newPassword')}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('auth_passwordPlaceholder')}
                  className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  {t('auth_confirmPassword')}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder={t('auth_passwordPlaceholder')}
                  className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleChangePassword()}
                disabled={passwordUi === 'saving' || !canSubmitPassword}
                className={cn(
                  'w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  canSubmitPassword
                    ? 'bg-brand-primary text-brand-bg hover:bg-brand-primary-hover'
                    : 'border border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed',
                  'disabled:opacity-60 disabled:pointer-events-none',
                )}
              >
                {passwordUi === 'saving' ? t('loading') : t('workoutEdit_save')}
              </button>
              {passwordUi === 'success' && (
                <p className="text-sm text-brand-primary" role="status">
                  {t('user_saved')}
                </p>
              )}
              {passwordUi === 'error' && passwordError && (
                <p className="text-sm text-red-400" role="alert">
                  {passwordError}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full rounded-lg border border-brand-border bg-brand-bg-soft px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors"
          >
            {t('user_logout')}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteUi('idle')
              setDeleteError('')
              setDeleteOpen(true)
            }}
            className="w-full rounded-lg border border-red-500/60 bg-brand-bg-soft px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {t('user_deleteAccount')}
          </button>
        </div>
      </section>

      <ConfirmModal
        open={deleteOpen}
        title={t('user_deleteAccount')}
        message={t('user_deleteAccountConfirm')}
        confirmLabel={deleteUi === 'deleting' ? t('loading') : t('common_yes')}
        cancelLabel={t('common_no')}
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => setDeleteOpen(false)}
        variant="danger"
      />
      {deleteUi === 'error' && deleteError && (
        <p className="text-sm text-red-400 mt-3 max-w-md" role="alert">
          {deleteError}
        </p>
      )}
    </div>
  )
}
