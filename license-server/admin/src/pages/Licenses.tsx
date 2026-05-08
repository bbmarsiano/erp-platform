import { useEffect, useState } from 'react'
import { LicenseKey, supabase } from '../lib/supabase'

export default function Licenses() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([])

  const loadLicenses = async () => {
    const { data } = await supabase
      .from('license_keys')
      .select('*, tenant:tenants(*)')
      .order('created_at', { ascending: false })
    setLicenses((data as LicenseKey[]) ?? [])
  }

  useEffect(() => {
    void loadLicenses()
  }, [])

  const deactivate = async (id: string) => {
    await supabase.from('license_keys').update({ is_active: false }).eq('id', id)
    await loadLicenses()
  }

  const masked = (key: string) => `${key.slice(0, 4)}****`

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Лицензи</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Ключ</th>
            <th align="left">Клиент</th>
            <th align="left">Изтича</th>
            <th align="left">Последна валидация</th>
            <th align="left">Инсталации</th>
            <th align="left">Статус</th>
            <th align="left">Действие</th>
          </tr>
        </thead>
        <tbody>
          {licenses.map((license) => (
            <tr key={license.id}>
              <td>
                <button onClick={() => void navigator.clipboard.writeText(license.key)} title="Копирай ключ">
                  {masked(license.key)}
                </button>
              </td>
              <td>{license.tenant?.name ?? '-'}</td>
              <td>{new Date(license.expires_at).toLocaleDateString('bg-BG')}</td>
              <td>{license.last_validated_at ? new Date(license.last_validated_at).toLocaleString('bg-BG') : '-'}</td>
              <td>{license.install_count}</td>
              <td>{license.is_active ? 'Активен' : 'Неактивен'}</td>
              <td>
                <button disabled={!license.is_active} onClick={() => void deactivate(license.id)}>
                  Deactivate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

