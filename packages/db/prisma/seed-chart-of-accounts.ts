import type { PrismaClient } from '@prisma/client'

const STANDARD_ACCOUNTS: Array<{ code: string; name: string; accountType: string }> = [
  { code: '501', name: 'Каса', accountType: 'ASSET' },
  { code: '503', name: 'Разплащателна сметка', accountType: 'ASSET' },
  { code: '411', name: 'Клиенти', accountType: 'ASSET' },
  { code: '302', name: 'Стоки', accountType: 'ASSET' },
  { code: '304', name: 'Продукция', accountType: 'ASSET' },
  { code: '401', name: 'Доставчици', accountType: 'LIABILITY' },
  { code: '4532', name: 'ДДС на покупките', accountType: 'LIABILITY' },
  { code: '4538', name: 'ДДС за внасяне', accountType: 'LIABILITY' },
  { code: '702', name: 'Приходи от продажба на стоки', accountType: 'REVENUE' },
  { code: '703', name: 'Приходи от продажба на продукция', accountType: 'REVENUE' },
  { code: '601', name: 'Разходи за материали', accountType: 'EXPENSE' },
  { code: '602', name: 'Разходи за външни услуги', accountType: 'EXPENSE' },
  { code: '604', name: 'Разходи за заплати', accountType: 'EXPENSE' }
]

export async function seedChartOfAccounts(prisma: PrismaClient, tenantId: string) {
  for (const account of STANDARD_ACCOUNTS) {
    await prisma.chartOfAccount.upsert({
      where: {
        tenantId_code: { tenantId, code: account.code }
      },
      update: {
        name: account.name,
        accountType: account.accountType,
        isActive: true
      },
      create: {
        tenantId,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        isActive: true
      }
    })
  }
}
