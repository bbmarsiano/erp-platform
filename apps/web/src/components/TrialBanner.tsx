import { useLicenseInfo } from '../hooks/useLicenseInfo'

const pricingLinkStyle: React.CSSProperties = {
  color: 'white',
  background: 'rgba(255,255,255,0.2)',
  padding: '4px 12px',
  borderRadius: 6,
  textDecoration: 'none',
  fontWeight: 700
}

export function TrialBanner() {
  const { data: licenseInfo } = useLicenseInfo()

  const isTrial = licenseInfo?.billingType === 'trial' || licenseInfo?.isTrial
  const daysRemaining = licenseInfo?.daysRemaining ?? 0

  const isTrialExpired = isTrial && daysRemaining <= 0
  const isTrialExpiring = isTrial && daysRemaining <= 7 && daysRemaining > 0

  if (!isTrialExpired && !isTrialExpiring) return null

  if (isTrialExpired) {
    return (
      <div
        style={{
          background: '#dc2626',
          color: 'white',
          padding: '10px 20px',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}
      >
        <span>⚠️ Trial периодът е изтекъл.</span>
        <a
          href="https://dflowhub.com/#pricing"
          target="_blank"
          rel="noopener noreferrer"
          style={pricingLinkStyle}
        >
          Купи лиценз →
        </a>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#d97706',
        color: 'white',
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
      }}
    >
      <span>⏳ Trial изтича след {daysRemaining} дни.</span>
      <a
        href="https://dflowhub.com/#pricing"
        target="_blank"
        rel="noopener noreferrer"
        style={pricingLinkStyle}
      >
        Виж плановете →
      </a>
    </div>
  )
}
