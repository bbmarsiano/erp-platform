import { prisma } from '@dflow/db'

type LicenseValidationResult = {
  valid: boolean
  features: string[]
  expiresAt: Date
}

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000

export const validateLicense = async (key: string): Promise<LicenseValidationResult> => {
  const endpoint = `${process.env.LICENSE_SERVER_URL}/api/validate`
  const systemTenant = await prisma.tenant.upsert({
    where: { slug: 'system' },
    update: {},
    create: {
      name: 'System Tenant',
      slug: 'system'
    }
  })

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.LICENSE_SERVER_KEY ?? ''
      },
      body: JSON.stringify({ key })
    })

    if (!response.ok) {
      throw new Error(`License server error: ${response.status}`)
    }

    const result = (await response.json()) as LicenseValidationResult

    await prisma.auditLog.create({
      data: {
        tenantId: systemTenant.id,
        action: 'LICENSE_VALIDATION',
        entity: 'license',
        entityId: key,
        payload: {
          valid: result.valid,
          features: result.features,
          expiresAt: result.expiresAt
        }
      }
    })

    return {
      ...result,
      expiresAt: new Date(result.expiresAt)
    }
  } catch (error) {
    const cached = await prisma.auditLog.findFirst({
      where: {
        tenantId: systemTenant.id,
        entity: 'license',
        entityId: key,
        action: 'LICENSE_VALIDATION'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (cached?.payload && Date.now() - cached.createdAt.getTime() < THIRTY_DAYS_IN_MS) {
      const payload = cached.payload as {
        valid: boolean
        features: string[]
        expiresAt: string
      }

      return {
        valid: payload.valid,
        features: payload.features,
        expiresAt: new Date(payload.expiresAt)
      }
    }

    throw new Error(`Unable to validate license: ${(error as Error).message}`)
  }
}
