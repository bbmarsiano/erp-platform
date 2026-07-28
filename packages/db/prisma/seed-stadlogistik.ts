/**
 * DFlowERP — Seed данни за Стад Логистик ООД
 * ЕИК: 201249679
 * Адрес: гр. Благоевград (2700), ул. Отец Паисий 2, ет. 3
 * Версия: v0.6.0
 *
 * Употреба:
 *   pnpm --filter @dflow/db db:seed:stadlogistik
 * или директно:
 *   npx ts-node packages/db/prisma/seed-stadlogistik.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Стартиране на seed за Стад Логистик ООД...')

  // ─── TENANT ───────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'stadlogistik' },
    update: {},
    create: {
      name: 'Стад Логистик ООД',
      slug: 'stadlogistik',
      eik: '201249679',
      address: 'гр. Благоевград (2700), ул. Отец Паисий 2, ет. 3',
      city: 'Благоевград',
      country: 'България',
      isActive: true,
    },
  })
  console.log(`✅ Tenant: ${tenant.name}`)

  // ─── ПОТРЕБИТЕЛИ ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Stad2024', 10)
  const managerHash = await bcrypt.hash('Manager2024', 10)
  const operatorHash = await bcrypt.hash('Operator2024', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@stadlogistik.bg' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@stadlogistik.bg',
      passwordHash,
      firstName: 'Стад',
      lastName: 'Админ',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@stadlogistik.bg' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'manager@stadlogistik.bg',
      passwordHash: managerHash,
      firstName: 'Георги',
      lastName: 'Петров',
      role: 'MANAGER',
      isActive: true,
    },
  })

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@stadlogistik.bg' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'operator@stadlogistik.bg',
      passwordHash: operatorHash,
      firstName: 'Иван',
      lastName: 'Стоянов',
      role: 'OPERATOR',
      isActive: true,
    },
  })
  console.log('✅ Потребители: admin, manager, operator')

  // ─── ЛИЦЕНЗ ───────────────────────────────────────────────────────────────
  await prisma.license.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      licenseKey: 'DH33-7G3A-EDEU-JUFS',
      plan: 'LIFETIME',
      expiresAt: null, // Без изтичане — Lifetime лиценз
      isActive: true,
    },
  })
  console.log('✅ Лиценз: LIFETIME (perpetual)')

  // ─── СКЛАДОВЕ ─────────────────────────────────────────────────────────────
  const warehouseRaw = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'WH-01' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'WH-01',
      name: 'Основен склад суровини',
      address: 'гр. Благоевград, ул. Отец Паисий 2',
      isActive: true,
    },
  })

  const warehouseFinished = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'WH-02' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'WH-02',
      name: 'Склад готова продукция',
      address: 'гр. Благоевград, ул. Отец Паисий 2',
      isActive: true,
    },
  })
  console.log('✅ Складове: WH-01, WH-02')

  // ─── ЛОКАЦИИ ──────────────────────────────────────────────────────────────
  const locA01 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouseRaw.id, code: 'A-01' } },
    update: {},
    create: { warehouseId: warehouseRaw.id, tenantId: tenant.id, code: 'A-01', name: 'Зона А — Армировъчна стомана', isActive: true },
  })
  const locA02 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouseRaw.id, code: 'A-02' } },
    update: {},
    create: { warehouseId: warehouseRaw.id, tenantId: tenant.id, code: 'A-02', name: 'Зона А — Листова стомана', isActive: true },
  })
  const locB01 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouseRaw.id, code: 'B-01' } },
    update: {},
    create: { warehouseId: warehouseRaw.id, tenantId: tenant.id, code: 'B-01', name: 'Зона Б — Тръби и профили', isActive: true },
  })
  const locB02 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouseRaw.id, code: 'B-02' } },
    update: {},
    create: { warehouseId: warehouseRaw.id, tenantId: tenant.id, code: 'B-02', name: 'Зона Б — Консумативи', isActive: true },
  })
  const locGP01 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouseFinished.id, code: 'GP-01' } },
    update: {},
    create: { warehouseId: warehouseFinished.id, tenantId: tenant.id, code: 'GP-01', name: 'Готова продукция — Заготовки', isActive: true },
  })
  const locGP02 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouseFinished.id, code: 'GP-02' } },
    update: {},
    create: { warehouseId: warehouseFinished.id, tenantId: tenant.id, code: 'GP-02', name: 'Готова продукция — Конструкции', isActive: true },
  })
  console.log('✅ Локации: A-01, A-02, B-01, B-02, GP-01, GP-02')

  // ─── ПРОДУКТИ — СУРОВИНИ ──────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-001' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUB-001',
        name: 'Армировъчна стомана ⌀10 B500B',
        barcode: '3001234123001',
        unit: 'кг', category: 'Суровини',
        minStock: 500, price: 1.45, isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-002' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUB-002',
        name: 'Армировъчна стомана ⌀12 B500B',
        barcode: '3001234123002',
        unit: 'кг', category: 'Суровини',
        minStock: 500, price: 1.42, isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-003' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUB-003',
        name: 'Листова стомана 1500x3000x4мм',
        barcode: '3001234123003',
        unit: 'бр', category: 'Суровини',
        minStock: 20, price: 85.00, isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-004' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUB-004',
        name: 'Квадратна тръба 40x40x2мм',
        barcode: '3001234123004',
        unit: 'м', category: 'Суровини',
        minStock: 100, price: 3.80, isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-005' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUB-005',
        name: 'Електроди 4.0мм AWS E7018',
        barcode: '3001234123005',
        unit: 'кг', category: 'Консумативи',
        minStock: 20, price: 4.20, isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-006' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUB-006',
        name: 'Антикорозионна боя сива',
        barcode: '3001234123006',
        unit: 'л', category: 'Консумативи',
        minStock: 10, price: 8.50, isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-007' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUB-007',
        name: 'Болтове M12x60 клас 8.8',
        barcode: '3001234123007',
        unit: 'бр', category: 'Консумативи',
        minStock: 200, price: 0.45, isActive: true,
      },
    }),
  ])

  // ─── ПРОДУКТИ — ГОТОВА ПРОДУКЦИЯ ──────────────────────────────────────────
  const finishedProducts = await Promise.all([
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'PRD-001' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'PRD-001',
        name: 'Армировъчна заготовка тип А1',
        barcode: '3001234123101',
        unit: 'бр', category: 'Готова продукция',
        minStock: 10, price: 45.00, isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'PRD-002' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'PRD-002',
        name: 'Оградно пано 2.5x2м тип В',
        barcode: '3001234123102',
        unit: 'бр', category: 'Готова продукция',
        minStock: 5, price: 120.00, isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'PRD-003' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'PRD-003',
        name: 'Метална конструкция тип С',
        barcode: '3001234123103',
        unit: 'бр', category: 'Готова продукция',
        minStock: 2, price: 850.00, isActive: true,
      },
    }),
  ])
  console.log('✅ Продукти: 7 суровини + 3 готова продукция')

  // ─── НАЧАЛНИ НАЛИЧНОСТИ ───────────────────────────────────────────────────
  const stockData = [
    { product: products[0], location: locA01, qty: 2000 },  // SUB-001 армировка ⌀10
    { product: products[1], location: locA01, qty: 1500 },  // SUB-002 армировка ⌀12
    { product: products[2], location: locA02, qty: 40 },    // SUB-003 листова стомана
    { product: products[3], location: locB01, qty: 300 },   // SUB-004 квадратна тръба
    { product: products[4], location: locB02, qty: 50 },    // SUB-005 електроди
    { product: products[5], location: locB02, qty: 30 },    // SUB-006 боя
    { product: products[6], location: locB02, qty: 1000 },  // SUB-007 болтове
    { product: finishedProducts[0], location: locGP01, qty: 0 },
    { product: finishedProducts[1], location: locGP01, qty: 0 },
    { product: finishedProducts[2], location: locGP02, qty: 0 },
  ]

  for (const s of stockData) {
    await prisma.stock.upsert({
      where: { productId_locationId_lotNumber: { productId: s.product.id, locationId: s.location.id, lotNumber: null } },
      update: { quantity: s.qty },
      create: {
        tenantId: tenant.id,
        productId: s.product.id,
        locationId: s.location.id,
        quantity: s.qty,
        reservedQty: 0,
      },
    })

    if (s.qty > 0) {
      await prisma.stockMovement.create({
        data: {
          tenantId: tenant.id,
          productId: s.product.id,
          movementType: 'IN',
          quantity: s.qty,
          toLocationId: s.location.id,
          referenceType: 'INITIAL',
          note: 'Начално заприхождаване',
          createdBy: adminUser.id,
        },
      })
    }
  }
  console.log('✅ Начални наличности заредени')

  // ─── ДОСТАВЧИЦИ ───────────────────────────────────────────────────────────
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUP-001' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUP-001',
        name: 'Металик Стил ЕООД',
        eik: '123456001',
        email: 'office@metaliksteel.bg',
        phone: '+359 2 123 4001',
        address: 'гр. София, бул. Владимир Вазов 10',
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUP-002' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUP-002',
        name: 'Армекс АД',
        eik: '123456002',
        email: 'sales@armex.bg',
        phone: '+359 73 88 4002',
        address: 'гр. Благоевград, Промишлена зона',
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUP-003' } },
      update: {},
      create: {
        tenantId: tenant.id, code: 'SUP-003',
        name: 'Консуматив Про ООД',
        eik: '123456003',
        email: 'info@konsumativpro.bg',
        phone: '+359 2 456 7003',
        address: 'гр. Перник, ул. Рудничарска 5',
        isActive: true,
      },
    }),
  ])
  console.log('✅ Доставчици: SUP-001, SUP-002, SUP-003')

  // ─── РЕЦЕПТУРИ (BOM) ──────────────────────────────────────────────────────
  // BOM за PRD-001 — Армировъчна заготовка тип А1
  const bom1 = await prisma.bOM.upsert({
    where: { tenantId_productId: { tenantId: tenant.id, productId: finishedProducts[0].id } },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: finishedProducts[0].id,
      name: 'BOM — Армировъчна заготовка А1',
      isActive: true,
    },
  })
  await Promise.all([
    prisma.bOMLine.upsert({
      where: { bomId_productId: { bomId: bom1.id, productId: products[0].id } },
      update: {},
      create: { bomId: bom1.id, productId: products[0].id, quantity: 8.5, unit: 'кг' },
    }),
    prisma.bOMLine.upsert({
      where: { bomId_productId: { bomId: bom1.id, productId: products[4].id } },
      update: {},
      create: { bomId: bom1.id, productId: products[4].id, quantity: 0.3, unit: 'кг' },
    }),
  ])

  // BOM за PRD-002 — Оградно пано 2.5x2м
  const bom2 = await prisma.bOM.upsert({
    where: { tenantId_productId: { tenantId: tenant.id, productId: finishedProducts[1].id } },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: finishedProducts[1].id,
      name: 'BOM — Оградно пано В',
      isActive: true,
    },
  })
  await Promise.all([
    prisma.bOMLine.upsert({
      where: { bomId_productId: { bomId: bom2.id, productId: products[3].id } },
      update: {},
      create: { bomId: bom2.id, productId: products[3].id, quantity: 12, unit: 'м' },
    }),
    prisma.bOMLine.upsert({
      where: { bomId_productId: { bomId: bom2.id, productId: products[1].id } },
      update: {},
      create: { bomId: bom2.id, productId: products[1].id, quantity: 5, unit: 'кг' },
    }),
    prisma.bOMLine.upsert({
      where: { bomId_productId: { bomId: bom2.id, productId: products[4].id } },
      update: {},
      create: { bomId: bom2.id, productId: products[4].id, quantity: 0.5, unit: 'кг' },
    }),
    prisma.bOMLine.upsert({
      where: { bomId_productId: { bomId: bom2.id, productId: products[5].id } },
      update: {},
      create: { bomId: bom2.id, productId: products[5].id, quantity: 0.5, unit: 'л' },
    }),
    prisma.bOMLine.upsert({
      where: { bomId_productId: { bomId: bom2.id, productId: products[6].id } },
      update: {},
      create: { bomId: bom2.id, productId: products[6].id, quantity: 16, unit: 'бр' },
    }),
  ])
  console.log('✅ Рецептури: BOM за PRD-001, PRD-002')

  // ─── BACKUP ПОЛИТИКА ──────────────────────────────────────────────────────
  await prisma.backupPolicy.upsert({
    where: { id: `default-backup-policy-${tenant.id}` },
    update: {},
    create: {
      id: `default-backup-policy-${tenant.id}`,
      tenantId: tenant.id,
      name: 'Дневен архив',
      schedule: '0 2 * * *',
      retentionDays: 30,
      targetType: 'LOCAL',
      targetPath: '/backups/dflow',
      isActive: true,
      isEncrypted: true,
    },
  })

  // ─── POS КАСА ─────────────────────────────────────────────────────────────
  await prisma.posRegister.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'CASH-01' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'CASH-01',
      name: 'Каса Шоурум',
      warehouseId: warehouseFinished.id,
      locationId: locGP01.id,
      isActive: true,
    },
  })
  console.log('✅ POS Каса: CASH-01')

  console.log('')
  console.log('🎉 Seed за Стад Логистик ООД завършен успешно!')
  console.log('')
  console.log('📋 Акаунти за вход:')
  console.log('   Admin:    admin@stadlogistik.bg    / Stad2024')
  console.log('   Manager:  manager@stadlogistik.bg  / Manager2024')
  console.log('   Operator: operator@stadlogistik.bg / Operator2024')
}

main()
  .catch((e) => {
    console.error('❌ Грешка при seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
