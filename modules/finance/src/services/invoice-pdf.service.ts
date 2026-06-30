// pdfmake + embedded Roboto vfs — supports Bulgarian (Cyrillic), no Chromium required
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfs = require('pdfmake/build/vfs_fonts')

const fonts = {
  Roboto: {
    normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64')
  }
}

const printer = new PdfPrinter(fonts)

export type InvoicePdfInput = {
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
}

function docLabel(docType: string): string {
  if (docType === 'INVOICE_IN') return 'Входяща фактура'
  if (docType === 'CREDIT_NOTE') return 'Кредитно известие'
  if (docType === 'DEBIT_NOTE') return 'Дебитно известие'
  return 'Изходяща фактура'
}

function partyLines(invoice: InvoicePdfInput): string[] {
  const party = invoice.docType === 'INVOICE_IN' ? invoice.supplier : invoice.customer
  const lines: string[] = []
  const partyLabel = invoice.docType === 'INVOICE_IN' ? 'Доставчик' : 'Клиент'
  lines.push(`${partyLabel}: ${party?.name ?? '—'}`)
  if (party && 'eik' in party && party.eik) lines.push(`ЕИК: ${party.eik}`)
  if (party && 'taxNumber' in party && party.taxNumber) lines.push(`ДДС: ${party.taxNumber}`)
  if (party && 'vatNumber' in party && party.vatNumber) lines.push(`ДДС: ${party.vatNumber}`)
  if (party?.address) lines.push(`Адрес: ${party.address}`)
  return lines
}

export function buildInvoicePdf(invoice: InvoicePdfInput): Promise<Buffer> {
  const label = docLabel(invoice.docType)
  const meta: string[] = [
    `Дата: ${new Date(invoice.issueDate).toLocaleDateString('bg-BG')}`,
    ...(invoice.dueDate ? [`Падеж: ${new Date(invoice.dueDate).toLocaleDateString('bg-BG')}`] : []),
    `Статус: ${invoice.status}`
  ]

  const tableBody = [
    [
      { text: 'Описание', style: 'tableHeader' },
      { text: 'Кол.', style: 'tableHeader', alignment: 'right' },
      { text: 'Ед. цена', style: 'tableHeader', alignment: 'right' },
      { text: 'Сума', style: 'tableHeader', alignment: 'right' }
    ],
    ...invoice.lines.map((line) => [
      line.description,
      { text: String(line.quantity), alignment: 'right' },
      { text: line.unitPrice.toFixed(2), alignment: 'right' },
      { text: line.lineTotal.toFixed(2), alignment: 'right' }
    ])
  ]

  const docDefinition = {
    defaultStyle: { font: 'Roboto', fontSize: 11 },
    content: [
      { text: `${label} № ${invoice.number}`, style: 'title' },
      { text: meta.join('\n'), style: 'meta', margin: [0, 4, 0, 16] },
      { text: partyLines(invoice).join('\n'), margin: [0, 0, 0, 16] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 50, 70, 70],
          body: tableBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#dddddd',
          vLineColor: () => '#dddddd',
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6
        }
      },
      {
        margin: [0, 20, 0, 0],
        columns: [
          { width: '*', text: '' },
          {
            width: 260,
            stack: [
              {
                columns: [
                  { text: 'Данъчна основа:', width: '*' },
                  { text: `${invoice.subtotal.toFixed(2)} ${invoice.currency}`, alignment: 'right', width: 100 }
                ]
              },
              {
                columns: [
                  { text: `ДДС (${invoice.vatRate}%):`, width: '*' },
                  { text: `${invoice.vatAmount.toFixed(2)} ${invoice.currency}`, alignment: 'right', width: 100 }
                ]
              },
              {
                columns: [
                  { text: 'Общо:', bold: true, width: '*' },
                  {
                    text: `${invoice.totalAmount.toFixed(2)} ${invoice.currency}`,
                    alignment: 'right',
                    bold: true,
                    width: 100
                  }
                ],
                margin: [0, 6, 0, 0]
              }
            ]
          }
        ]
      },
      ...(invoice.note
        ? [{ text: `Бележка: ${invoice.note}`, margin: [0, 24, 0, 0] as [number, number, number, number], bold: true }]
        : [])
    ],
    styles: {
      title: { fontSize: 18, bold: true, margin: [0, 0, 0, 4] },
      meta: { fontSize: 10, color: '#555555' },
      tableHeader: { bold: true, fillColor: '#f5f5f5' }
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition)
      const chunks: Buffer[] = []
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.on('error', reject)
      pdfDoc.end()
    } catch (error) {
      reject(error)
    }
  })
}
