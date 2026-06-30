export function buildInvoiceHtml(invoice: {
  number: string
  docType: string
  issueDate: Date
  dueDate?: Date | null
  status: string
  currency: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  vatRate: number
  note?: string | null
  customer?: { name: string; eik?: string | null; vatNumber?: string | null; address?: string | null } | null
  supplier?: { name: string; taxNumber?: string | null; address?: string | null } | null
  lines: Array<{ description: string; quantity: number; unitPrice: number; lineTotal: number }>
}) {
  const party =
    invoice.docType === 'INVOICE_IN'
      ? invoice.supplier
      : invoice.customer

  const docLabel =
    invoice.docType === 'INVOICE_IN'
      ? 'Входяща фактура'
      : invoice.docType === 'CREDIT_NOTE'
        ? 'Кредитно известие'
        : invoice.docType === 'DEBIT_NOTE'
          ? 'Дебитно известие'
          : 'Изходяща фактура'

  const linesHtml = invoice.lines
    .map(
      (l) => `
      <tr>
        <td>${l.description}</td>
        <td style="text-align:right">${l.quantity}</td>
        <td style="text-align:right">${l.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">${l.lineTotal.toFixed(2)}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="utf-8" />
  <title>${docLabel} ${invoice.number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
    th { background: #f5f5f5; text-align: left; }
    .totals { margin-top: 20px; width: 320px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { font-weight: bold; font-size: 16px; border-top: 2px solid #111; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>${docLabel} № ${invoice.number}</h1>
  <div class="meta">
    <div>Дата: ${new Date(invoice.issueDate).toLocaleDateString('bg-BG')}</div>
    ${invoice.dueDate ? `<div>Падеж: ${new Date(invoice.dueDate).toLocaleDateString('bg-BG')}</div>` : ''}
    <div>Статус: ${invoice.status}</div>
  </div>
  <div>
    <strong>${invoice.docType === 'INVOICE_IN' ? 'Доставчик' : 'Клиент'}:</strong> ${party?.name ?? '—'}<br/>
    ${party && 'eik' in party && party.eik ? `ЕИК: ${party.eik}<br/>` : ''}
    ${party && 'taxNumber' in party && party.taxNumber ? `ДДС: ${party.taxNumber}<br/>` : ''}
    ${party && 'vatNumber' in party && party.vatNumber ? `ДДС: ${party.vatNumber}<br/>` : ''}
    ${party?.address ? `Адрес: ${party.address}` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>Описание</th>
        <th>Кол.</th>
        <th>Ед. цена</th>
        <th>Сума</th>
      </tr>
    </thead>
    <tbody>${linesHtml}</tbody>
  </table>
  <div class="totals">
    <div><span>Данъчна основа:</span><span>${invoice.subtotal.toFixed(2)} ${invoice.currency}</span></div>
    <div><span>ДДС (${invoice.vatRate}%):</span><span>${invoice.vatAmount.toFixed(2)} ${invoice.currency}</span></div>
    <div class="grand"><span>Общо:</span><span>${invoice.totalAmount.toFixed(2)} ${invoice.currency}</span></div>
  </div>
  ${invoice.note ? `<p style="margin-top:24px"><strong>Бележка:</strong> ${invoice.note}</p>` : ''}
</body>
</html>`
}
