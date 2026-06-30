import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface JournalLineInput {
  accountId: string
  debit?: number | Decimal
  credit?: number | Decimal
  description?: string
}

export class JournalBalanceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JournalBalanceError'
  }
}

export function assertJournalBalanced(lines: JournalLineInput[]): void {
  let debitSum = new Decimal(0)
  let creditSum = new Decimal(0)

  for (const line of lines) {
    debitSum = debitSum.add(new Decimal(line.debit ?? 0))
    creditSum = creditSum.add(new Decimal(line.credit ?? 0))
  }

  if (debitSum.equals(0)) {
    throw new JournalBalanceError('Journal entry must have non-zero amounts')
  }

  if (!debitSum.equals(creditSum)) {
    throw new JournalBalanceError(`Unbalanced journal entry: debit=${debitSum} credit=${creditSum}`)
  }
}

export async function createJournalEntry(
  tx: Prisma.TransactionClient,
  params: {
    tenantId: string
    entryDate: Date
    description: string
    sourceType: string
    sourceId?: string | null
    createdBy: string
    lines: JournalLineInput[]
  }
) {
  assertJournalBalanced(params.lines)

  return tx.journalEntry.create({
    data: {
      tenantId: params.tenantId,
      entryDate: params.entryDate,
      description: params.description,
      sourceType: params.sourceType,
      sourceId: params.sourceId ?? null,
      createdBy: params.createdBy,
      lines: {
        create: params.lines.map((line) => ({
          accountId: line.accountId,
          debit: new Decimal(line.debit ?? 0),
          credit: new Decimal(line.credit ?? 0),
          description: line.description
        }))
      }
    },
    include: {
      lines: { include: { account: true } }
    }
  })
}
