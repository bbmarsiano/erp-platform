import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Металконструкт ООД...')

  await prisma.backupJob.deleteMany()
  await prisma.backupPolicy.deleteMany()
  await prisma.saleLine.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.cashRegister.deleteMany()
  await prisma.materialConsumption.deleteMany()
  await prisma.workOrder.deleteMany()
  await prisma.bomItem.deleteMany()
  await prisma.billOfMaterials.deleteMany()
  await prisma.deliveryLine.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.purchaseOrderLine.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.goodsReceiptLine.deleteMany()
  await prisma.goodsIssueLine.deleteMany()
  await prisma.goodsReceipt.deleteMany()
  await prisma.goodsIssue.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.product.deleteMany()
  await prisma.location.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.licenseKey.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  console.log('✓ Cleared existing data')

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Металконструкт ООД',
      slug: 'metalkonstrukt',
      isActive: true,
      eik: '123456789',
      vatNumber: 'BG123456789',
      mol: 'Иван Петров',
      address: 'ул. Индустриална 15',
      city: 'Пловдив',
      country: 'България',
      phone: '+359 32 123 456',
      email: 'office@metalkonstrukt.bg',
      bankName: 'ОББ',
      bankIban: 'BG80UBBS80021020345678'
    }
  })
  console.log('✓ Tenant created:', tenant.name)

  const hashedPassword = await bcrypt.hash('Metal2024', 10)
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@metalkonstrukt.bg',
      hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'Иван',
      lastName: 'Петров',
      isActive: true
    }
  })

  await prisma.user.createMany({
    data: [
      {
        tenantId: tenant.id,
        email: 'manager@metalkonstrukt.bg',
        hashedPassword: await bcrypt.hash('Manager2024', 10),
        role: 'MANAGER',
        firstName: 'Георги',
        lastName: 'Иванов',
        isActive: true
      },
      {
        tenantId: tenant.id,
        email: 'operator@metalkonstrukt.bg',
        hashedPassword: await bcrypt.hash('Operator2024', 10),
        role: 'OPERATOR',
        firstName: 'Петър',
        lastName: 'Димитров',
        isActive: true
      }
    ]
  })
  console.log('✓ Users created')

  await prisma.licenseKey.create({
    data: {
      tenantId: tenant.id,
      key: 'AO6M-ERIE-UDQ4-TVCS',
      features: ['module:wms', 'module:scm', 'module:mes', 'module:pos', 'module:backup'],
      expiresAt: new Date('2126-01-01'),
      isActive: true
    }
  })
  console.log('✓ License key created')

  const wh01 = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      code: 'WH-01',
      name: 'Основен склад суровини',
      address: 'ул. Индустриална 15, Пловдив',
      isActive: true
    }
  })

  const wh02 = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      code: 'WH-02',
      name: 'Склад готова продукция',
      address: 'ул. Индустриална 15, Пловдив',
      isActive: true
    }
  })
  console.log('✓ Warehouses created')

  const locA01 = await prisma.location.create({
    data: {
      warehouseId: wh01.id,
      code: 'A-01',
      name: 'Метални профили',
      locationType: 'STORAGE',
      isActive: true
    }
  })
  const locA02 = await prisma.location.create({
    data: {
      warehouseId: wh01.id,
      code: 'A-02',
      name: 'Метални листове',
      locationType: 'STORAGE',
      isActive: true
    }
  })
  const locB01 = await prisma.location.create({
    data: {
      warehouseId: wh01.id,
      code: 'B-01',
      name: 'Тръби',
      locationType: 'STORAGE',
      isActive: true
    }
  })
  const locB02 = await prisma.location.create({
    data: {
      warehouseId: wh01.id,
      code: 'B-02',
      name: 'Метален ъгъл',
      locationType: 'STORAGE',
      isActive: true
    }
  })

  const locGP01 = await prisma.location.create({
    data: {
      warehouseId: wh02.id,
      code: 'GP-01',
      name: 'Готови огради',
      locationType: 'STORAGE',
      isActive: true
    }
  })
  const locGP02 = await prisma.location.create({
    data: {
      warehouseId: wh02.id,
      code: 'GP-02',
      name: 'Метални конструкции',
      locationType: 'STORAGE',
      isActive: true
    }
  })
  console.log('✓ Locations created')

  const sub001 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'SUB-001',
      name: 'Метален профил 40x40x2',
      unit: 'м',
      barcode: '5901234123457',
      minStock: 50,
      price: 3.5,
      isActive: true
    }
  })
  const sub002 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'SUB-002',
      name: 'Метален лист 1000x2000x2мм',
      unit: 'бр',
      barcode: '5901234123458',
      minStock: 20,
      price: 45.0,
      isActive: true
    }
  })
  const sub003 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'SUB-003',
      name: 'Кръгла тръба ⌀33x2',
      unit: 'м',
      barcode: '5901234123459',
      minStock: 30,
      price: 4.2,
      isActive: true
    }
  })
  const sub004 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'SUB-004',
      name: 'Метален ъгъл 40x40x4',
      unit: 'м',
      barcode: '5901234123460',
      minStock: 40,
      price: 2.8,
      isActive: true
    }
  })
  const sub005 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'SUB-005',
      name: 'Електроди 3.2мм',
      unit: 'кг',
      barcode: '5901234123461',
      minStock: 10,
      price: 8.5,
      isActive: true
    }
  })
  const sub006 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'SUB-006',
      name: 'Боя RAL 9005 черна',
      unit: 'л',
      barcode: '5901234123462',
      minStock: 5,
      price: 12.0,
      isActive: true
    }
  })
  const sub007 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'SUB-007',
      name: 'Болтове M10x50',
      unit: 'бр',
      barcode: '5901234123463',
      minStock: 100,
      price: 0.35,
      isActive: true
    }
  })

  const prd001 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'PRD-001',
      name: 'Метална ограда панел 2x1м',
      unit: 'бр',
      barcode: '5901234123464',
      minStock: 5,
      price: 85.0,
      isActive: true
    }
  })
  const prd002 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'PRD-002',
      name: 'Метална врата единична 1x2м',
      unit: 'бр',
      barcode: '5901234123465',
      minStock: 2,
      price: 180.0,
      isActive: true
    }
  })
  const prd003 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      code: 'PRD-003',
      name: 'Метална конструкция навес 4x6м',
      unit: 'бр',
      barcode: '5901234123466',
      minStock: 1,
      price: 1200.0,
      isActive: true
    }
  })
  console.log('✓ Products created')

  const stockItems = [
    { productId: sub001.id, locationId: locA01.id, quantity: 200 },
    { productId: sub002.id, locationId: locA02.id, quantity: 50 },
    { productId: sub003.id, locationId: locB01.id, quantity: 150 },
    { productId: sub004.id, locationId: locB02.id, quantity: 100 },
    { productId: sub005.id, locationId: locA01.id, quantity: 30 },
    { productId: sub006.id, locationId: locA02.id, quantity: 20 },
    { productId: sub007.id, locationId: locA01.id, quantity: 500 },
    { productId: prd001.id, locationId: locGP01.id, quantity: 0 },
    { productId: prd002.id, locationId: locGP01.id, quantity: 0 },
    { productId: prd003.id, locationId: locGP02.id, quantity: 0 }
  ]

  for (const item of stockItems) {
    await prisma.stockItem.create({
      data: {
        tenantId: tenant.id,
        productId: item.productId,
        locationId: item.locationId,
        quantity: item.quantity,
        lotNumber: null
      }
    })
  }

  for (const item of stockItems.filter((i) => i.quantity > 0)) {
    await prisma.stockMovement.create({
      data: {
        tenantId: tenant.id,
        productId: item.productId,
        movementType: 'IN',
        quantity: item.quantity,
        toLocationId: item.locationId,
        referenceType: 'INITIAL',
        note: 'Начално заприхождаване',
        createdBy: admin.id
      }
    })
  }
  console.log('✓ Stock items and movements created')

  const sup001 = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      code: 'SUP-001',
      name: 'Стоманени профили ЕООД',
      contactName: 'Георги Стоянов',
      phone: '+359 2 888 1234',
      email: 'office@stomaprofile.bg',
      isActive: true
    }
  })
  const sup002 = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      code: 'SUP-002',
      name: 'Металтрейд АД',
      contactName: 'Мария Николова',
      phone: '+359 32 777 5678',
      email: 'sales@metaltrade.bg',
      isActive: true
    }
  })
  await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      code: 'SUP-003',
      name: 'Хемимпекс ООД',
      contactName: 'Петър Димитров',
      phone: '+359 56 444 9012',
      email: 'info@hemimpex.bg',
      isActive: true
    }
  })
  console.log('✓ Suppliers created')

  const po001 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenant.id,
      supplierId: sup001.id,
      warehouseId: wh01.id,
      orderNo: 'PO-20260624-0001',
      status: 'SENT',
      note: 'Поръчка за производство на огради',
      expectedDate: new Date('2026-06-27')
    }
  })

  await prisma.purchaseOrderLine.createMany({
    data: [
      { purchaseOrderId: po001.id, productId: sub001.id, quantity: 100, unitPrice: 3.2, receivedQty: 0 },
      { purchaseOrderId: po001.id, productId: sub004.id, quantity: 60, unitPrice: 2.6, receivedQty: 0 }
    ]
  })
  console.log('✓ Purchase order created')

  const bom001 = await prisma.billOfMaterials.create({
    data: {
      tenantId: tenant.id,
      productId: prd001.id,
      version: '1.0',
      isActive: true
    }
  })

  await prisma.bomItem.createMany({
    data: [
      { bomId: bom001.id, componentId: sub001.id, quantity: 6, unit: 'м' },
      { bomId: bom001.id, componentId: sub004.id, quantity: 4, unit: 'м' },
      { bomId: bom001.id, componentId: sub005.id, quantity: 0.5, unit: 'кг' },
      { bomId: bom001.id, componentId: sub006.id, quantity: 0.3, unit: 'л' },
      { bomId: bom001.id, componentId: sub007.id, quantity: 8, unit: 'бр' }
    ]
  })

  const bom002 = await prisma.billOfMaterials.create({
    data: {
      tenantId: tenant.id,
      productId: prd002.id,
      version: '1.0',
      isActive: true
    }
  })

  await prisma.bomItem.createMany({
    data: [
      { bomId: bom002.id, componentId: sub001.id, quantity: 8, unit: 'м' },
      { bomId: bom002.id, componentId: sub003.id, quantity: 2, unit: 'м' },
      { bomId: bom002.id, componentId: sub005.id, quantity: 0.8, unit: 'кг' },
      { bomId: bom002.id, componentId: sub006.id, quantity: 0.5, unit: 'л' },
      { bomId: bom002.id, componentId: sub007.id, quantity: 12, unit: 'бр' }
    ]
  })
  console.log('✓ BOMs created')

  await prisma.cashRegister.create({
    data: {
      tenantId: tenant.id,
      warehouseId: wh02.id,
      locationId: locGP01.id,
      code: 'CASH-01',
      name: 'Каса Шоурум',
      isActive: true
    }
  })
  console.log('✓ Cash register created')

  await prisma.backupPolicy.create({
    data: {
      id: 'default-backup-policy',
      tenantId: tenant.id,
      name: 'Дневен архив',
      schedule: '0 2 * * *',
      retentionDays: 30,
      targetType: 'LOCAL',
      isActive: true
    }
  })
  console.log('✓ Backup policy created')

  console.log('')
  console.log('✅ Seed completed successfully!')
  console.log('   Tenant: Металконструкт ООД')
  console.log('   Admin:  admin@metalkonstrukt.bg / Metal2024')
  console.log('   License: AO6M-ERIE-UDQ4-TVCS (Lifetime)')
  console.log('   Warehouses: WH-01, WH-02')
  console.log('   Products: SUB-001..007 + PRD-001..003')
  console.log('   Suppliers: SUP-001, SUP-002, SUP-003')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
