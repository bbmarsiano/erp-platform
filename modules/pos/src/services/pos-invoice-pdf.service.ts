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

export type PosInvoicePdfInput = {
  number: string
  issueDate: Date
  dueDate?: Date | null
  taxEventDate?: Date | null
  status: string
  paymentMethod: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  vatRate: number
  note?: string | null
  issuer: {
    name: string
    address?: string | null
    city?: string | null
    eik?: string | null
    vatNumber?: string | null
    vatRegistered?: boolean
    mol?: string | null
    phone?: string | null
    email?: string | null
    bankName?: string | null
    bankIban?: string | null
  }
  recipient: {
    name: string
    eik?: string | null
    vatNumber?: string | null
    address?: string | null
    city?: string | null
    contactPerson?: string | null
  }
  lines: Array<{
    description: string
    quantity: number
    unit: string
    unitPrice: number
    vatRate: number
    lineTotal: number
  }>
}

function paymentLabel(method: string): string {
  if (method === 'CARD') return 'С карта'
  if (method === 'MIXED') return 'Смесено'
  return 'В брой'
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('bg-BG')
}

export function buildPosInvoicePdf(invoice: PosInvoicePdfInput): Promise<Buffer> {
  const issuerAddress = [invoice.issuer.address, invoice.issuer.city].filter(Boolean).join(', ')
  const recipientAddress = [invoice.recipient.address, invoice.recipient.city].filter(Boolean).join(', ')

  const issuerBlock = [
    { text: 'ИЗДАТЕЛ', style: 'sectionHeader' },
    { text: invoice.issuer.name, bold: true },
    ...(issuerAddress ? [{ text: `Адрес: ${issuerAddress}` }] : []),
    ...(invoice.issuer.eik ? [{ text: `ЕИК: ${invoice.issuer.eik}` }] : []),
    ...(invoice.issuer.vatRegistered && invoice.issuer.vatNumber
      ? [{ text: `ДДС №: ${invoice.issuer.vatNumber}` }]
      : []),
    ...(invoice.issuer.mol ? [{ text: `МОЛ: ${invoice.issuer.mol}` }] : []),
    ...(invoice.issuer.phone ? [{ text: `Тел: ${invoice.issuer.phone}` }] : []),
    ...(invoice.issuer.email ? [{ text: `Имейл: ${invoice.issuer.email}` }] : []),
    ...(invoice.issuer.bankName ? [{ text: `Банка: ${invoice.issuer.bankName}` }] : []),
    ...(invoice.issuer.bankIban ? [{ text: `IBAN: ${invoice.issuer.bankIban}` }] : [])
  ]

  const recipientBlock = [
    { text: 'ПОЛУЧАТЕЛ', style: 'sectionHeader' },
    { text: invoice.recipient.name, bold: true },
    ...(recipientAddress ? [{ text: `Адрес: ${recipientAddress}` }] : []),
    ...(invoice.recipient.eik ? [{ text: `ЕИК: ${invoice.recipient.eik}` }] : []),
    ...(invoice.recipient.vatNumber ? [{ text: `ДДС №: ${invoice.recipient.vatNumber}` }] : []),
    ...(invoice.recipient.contactPerson ? [{ text: `МОЛ: ${invoice.recipient.contactPerson}` }] : [])
  ]

  const tableBody = [
    [
      { text: '№', style: 'tableHeader' },
      { text: 'Описание', style: 'tableHeader' },
      { text: 'Кол.', style: 'tableHeader', alignment: 'right' },
      { text: 'Ед.', style: 'tableHeader' },
      { text: 'Ед. цена', style: 'tableHeader', alignment: 'right' },
      { text: 'ДДС%', style: 'tableHeader', alignment: 'right' },
      { text: 'Сума', style: 'tableHeader', alignment: 'right' }
    ],
    ...invoice.lines.map((line, index) => [
      String(index + 1),
      line.description,
      { text: String(line.quantity), alignment: 'right' },
      line.unit,
      { text: line.unitPrice.toFixed(2), alignment: 'right' },
      { text: String(line.vatRate), alignment: 'right' },
      { text: line.lineTotal.toFixed(2), alignment: 'right' }
    ])
  ]

  const docDefinition = {
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    content: [
      {
        columns: [
          { text: `ФАКТУРА № ${invoice.number}`, style: 'title', width: '*' },
          { text: 'ОРИГИНАЛ', style: 'original', alignment: 'right', width: 120 }
        ]
      },
      {
        text: [
          `Дата на издаване: ${formatDate(invoice.issueDate)}`,
          `   Данъчно събитие: ${formatDate(invoice.taxEventDate ?? invoice.issueDate)}`,
          `   Падеж: ${formatDate(invoice.dueDate)}`
        ].join('   '),
        style: 'meta',
        margin: [0, 6, 0, 14]
      },
      {
        columns: [
          { width: '48%', stack: issuerBlock },
          { width: '4%', text: '' },
          { width: '48%', stack: recipientBlock }
        ],
        margin: [0, 0, 0, 16]
      },
      {
        table: {
          headerRows: 1,
          widths: [20, '*', 35, 35, 55, 35, 55],
          body: tableBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4
        }
      },
      {
        margin: [0, 16, 0, 0],
        columns: [
          { width: '*', text: '' },
          {
            width: 240,
            stack: [
              {
                columns: [
                  { text: 'Данъчна основа:', width: '*' },
                  { text: `${invoice.subtotal.toFixed(2)} лв.`, alignment: 'right', width: 90 }
                ]
              },
              {
                columns: [
                  { text: `ДДС (${invoice.vatRate}%):`, width: '*' },
                  { text: `${invoice.vatAmount.toFixed(2)} лв.`, alignment: 'right', width: 90 }
                ]
              },
              {
                columns: [
                  { text: 'ОБЩО ДЪЛЖИМО:', bold: true, width: '*' },
                  { text: `${invoice.totalAmount.toFixed(2)} лв.`, alignment: 'right', bold: true, width: 90 }
                ],
                margin: [0, 4, 0, 0]
              }
            ]
          }
        ]
      },
      {
        margin: [0, 14, 0, 0],
        text: `Начин на плащане: ${paymentLabel(invoice.paymentMethod)}`
      },
      ...(invoice.issuer.bankIban
        ? [{ margin: [0, 4, 0, 0] as [number, number, number, number], text: `Банкова сметка: ${invoice.issuer.bankIban}` }]
        : []),
      ...(invoice.note
        ? [{ margin: [0, 10, 0, 0] as [number, number, number, number], text: `Бележка: ${invoice.note}` }]
        : []),
      {
        margin: [0, 28, 0, 0],
        columns: [
          { text: 'Издал: ___________________', width: '*' },
          { text: 'Получил: ___________________', width: '*', alignment: 'right' }
        ]
      },
      {
        margin: [0, 20, 0, 0],
        text: 'Документът е съставен в 2 еднообразни екземпляра',
        style: 'footer',
        alignment: 'center'
      }
    ],
    styles: {
      title: { fontSize: 16, bold: true },
      original: { fontSize: 11, bold: true, color: '#444444' },
      meta: { fontSize: 9, color: '#555555' },
      sectionHeader: { fontSize: 9, bold: true, color: '#666666', margin: [0, 0, 0, 4] },
      tableHeader: { bold: true, fillColor: '#f3f4f6', fontSize: 9 },
      footer: { fontSize: 8, color: '#888888', italics: true }
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
