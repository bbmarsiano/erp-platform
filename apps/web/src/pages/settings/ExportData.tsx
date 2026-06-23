import { useState } from 'react'
import { Download, FileText, FileJson, Table, CheckCircle, Loader } from 'lucide-react'
import { api } from '../../lib/api'
import * as XLSX from 'xlsx'

type ExportFormat = 'json' | 'csv' | 'excel'

interface ExportSection {
  id: string
  label: string
  description: string
  icon: string
  dataKey: string
}

const SECTIONS: ExportSection[] = [
  {
    id: 'products',
    label: 'Продукти',
    icon: '📦',
    dataKey: 'products',
    description: 'Продуктов каталог с баркодове, цени и мерни единици'
  },
  {
    id: 'stock',
    label: 'Наличности',
    icon: '🏪',
    dataKey: 'stockItems',
    description: 'Текущи наличности по продукт и локация'
  },
  {
    id: 'movements',
    label: 'Складови движения',
    icon: '↕️',
    dataKey: 'stockMovements',
    description: 'Пълна история на всички входове, изходи и трансфери'
  },
  {
    id: 'receipts',
    label: 'Приходни документи',
    icon: '📥',
    dataKey: 'goodsReceipts',
    description: 'Всички приходни документи'
  },
  {
    id: 'issues',
    label: 'Изходни документи',
    icon: '📤',
    dataKey: 'goodsIssues',
    description: 'Всички изходни документи'
  },
  {
    id: 'suppliers',
    label: 'Доставчици',
    icon: '🚚',
    dataKey: 'suppliers',
    description: 'Регистър на доставчиците с контактна информация'
  },
  {
    id: 'purchaseOrders',
    label: 'Поръчки покупка',
    icon: '🛒',
    dataKey: 'purchaseOrders',
    description: 'Всички поръчки към доставчици'
  },
  {
    id: 'deliveries',
    label: 'Доставки',
    icon: '📫',
    dataKey: 'deliveries',
    description: 'История на получените доставки'
  },
  {
    id: 'boms',
    label: 'Рецептури (BOM)',
    icon: '🏭',
    dataKey: 'billsOfMaterials',
    description: 'Производствени рецептури и компоненти'
  },
  {
    id: 'workOrders',
    label: 'Производствени нареждания',
    icon: '⚙️',
    dataKey: 'workOrders',
    description: 'История на производствените нареждания'
  },
  {
    id: 'sales',
    label: 'Продажби',
    icon: '💰',
    dataKey: 'sales',
    description: 'Всички продажби от касовите терминали'
  },
  {
    id: 'users',
    label: 'Потребители',
    icon: '👥',
    dataKey: 'users',
    description: 'Потребителски акаунти (без пароли)'
  },
  {
    id: 'warehouses',
    label: 'Складове',
    icon: '🏢',
    dataKey: 'warehouses',
    description: 'Складове и локации'
  }
]

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.keys(obj).reduce((acc: Record<string, unknown>, key) => {
    const fullKey = prefix ? `${prefix}_${key}` : key
    const val = obj[key]
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      Object.assign(acc, flattenObject(val as Record<string, unknown>, fullKey))
    } else {
      acc[fullKey] = val instanceof Date ? val.toISOString() : val
    }
    return acc
  }, {})
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return ''
  const flat = data.map((row) => flattenObject(row))
  const headers = Array.from(new Set(flat.flatMap((r) => Object.keys(r))))
  const rows = flat.map((row) =>
    headers
      .map((h) => {
        const v = row[h]
        if (v === null || v === undefined) return ''
        const s = String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      })
      .join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export default function ExportData() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('excel')
  const [selected, setSelected] = useState<Set<string>>(new Set(SECTIONS.map((s) => s.id)))
  const [progress, setProgress] = useState('')

  const toggleSection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(SECTIONS.map((s) => s.id)))
  const deselectAll = () => setSelected(new Set())

  const handleExport = async () => {
    setLoading(true)
    setDone(false)
    setProgress('Извличане на данни...')

    try {
      const res = await api.get('/api/export/all')
      const exportData = res.data.data
      const { data } = exportData

      setProgress('Генериране на файл...')

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
      const filename = `dflow-export-${timestamp}`

      if (format === 'json') {
        const filtered: {
          exportedAt: string
          version: string
          format: string
          tenant: unknown
          data: Record<string, unknown>
          counts: Record<string, number>
        } = {
          exportedAt: exportData.exportedAt,
          version: exportData.version,
          format: exportData.format,
          tenant: exportData.tenant,
          data: {},
          counts: {}
        }
        SECTIONS.filter((s) => selected.has(s.id)).forEach((s) => {
          filtered.data[s.dataKey] = data[s.dataKey] || []
          filtered.counts[s.dataKey] = (data[s.dataKey] || []).length
        })
        if (selected.has('warehouses')) {
          filtered.data.locations = data.locations || []
          filtered.counts.locations = (data.locations || []).length
        }
        if (selected.has('boms')) {
          filtered.data.bomItems = data.bomItems || []
          filtered.counts.bomItems = (data.bomItems || []).length
        }
        if (selected.has('receipts')) {
          filtered.data.goodsReceiptLines = data.goodsReceiptLines || []
        }
        if (selected.has('issues')) {
          filtered.data.goodsIssueLines = data.goodsIssueLines || []
        }
        if (selected.has('purchaseOrders')) {
          filtered.data.purchaseOrderLines = data.purchaseOrderLines || []
        }
        if (selected.has('deliveries')) {
          filtered.data.deliveryLines = data.deliveryLines || []
        }
        if (selected.has('sales')) {
          filtered.data.saleLines = data.saleLines || []
        }
        if (selected.has('workOrders')) {
          filtered.data.materialConsumptions = data.materialConsumptions || []
        }

        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        const parts: string[] = [`# DFlowERP Export — ${exportData.exportedAt}`, '']
        SECTIONS.filter((s) => selected.has(s.id)).forEach((s) => {
          const rows = (data[s.dataKey] || []) as Record<string, unknown>[]
          if (rows.length === 0) return
          parts.push(`### ${s.label} (${rows.length} записа)`)
          parts.push(convertToCSV(rows))
          parts.push('')
        })
        const blob = new Blob(['\uFEFF' + parts.join('\n')], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'excel') {
        const wb = XLSX.utils.book_new()

        const summaryData = [
          ['DFlowERP — Пълен експорт на данни'],
          ['Дата на експорт:', exportData.exportedAt],
          ['Версия:', exportData.version],
          ['Фирма:', exportData.tenant?.name || ''],
          ['ЕИК:', exportData.tenant?.eik || ''],
          [],
          ['Секция', 'Брой записи'],
          ...SECTIONS.filter((s) => selected.has(s.id)).map((s) => [
            s.label,
            (data[s.dataKey] || []).length
          ])
        ]
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
        summaryWs['!cols'] = [{ wch: 30 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Обобщение')

        SECTIONS.filter((s) => selected.has(s.id)).forEach((s) => {
          const rows = (data[s.dataKey] || []) as Record<string, unknown>[]
          const sheetName = s.label.substring(0, 31)
          if (rows.length === 0) {
            const ws = XLSX.utils.aoa_to_sheet([['Няма данни']])
            XLSX.utils.book_append_sheet(wb, ws, sheetName)
            return
          }
          const flat = rows.map((r) => flattenObject(r))
          const ws = XLSX.utils.json_to_sheet(flat)
          XLSX.utils.book_append_sheet(wb, ws, sheetName)
        })

        if (selected.has('warehouses') && (data.locations || []).length > 0) {
          const flat = (data.locations as Record<string, unknown>[]).map((r) => flattenObject(r))
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat), 'Локации')
        }

        XLSX.writeFile(wb, `${filename}.xlsx`)
      }

      setDone(true)
      setProgress('')
    } catch (err) {
      console.error('Export failed:', err)
      setProgress('Грешка при експорт. Опитайте отново.')
    } finally {
      setLoading(false)
      setTimeout(() => setDone(false), 5000)
    }
  }

  const formatOptions = [
    {
      id: 'excel',
      label: 'Excel (.xlsx)',
      icon: <Table size={16} />,
      desc: 'Отделен лист за всяка секция. Препоръчан.'
    },
    {
      id: 'json',
      label: 'JSON',
      icon: <FileJson size={16} />,
      desc: 'Машинно-четим формат. За разработчици и API интеграции.'
    },
    {
      id: 'csv',
      label: 'CSV',
      icon: <FileText size={16} />,
      desc: 'Универсален формат. Съвместим с всяко ERP.'
    }
  ]

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
      <style>{`@keyframes dflow-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
          Експорт на данни
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Експортирайте всички ваши данни в избран формат. Съвместимо с SAP, Odoo и всяко друго ERP.
        </p>
      </div>

      <div
        style={{
          padding: '10px 14px',
          marginBottom: 20,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 8,
          fontSize: 12,
          color: '#166534',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8
        }}
      >
        <span>✅</span>
        <span>
          <strong>GDPR Чл. 20 — Право на преносимост на данни.</strong> Вашите данни са ваши. Можете
          да ги експортирате по всяко време в стандартен машинно-четим формат.
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
          1. Изберете формат
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {formatOptions.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id as ExportFormat)}
              style={{
                flex: 1,
                padding: '12px 14px',
                textAlign: 'left',
                border: `2px solid ${format === f.id ? '#7c3aed' : '#e5e7eb'}`,
                borderRadius: 10,
                cursor: 'pointer',
                background: format === f.id ? '#f5f3ff' : 'white',
                transition: 'all 0.15s'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: format === f.id ? '#7c3aed' : '#374151',
                  marginBottom: 4
                }}
              >
                {f.icon} {f.label}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            2. Изберете секции ({selected.size} от {SECTIONS.length})
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={selectAll}
              style={{
                fontSize: 11,
                padding: '4px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                cursor: 'pointer',
                background: 'white',
                color: '#374151'
              }}
            >
              Всички
            </button>
            <button
              type="button"
              onClick={deselectAll}
              style={{
                fontSize: 11,
                padding: '4px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                cursor: 'pointer',
                background: 'white',
                color: '#374151'
              }}
            >
              Изчисти
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SECTIONS.map((s) => (
            <label
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                border: `1px solid ${selected.has(s.id) ? '#c4b5fd' : '#e5e7eb'}`,
                background: selected.has(s.id) ? '#faf5ff' : 'white',
                transition: 'all 0.15s'
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={() => toggleSection(s.id)}
                style={{
                  marginTop: 2,
                  width: 14,
                  height: 14,
                  accentColor: '#7c3aed',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {s.icon} {s.label}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
        {progress && (
          <div
            style={{
              fontSize: 13,
              color: '#7c3aed',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Loader size={14} style={{ animation: 'dflow-spin 1s linear infinite' }} />
            {progress}
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={loading || selected.size === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            background: done ? '#059669' : loading ? '#9ca3af' : '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            cursor: loading || selected.size === 0 ? 'not-allowed' : 'pointer',
            boxShadow: done || loading ? 'none' : '0 4px 12px rgba(124,58,237,0.3)',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
        >
          {done ? (
            <>
              <CheckCircle size={18} /> Файлът е свален!
            </>
          ) : loading ? (
            <>
              <Loader size={18} style={{ animation: 'dflow-spin 1s linear infinite' }} /> Генериране...
            </>
          ) : (
            <>
              <Download size={18} /> Експортирай {selected.size} секции
            </>
          )}
        </button>
        {selected.size === 0 && (
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
            Изберете поне една секция за експорт.
          </div>
        )}
      </div>
    </div>
  )
}
