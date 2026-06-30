import { prisma } from '@dflow/db'

export type ChartOfAccountNode = {
  id: string
  tenantId: string
  code: string
  name: string
  accountType: string
  parentId: string | null
  isActive: boolean
  createdAt: Date
  children: ChartOfAccountNode[]
}

export async function listChartOfAccounts(tenantId: string) {
  return prisma.chartOfAccount.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ accountType: 'asc' }, { code: 'asc' }]
  })
}

export function buildAccountTree(
  accounts: Array<{
    id: string
    tenantId: string
    code: string
    name: string
    accountType: string
    parentId: string | null
    isActive: boolean
    createdAt: Date
  }>
): ChartOfAccountNode[] {
  const map = new Map<string, ChartOfAccountNode>()
  const roots: ChartOfAccountNode[] = []

  for (const account of accounts) {
    map.set(account.id, { ...account, children: [] })
  }

  for (const account of accounts) {
    const node = map.get(account.id)!
    if (account.parentId && map.has(account.parentId)) {
      map.get(account.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function groupAccountsByType(tree: ChartOfAccountNode[]) {
  const order = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const
  const labels: Record<string, string> = {
    ASSET: 'Активи',
    LIABILITY: 'Пасиви',
    EQUITY: 'Капитал',
    REVENUE: 'Приходи',
    EXPENSE: 'Разходи'
  }

  const flat = flattenTree(tree)
  return order
    .map((type) => ({
      type,
      label: labels[type],
      accounts: flat.filter((a) => a.accountType === type)
    }))
    .filter((group) => group.accounts.length > 0)
}

function flattenTree(nodes: ChartOfAccountNode[]): ChartOfAccountNode[] {
  const result: ChartOfAccountNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children.length) result.push(...flattenTree(node.children))
  }
  return result
}
