import { moduleRegistry } from '../lib/moduleRegistry'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'

const Dashboard = () => {
  const modules = moduleRegistry.getModules()

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <h2 style={{ marginTop: 0 }}>Welcome to DFlowERP</h2>
        <p style={{ marginBottom: 8 }}>Company: DFlowERP Demo Tenant</p>
        <Badge>License active - 30 days remaining</Badge>
      </Card>

      <section>
        <h3>Active Modules</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {modules.length === 0 ? (
            <Card>No modules loaded yet. Add future ERP modules in /modules.</Card>
          ) : (
            modules.map((module) => (
              <Card key={module.id}>
                <strong>{module.name}</strong>
                <p style={{ margin: 0 }}>{module.description}</p>
                <small>{module.icon}</small>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
