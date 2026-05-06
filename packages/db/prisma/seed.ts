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

  console.log('✅ Seed completed')
  console.log('   Tenant: Demo Company (slug: demo)')
  console.log('   Admin: admin@dflowerp.com / admin123')
  console.log('   License: DEMO-0000-0000-0000')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
