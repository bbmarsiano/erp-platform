import { prisma } from '@dflow/db'

export async function getNextDocumentNumber(tenantId: string, docType: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const seq = await tx.documentSequence.upsert({
      where: { tenantId_docType: { tenantId, docType } },
      update: { lastNumber: { increment: 1 } },
      create: { tenantId, docType, lastNumber: 1 }
    })
    return seq.lastNumber.toString().padStart(10, '0')
  })
}
