import { cn } from '../lib/utils'

type ConfirmModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl border border-brand-border bg-brand-bg-soft p-6 shadow-lg'
        )}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-brand-dark mb-2">
          {title}
        </h2>
        <p className="text-brand-text-muted text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              variant === 'danger'
                ? 'bg-red-600/90 text-white hover:bg-red-600'
                : 'bg-brand-primary text-brand-bg hover:bg-brand-primary-hover'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
