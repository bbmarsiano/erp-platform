import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton, Button, PageHeader } from '../../../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import { WarehouseSelector } from '../components/WarehouseSelector'
import {
  useCancelIssue,
  useConfirmIssue,
  useIssue,
  useStock,
  useUpdateIssueDraft,
  useWarehouseLocations
} from '../hooks/useWms'

type IssueLine = {
  productId: string
  locationId: string
  quantity: number
  lotNumber?: string
}

export default function IssueDetail() {
  const { id } = useParams()
  const issueId = id ?? ''
  const navigate = useNavigate()

  const issueQuery = useIssue(issueId)
  const updateDraft = useUpdateIssueDraft()
  const confirm = useConfirmIssue()
  const cancel = useCancelIssue()

  const issue = issueQuery.data as any | undefined
  const warehouseId = issue?.warehouseId as string | undefined

  const locationsQuery = useWarehouseLocations(warehouseId)
  const stockQuery = useStock(warehouseId)

  const [newLine, setNewLine] = useState<IssueLine>({ productId: '', locationId: '', quantity: 1, lotNumber: '' })
  const [localLines, setLocalLines] = useState<IssueLine[] | null>(null)

  const lines: IssueLine[] = useMemo(() => {
    const apiLines = (issue?.lines ?? []) as Array<any>
    const base = apiLines.map((l) => ({
      productId: l.productId,
      locationId: l.locationId,
      quantity: l.quantity,
      lotNumber: l.lotNumber ?? undefined
    }))
    return localLines ?? base
  }, [issue?.lines, localLines])

  const products = useMemo(() => {
    const stock = (stockQuery.data ?? []) as Array<any>
    const map = new Map<string, { id: string; code?: string; name?: string; available?: number }>()
    for (const s of stock) {
      if (!s.product?.id) continue
      const prev = map.get(s.product.id)
      const available = (prev?.available ?? 0) + (s.quantity ?? 0)
      map.set(s.product.id, { id: s.product.id, code: s.product.code, name: s.product.name, available })
    }
    return Array.from(map.values())
  }, [stockQuery.data])

  const locations = useMemo(() => {
    const locs = (locationsQuery.data ?? []) as Array<any>
    return locs.map((l) => ({ id: l.id, code: l.code, name: l.name }))
  }, [locationsQuery.data])

  const addLine = () => {
    if (!newLine.productId || !newLine.locationId || !newLine.quantity || newLine.quantity <= 0) return
    setLocalLines((prev) => [...(prev ?? lines), { ...newLine, lotNumber: newLine.lotNumber?.trim() || undefined }])
    setNewLine({ productId: '', locationId: '', quantity: 1, lotNumber: '' })
  }

  const saveDraft = async () => {
    await updateDraft.mutateAsync({ id: issueId, lines })
    setLocalLines(null)
  }

  const onConfirm = async () => {
    await confirm.mutateAsync(issueId)
  }

  const onCancel = async () => {
    await cancel.mutateAsync(issueId)
    navigate('/wms/issues')
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <BackButton to="/wms/issues" />
      <PageHeader title="Експедиция" subtitle={issue?.issueNo ? issue.issueNo : undefined} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>Склад</div>
          <div style={{ marginTop: 8 }}>
            <WarehouseSelector value={warehouseId} onChange={() => {}} disabled />
          </div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>Статус</div>
          <div style={{ marginTop: 8 }}>{issue?.status ? <StatusBadge status={issue.status} /> : '—'}</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>Дата</div>
          <div style={{ marginTop: 8, color: '#111827' }}>
            {issue?.createdAt ? new Date(issue.createdAt).toLocaleString('bg-BG') : '—'}
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>Редове</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {issue?.status === 'DRAFT' ? (
              <>
                <Button variant="secondary" onClick={saveDraft} disabled={updateDraft.isPending}>
                  {updateDraft.isPending ? 'Запис...' : 'Запази'}
                </Button>
                <Button onClick={onConfirm} disabled={confirm.isPending || lines.length === 0}>
                  Потвърди
                </Button>
                <Button variant="danger" onClick={onCancel} disabled={cancel.isPending}>
                  Анулирай
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Артикул</th>
              <th style={{ padding: 10 }}>Локация</th>
              <th style={{ padding: 10 }}>Количество</th>
              <th style={{ padding: 10 }}>Партида</th>
            </tr>
          </thead>
          <tbody>
            {issueQuery.isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: 12, color: '#6b7280' }}>
                  Зареждане...
                </td>
              </tr>
            ) : lines.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 12, color: '#6b7280' }}>
                  Няма редове
                </td>
              </tr>
            ) : (
              lines.map((l, idx) => (
                <tr key={`${l.productId}-${l.locationId}-${idx}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 10, fontFamily: 'monospace' }}>{l.productId}</td>
                  <td style={{ padding: 10, fontFamily: 'monospace' }}>{l.locationId}</td>
                  <td style={{ padding: 10, fontWeight: 700 }}>{l.quantity}</td>
                  <td style={{ padding: 10 }}>{l.lotNumber ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {issue?.status === 'DRAFT' ? (
          <div style={{ marginTop: 14, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Добави ред</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 1fr auto', gap: 10, alignItems: 'end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
                Артикул (наличност)
                <select
                  value={newLine.productId}
                  onChange={(e) => setNewLine((p) => ({ ...p, productId: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8', background: '#fff' }}
                >
                  <option value="">{products.length ? 'Изберете артикул' : 'Няма наличности за избор'}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} — ${p.name ?? p.id}` : p.id} ({p.available ?? 0})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
                Локация
                <select
                  value={newLine.locationId}
                  onChange={(e) => setNewLine((p) => ({ ...p, locationId: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8', background: '#fff' }}
                >
                  <option value="">{locationsQuery.isLoading ? 'Зареждане...' : 'Изберете локация'}</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} — {l.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
                Количество
                <input
                  type="number"
                  min={0}
                  value={newLine.quantity}
                  onChange={(e) => setNewLine((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
                Партида (по избор)
                <input
                  value={newLine.lotNumber ?? ''}
                  onChange={(e) => setNewLine((p) => ({ ...p, lotNumber: e.target.value }))}
                  placeholder="LOT-001"
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
                />
              </label>

              <Button onClick={addLine}>
                Добави
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

