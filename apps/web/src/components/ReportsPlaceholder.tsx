export default function ReportsPlaceholder({ module }: { module: string }) {
  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
        Справки
      </h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 32px' }}>{module}</p>
      <div
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Справките са в разработка
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af', maxWidth: 400, margin: '0 auto' }}>
          Модулът за справки и анализи ще бъде добавен в следващата версия на DFlowERP.
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 20,
            padding: '6px 16px',
            background: '#f3f4f6',
            borderRadius: 20,
            fontSize: 12,
            color: '#6b7280',
            fontWeight: 500
          }}
        >
          Очаквайте в v0.2.0
        </div>
      </div>
    </div>
  )
}
