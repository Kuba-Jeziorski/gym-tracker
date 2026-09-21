import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ConfirmModal } from '../components/ConfirmModal'
import { useLanguage } from '../contexts/LanguageContext'
import { useWeightLogs } from '../contexts/WeightLogsContext'
import { useWeightUnit } from '../contexts/WeightUnitContext'
import {
  formatWeightDate,
  localDateInputValue,
} from '../helpers/weightMeasurements'
import { kgToLb, lbToKg } from '../helpers/weightConversion'
import { cn } from '../lib/utils'

type ChartPoint = {
  dateLabel: string
  value: number
}

function formatChartNumber(value: number): number {
  return value % 1 === 0 ? value : Math.round(value * 10) / 10
}

function displayWeight(kg: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? formatChartNumber(kgToLb(kg)) : formatChartNumber(kg)
}

export function WeightTracking() {
  const { t } = useLanguage()
  const { weightUnit } = useWeightUnit()
  const { measurements, isLoading, saveMeasurement, deleteMeasurement } = useWeightLogs()
  const [date, setDate] = useState(localDateInputValue())
  const [weightInput, setWeightInput] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteDate, setDeleteDate] = useState<string | null>(null)

  const weightUnitLabel = t(weightUnit === 'kg' ? 'unit_kg' : 'unit_lb')
  const today = localDateInputValue()

  const chartData = useMemo(
    (): ChartPoint[] =>
      measurements.map((item) => ({
        dateLabel: formatWeightDate(item.date),
        value: displayWeight(item.weightKg, weightUnit),
      })),
    [measurements, weightUnit],
  )

  const history = useMemo(
    () => [...measurements].sort((a, b) => b.date.localeCompare(a.date)),
    [measurements],
  )

  const handleSave = async () => {
    setSaveError('')
    const parsed = parseFloat(weightInput.replace(',', '.'))
    if (!date || date > today) {
      setSaveError(t('weight_invalidDate'))
      return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setSaveError(t('weight_invalidWeight'))
      return
    }
    const weightKg = weightUnit === 'lb' ? lbToKg(parsed) : parsed
    setSaving(true)
    try {
      await saveMeasurement(date, Math.round(weightKg * 100) / 100)
      setWeightInput('')
    } catch {
      setSaveError(t('weight_saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteDate) return
    try {
      await deleteMeasurement(deleteDate)
    } finally {
      setDeleteDate(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">{t('weight_title')}</h1>
      <p className="text-brand-text-muted mb-8">{t('weight_description')}</p>

      <section className="mb-10 max-w-xl">
        <h2 className="text-lg font-medium text-brand-dark mb-4">{t('weight_addHeading')}</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="sm:flex-1">
            <label className="block text-sm font-medium text-brand-text-muted mb-1.5" htmlFor="weight-date">
              {t('weight_dateLabel')}
            </label>
            <input
              id="weight-date"
              type="date"
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-muted mb-1.5" htmlFor="weight-value">
              {t('weight_valueLabel')}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="weight-value"
                type="number"
                inputMode="decimal"
                min={0}
                step={weightUnit === 'kg' ? 0.1 : 0.5}
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={t('weight_valuePlaceholder')}
                className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder w-28"
              />
              <span className="text-brand-text-muted text-sm">{weightUnitLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              'bg-brand-primary text-brand-bg hover:bg-brand-primary-hover',
              saving && 'opacity-70 pointer-events-none',
            )}
          >
            {saving ? t('loading') : t('weight_save')}
          </button>
        </div>
        {saveError ? <p className="mt-3 text-sm text-red-500">{saveError}</p> : null}
        <p className="mt-3 text-sm text-brand-text-muted">{t('weight_pastDaysHint')}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-medium text-brand-dark mb-4">{t('weight_chartHeading')}</h2>
        {isLoading ? (
          <p className="text-brand-text-muted text-sm">{t('loading')}</p>
        ) : chartData.length < 1 ? (
          <p className="text-brand-text-muted text-sm">{t('weight_chartEmpty')}</p>
        ) : (
          <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
            <div className="overflow-x-auto sm:overflow-x-visible">
              <div className="h-72 min-w-[550px] w-[550px] sm:w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                    <CartesianGrid stroke="var(--brand-border)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="dateLabel"
                      stroke="var(--brand-text-muted)"
                      tick={{ fill: 'var(--brand-text-muted)', fontSize: 12 }}
                      tickMargin={8}
                    />
                    <YAxis
                      stroke="var(--brand-text-muted)"
                      tick={{ fill: 'var(--brand-text-muted)', fontSize: 12 }}
                      tickMargin={8}
                      width={72}
                      unit={` ${weightUnitLabel}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const point = payload[0].payload as ChartPoint
                        return (
                          <div className="rounded-lg border border-brand-border bg-brand-bg-soft px-3 py-2 text-sm shadow-sm">
                            <p className="text-brand-text-muted mb-1">{label}</p>
                            <p className="font-medium text-brand-text">
                              {point.value} {weightUnitLabel}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--brand-primary)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--brand-primary)', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-brand-dark mb-4">{t('weight_historyHeading')}</h2>
        {isLoading ? (
          <p className="text-brand-text-muted text-sm">{t('loading')}</p>
        ) : history.length === 0 ? (
          <p className="text-brand-text-muted text-sm">{t('weight_historyEmpty')}</p>
        ) : (
          <ul className="space-y-2 max-w-xl">
            {history.map((item) => (
              <li
                key={item.date}
                className="rounded-xl border border-brand-border bg-brand-bg-soft px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-brand-dark">{formatWeightDate(item.date)}</p>
                  <p className="text-sm text-brand-text-muted">
                    {displayWeight(item.weightKg, weightUnit)} {weightUnitLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteDate(item.date)}
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-sm font-medium text-brand-text-muted hover:bg-brand-bg hover:text-brand-text transition-colors"
                >
                  {t('weight_delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmModal
        open={deleteDate != null}
        title={t('weight_deleteTitle')}
        message={t('weight_deleteMessage')}
        confirmLabel={t('weight_delete')}
        cancelLabel={t('weight_cancel')}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteDate(null)}
      />
    </div>
  )
}
