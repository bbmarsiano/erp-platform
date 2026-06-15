import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth.store'
import { HelpTooltip } from '../../components/ui'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Супер Админ',
  ADMIN: 'Администратор',
  MANAGER: 'Мениджър',
  OPERATOR: 'Оператор',
  READONLY: 'Само четене'
}

const roleColors: Record<string, { bg: string; color: string }> = {
  SUPER_ADMIN: { bg: '#f3e8ff', color: '#7e22ce' },
  ADMIN: { bg: '#fee2e2', color: '#991b1b' },
  MANAGER: { bg: '#dbeafe', color: '#1e40af' },
  OPERATOR: { bg: '#dcfce7', color: '#166534' },
  READONLY: { bg: '#f3f4f6', color: '#374151' }
}

export default function Users() {
  const currentUser = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'OPERATOR'
  })
  const [formError, setFormError] = useState('')
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    newPassword: ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users').then((r) => r.data.data as User[])
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/api/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'OPERATOR' })
      setFormError('')
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setFormError(err?.response?.data?.error ?? 'Грешка при създаване')
    }
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? api.delete(`/api/users/${id}`) : api.put(`/api/users/${id}`, { isActive: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
  })

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'

  const updateMutation = useMutation({
    mutationFn: (data: {
      id: string
      firstName: string
      lastName: string
      role: string
      newPassword?: string
    }) => {
      const { id, newPassword, ...rest } = data
      return api.put(`/api/users/${id}`, {
        ...rest,
        ...(newPassword ? { newPassword } : {})
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
    }
  })

  const handleRowClick = (user: User) => {
    if (!canManage) return

    if (selectedUser?.id === user.id) {
      setSelectedUser(null)
      return
    }

    setSelectedUser(user)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      newPassword: ''
    })
  }

  return (
    <div style={{ padding: '32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Потребители</h1>
            <HelpTooltip
              title="Потребители"
              content="Управление на достъпа до системата. Ролите определят какво може да прави всеки потребител: SUPER_ADMIN има пълен достъп, READONLY само преглежда данни."
            />
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            Управление на потребителски акаунти и роли
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '9px 18px',
              background: '#111',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + Нов потребител
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 20,
            marginBottom: 20
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Нов потребител</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'firstName', label: 'Име', type: 'text' },
              { key: 'lastName', label: 'Фамилия', type: 'text' },
              { key: 'email', label: 'Имейл', type: 'email' },
              { key: 'password', label: 'Парола', type: 'password' }
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#374151',
                    display: 'block',
                    marginBottom: 4
                  }}
                >
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#374151',
                  display: 'block',
                  marginBottom: 4
                }}
              >
                Роля
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14
                }}
              >
                <option value="OPERATOR">Оператор</option>
                <option value="MANAGER">Мениджър</option>
                <option value="ADMIN">Администратор</option>
                <option value="READONLY">Само четене</option>
              </select>
            </div>
          </div>
          {formError && <p style={{ color: '#dc2626', fontSize: 13, margin: '8px 0 0' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              style={{
                padding: '8px 18px',
                background: '#111',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              {createMutation.isPending ? 'Запазване...' : 'Запази'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 18px',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Отказ
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Зареждане...</div>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            overflow: 'hidden'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Потребител', 'Имейл', 'Роля', 'Статус', 'Дата', 'Действия'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6b7280'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.map((user) => {
                const rc = roleColors[user.role] || roleColors.READONLY
                const isCurrentUser = user.id === currentUser?.id
                const isSelected = selectedUser?.id === user.id
                const isHovered = hoveredUserId === user.id
                return (
                  <>
                  <tr
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    onMouseEnter={() => setHoveredUserId(user.id)}
                    onMouseLeave={() => setHoveredUserId(null)}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: isSelected
                        ? '#f0f9ff'
                        : isHovered
                          ? '#f9fafb'
                          : user.isActive
                            ? 'white'
                            : '#fafafa',
                      cursor: canManage ? 'pointer' : 'default'
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>
                      {user.firstName} {user.lastName}
                      {isCurrentUser && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#6b7280' }}>(аз)</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{user.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: rc.bg,
                          color: rc.color
                        }}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: user.isActive ? '#dcfce7' : '#fee2e2',
                          color: user.isActive ? '#166534' : '#991b1b'
                        }}
                      >
                        {user.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>
                      {new Date(user.createdAt).toLocaleDateString('bg-BG')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {canManage && !isCurrentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleActive.mutate({ id: user.id, isActive: user.isActive })
                          }}
                          style={{
                            padding: '4px 12px',
                            fontSize: 12,
                            cursor: 'pointer',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            background: 'white',
                            color: user.isActive ? '#dc2626' : '#059669'
                          }}
                        >
                          {user.isActive ? 'Деактивирай' : 'Активирай'}
                        </button>
                      )}
                    </td>
                  </tr>

                  {isSelected && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, background: '#f8fafc' }}>
                        <div style={{ padding: '20px 16px', borderBottom: '1px solid #e5e7eb' }}>
                          <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: '#374151' }}>
                            Редактиране: {user.email}
                          </h4>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                            <div>
                              <label
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: '#6b7280',
                                  display: 'block',
                                  marginBottom: 4
                                }}
                              >
                                Име
                              </label>
                              <input
                                value={editForm.firstName}
                                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 6,
                                  fontSize: 13,
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>

                            <div>
                              <label
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: '#6b7280',
                                  display: 'block',
                                  marginBottom: 4
                                }}
                              >
                                Фамилия
                              </label>
                              <input
                                value={editForm.lastName}
                                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 6,
                                  fontSize: 13,
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>

                            <div>
                              <label
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: '#6b7280',
                                  display: 'block',
                                  marginBottom: 4
                                }}
                              >
                                Роля
                              </label>
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 6,
                                  fontSize: 13
                                }}
                              >
                                <option value="OPERATOR">Оператор</option>
                                <option value="MANAGER">Мениджър</option>
                                <option value="ADMIN">Администратор</option>
                                <option value="READONLY">Само четене</option>
                              </select>
                            </div>

                            <div>
                              <label
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: '#6b7280',
                                  display: 'block',
                                  marginBottom: 4
                                }}
                              >
                                Нова парола <span style={{ color: '#9ca3af' }}>(незадължително)</span>
                              </label>
                              <input
                                type="password"
                                value={editForm.newPassword}
                                onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))}
                                placeholder="Остави празно за без промяна"
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 6,
                                  fontSize: 13,
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                            <button
                              onClick={() =>
                                updateMutation.mutate({
                                  id: user.id,
                                  firstName: editForm.firstName,
                                  lastName: editForm.lastName,
                                  role: editForm.role,
                                  ...(editForm.newPassword ? { newPassword: editForm.newPassword } : {})
                                })
                              }
                              disabled={updateMutation.isPending}
                              style={{
                                padding: '7px 16px',
                                background: '#111',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 13,
                                cursor: 'pointer'
                              }}
                            >
                              {updateMutation.isPending ? 'Запазване...' : 'Запази промените'}
                            </button>
                            <button
                              onClick={() => setSelectedUser(null)}
                              style={{
                                padding: '7px 16px',
                                background: 'white',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: 6,
                                fontSize: 13,
                                cursor: 'pointer'
                              }}
                            >
                              Отказ
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
