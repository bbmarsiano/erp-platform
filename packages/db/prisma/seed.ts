import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      isActive: true
    }
  })

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@dflowerp.com' },
    update: {},
    create: {
      email: 'admin@dflowerp.com',
      hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
      isActive: true
    }
  })

  // Create demo license key
  await prisma.licenseKey.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      key: 'DEMO-0000-0000-0000',
      expiresAt: new Date('2027-12-31'),
      features: ['module:wms', 'module:mes', 'module:scm', 'module:pos', 'module:backup'],
      isActive: true
    }
  })

  // Add after existing seed — create demo warehouse + locations + products
  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'WH-01' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'WH-01',
      name: 'Основен склад',
      address: 'София, България',
      isActive: true,
      locations: {
        create: [
          { code: 'A-01', name: 'Зона А - Рафт 1', zone: 'A', locationType: 'STORAGE' },
          { code: 'A-02', name: 'Зона А - Рафт 2', zone: 'A', locationType: 'STORAGE' },
          { code: 'B-01', name: 'Зона Б - Рафт 1', zone: 'B', locationType: 'STORAGE' },
          { code: 'RECV', name: 'Приемна зона', zone: 'RECEIVING', locationType: 'RECEIVING' },
          { code: 'DISP', name: 'Експедиция', zone: 'DISPATCH', locationType: 'DISPATCH' }
        ]
      }
    }
  })

  // Demo products
  const products = [
    { code: 'PROD-001', name: 'Продукт А', unit: 'бр.', category: 'Готова продукция', minStock: 10 },
    { code: 'PROD-002', name: 'Суровина Б', unit: 'кг.', category: 'Суровини', minStock: 50 },
    { code: 'PROD-003', name: 'Опаковка В', unit: 'бр.', category: 'Опаковки', minStock: 100 }
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: p.code } },
      update: {},
      create: { tenantId: tenant.id, ...p, isActive: true }
    })
  }

  console.log('✅ Seed completed')
  console.log('   Tenant: Demo Company (slug: demo)')
  console.log('   Admin: admin@dflowerp.com / admin123')
  console.log('   License: DEMO-0000-0000-0000')
  console.log('✅ WMS seed completed — warehouse + locations + products')

  const supplier1 = await prisma.supplier.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'SUP-001' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'SUP-001',
      name: 'Главен доставчик АД',
      contactName: 'Иван Иванов',
      email: 'ivan@supplier.bg',
      phone: '+359 888 123456',
      address: 'София, бул. Витоша 1',
      taxNumber: 'BG123456789',
      isActive: true
    }
  })

  const supplier2 = await prisma.supplier.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'SUP-002' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'SUP-002',
      name: 'Вторичен доставчик ЕООД',
      contactName: 'Мария Петрова',
      email: 'maria@supplier2.bg',
      phone: '+359 877 654321',
      address: 'Пловдив, ул. Марица 5',
      isActive: true
    }
  })

  console.log('✅ SCM seed completed — 2 suppliers', supplier1.code, supplier2.code)

  const prod001 = await prisma.product.findFirstOrThrow({ where: { tenantId: tenant.id, code: 'PROD-001' } })
  const prod002 = await prisma.product.findFirstOrThrow({ where: { tenantId: tenant.id, code: 'PROD-002' } })
  const prod003 = await prisma.product.findFirstOrThrow({ where: { tenantId: tenant.id, code: 'PROD-003' } })

  await prisma.billOfMaterials.upsert({
    where: { productId: prod001.id },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: prod001.id,
      version: '1.0',
      isActive: true,
      items: {
        create: [
          { componentId: prod002.id, quantity: 2, unit: 'кг.', note: 'Основна суровина' },
          { componentId: prod003.id, quantity: 5, unit: 'бр.', note: 'Опаковка' }
        ]
      }
    }
  })
  console.log('✅ MES seed completed — BOM for PROD-001')

  const dispatchLocation = await prisma.location.findFirstOrThrow({
    where: { warehouseId: warehouse.id, code: 'DISP' }
  })
  await prisma.cashRegister.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'CASH-01' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'CASH-01',
      name: 'Каса 1 — Основна',
      warehouseId: warehouse.id,
      locationId: dispatchLocation.id,
      isActive: true
    }
  })
  console.log('✅ POS seed completed — cash register CASH-01')

  await prisma.backupPolicy.upsert({
    where: { id: 'default-backup-policy' },
    update: {},
    create: {
      id: 'default-backup-policy',
      tenantId: tenant.id,
      name: 'Ежедневно архивиране',
      schedule: '0 2 * * *',
      retentionDays: 30,
      targetType: 'LOCAL',
      targetPath: '/backups/dflow',
      isActive: true,
      isEncrypted: true
    }
  })
  console.log('✅ Backup seed completed — daily backup policy')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
