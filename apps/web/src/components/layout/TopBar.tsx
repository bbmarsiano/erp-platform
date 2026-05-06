export const TopBar = () => (
  <header
    style={{
      height: 64,
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      backgroundColor: '#fff'
    }}
  >
    <h1 style={{ fontSize: 18, margin: 0 }}>DFlowERP</h1>
    <small style={{ color: '#6b7280' }}>Core shell v0.1.0</small>
  </header>
)
