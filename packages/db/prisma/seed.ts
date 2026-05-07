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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
