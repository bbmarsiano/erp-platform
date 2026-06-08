import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
const roleLabels = {
    SUPER_ADMIN: 'Супер Админ',
    ADMIN: 'Администратор',
    MANAGER: 'Мениджър',
    OPERATOR: 'Оператор',
    READONLY: 'Само четене'
};
const roleColors = {
    SUPER_ADMIN: { bg: '#f3e8ff', color: '#7e22ce' },
    ADMIN: { bg: '#fee2e2', color: '#991b1b' },
    MANAGER: { bg: '#dbeafe', color: '#1e40af' },
    OPERATOR: { bg: '#dcfce7', color: '#166534' },
    READONLY: { bg: '#f3f4f6', color: '#374151' }
};
export default function Users() {
    const currentUser = useAuthStore((s) => s.user);
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [hoveredUserId, setHoveredUserId] = useState(null);
    const [form, setForm] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'OPERATOR'
    });
    const [formError, setFormError] = useState('');
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        role: '',
        newPassword: ''
    });
    const { data, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/api/users').then((r) => r.data.data)
    });
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/api/users', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
            setShowForm(false);
            setForm({ email: '', password: '', firstName: '', lastName: '', role: 'OPERATOR' });
            setFormError('');
        },
        onError: (err) => {
            setFormError(err?.response?.data?.error ?? 'Грешка при създаване');
        }
    });
    const toggleActive = useMutation({
        mutationFn: ({ id, isActive }) => isActive ? api.delete(`/api/users/${id}`) : api.put(`/api/users/${id}`, { isActive: true }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
    });
    const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
    const updateMutation = useMutation({
        mutationFn: (data) => {
            const { id, newPassword, ...rest } = data;
            return api.put(`/api/users/${id}`, {
                ...rest,
                ...(newPassword ? { newPassword } : {})
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
            setSelectedUser(null);
        }
    });
    const handleRowClick = (user) => {
        if (!canManage)
            return;
        if (selectedUser?.id === user.id) {
            setSelectedUser(null);
            return;
        }
        setSelectedUser(user);
        setEditForm({
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            newPassword: ''
        });
    };
    return (_jsxs("div", { style: { padding: '32px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24
                }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontSize: 22, fontWeight: 600, margin: 0 }, children: "\u041F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u0438" }), _jsx("p", { style: { fontSize: 13, color: '#6b7280', margin: '4px 0 0' }, children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u043F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u0441\u043A\u0438 \u0430\u043A\u0430\u0443\u043D\u0442\u0438 \u0438 \u0440\u043E\u043B\u0438" })] }), canManage && (_jsx("button", { onClick: () => setShowForm(!showForm), style: {
                            padding: '9px 18px',
                            background: '#111',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer'
                        }, children: "+ \u041D\u043E\u0432 \u043F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B" }))] }), showForm && (_jsxs("div", { style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 20
                }, children: [_jsx("h3", { style: { fontSize: 15, fontWeight: 600, margin: '0 0 16px' }, children: "\u041D\u043E\u0432 \u043F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, children: [[
                                { key: 'firstName', label: 'Име', type: 'text' },
                                { key: 'lastName', label: 'Фамилия', type: 'text' },
                                { key: 'email', label: 'Имейл', type: 'email' },
                                { key: 'password', label: 'Парола', type: 'password' }
                            ].map(({ key, label, type }) => (_jsxs("div", { children: [_jsx("label", { style: {
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: '#374151',
                                            display: 'block',
                                            marginBottom: 4
                                        }, children: label }), _jsx("input", { type: type, value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: 6,
                                            fontSize: 14,
                                            boxSizing: 'border-box'
                                        } })] }, key))), _jsxs("div", { children: [_jsx("label", { style: {
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: '#374151',
                                            display: 'block',
                                            marginBottom: 4
                                        }, children: "\u0420\u043E\u043B\u044F" }), _jsxs("select", { value: form.role, onChange: (e) => setForm((f) => ({ ...f, role: e.target.value })), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: 6,
                                            fontSize: 14
                                        }, children: [_jsx("option", { value: "OPERATOR", children: "\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440" }), _jsx("option", { value: "MANAGER", children: "\u041C\u0435\u043D\u0438\u0434\u0436\u044A\u0440" }), _jsx("option", { value: "ADMIN", children: "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440" }), _jsx("option", { value: "READONLY", children: "\u0421\u0430\u043C\u043E \u0447\u0435\u0442\u0435\u043D\u0435" })] })] })] }), formError && _jsx("p", { style: { color: '#dc2626', fontSize: 13, margin: '8px 0 0' }, children: formError }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 16 }, children: [_jsx("button", { onClick: () => createMutation.mutate(form), disabled: createMutation.isPending, style: {
                                    padding: '8px 18px',
                                    background: '#111',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontSize: 14,
                                    cursor: 'pointer'
                                }, children: createMutation.isPending ? 'Запазване...' : 'Запази' }), _jsx("button", { onClick: () => setShowForm(false), style: {
                                    padding: '8px 18px',
                                    background: 'white',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    fontSize: 14,
                                    cursor: 'pointer'
                                }, children: "\u041E\u0442\u043A\u0430\u0437" })] })] })), isLoading ? (_jsx("div", { style: { padding: 40, textAlign: 'center', color: '#9ca3af' }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." })) : (_jsx("div", { style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    overflow: 'hidden'
                }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsx("tr", { style: { background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }, children: ['Потребител', 'Имейл', 'Роля', 'Статус', 'Дата', 'Действия'].map((h) => (_jsx("th", { style: {
                                        padding: '10px 16px',
                                        textAlign: 'left',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#6b7280'
                                    }, children: h }, h))) }) }), _jsx("tbody", { children: data?.map((user) => {
                                const rc = roleColors[user.role] || roleColors.READONLY;
                                const isCurrentUser = user.id === currentUser?.id;
                                const isSelected = selectedUser?.id === user.id;
                                const isHovered = hoveredUserId === user.id;
                                return (_jsxs(_Fragment, { children: [_jsxs("tr", { onClick: () => handleRowClick(user), onMouseEnter: () => setHoveredUserId(user.id), onMouseLeave: () => setHoveredUserId(null), style: {
                                                borderBottom: '1px solid #f3f4f6',
                                                background: isSelected
                                                    ? '#f0f9ff'
                                                    : isHovered
                                                        ? '#f9fafb'
                                                        : user.isActive
                                                            ? 'white'
                                                            : '#fafafa',
                                                cursor: canManage ? 'pointer' : 'default'
                                            }, children: [_jsxs("td", { style: { padding: '12px 16px', fontSize: 14, fontWeight: 500 }, children: [user.firstName, " ", user.lastName, isCurrentUser && (_jsx("span", { style: { marginLeft: 6, fontSize: 11, color: '#6b7280' }, children: "(\u0430\u0437)" }))] }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13, color: '#6b7280' }, children: user.email }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx("span", { style: {
                                                            padding: '2px 10px',
                                                            borderRadius: 20,
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            background: rc.bg,
                                                            color: rc.color
                                                        }, children: roleLabels[user.role] || user.role }) }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx("span", { style: {
                                                            padding: '2px 10px',
                                                            borderRadius: 20,
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            background: user.isActive ? '#dcfce7' : '#fee2e2',
                                                            color: user.isActive ? '#166534' : '#991b1b'
                                                        }, children: user.isActive ? 'Активен' : 'Неактивен' }) }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13, color: '#9ca3af' }, children: new Date(user.createdAt).toLocaleDateString('bg-BG') }), _jsx("td", { style: { padding: '12px 16px' }, children: canManage && !isCurrentUser && (_jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            toggleActive.mutate({ id: user.id, isActive: user.isActive });
                                                        }, style: {
                                                            padding: '4px 12px',
                                                            fontSize: 12,
                                                            cursor: 'pointer',
                                                            border: '1px solid #d1d5db',
                                                            borderRadius: 6,
                                                            background: 'white',
                                                            color: user.isActive ? '#dc2626' : '#059669'
                                                        }, children: user.isActive ? 'Деактивирай' : 'Активирай' })) })] }, user.id), isSelected && (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { padding: 0, background: '#f8fafc' }, children: _jsxs("div", { style: { padding: '20px 16px', borderBottom: '1px solid #e5e7eb' }, children: [_jsxs("h4", { style: { fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: '#374151' }, children: ["\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0430\u043D\u0435: ", user.email] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }, children: [_jsxs("div", { children: [_jsx("label", { style: {
                                                                                fontSize: 12,
                                                                                fontWeight: 500,
                                                                                color: '#6b7280',
                                                                                display: 'block',
                                                                                marginBottom: 4
                                                                            }, children: "\u0418\u043C\u0435" }), _jsx("input", { value: editForm.firstName, onChange: (e) => setEditForm((f) => ({ ...f, firstName: e.target.value })), style: {
                                                                                width: '100%',
                                                                                padding: '7px 10px',
                                                                                border: '1px solid #d1d5db',
                                                                                borderRadius: 6,
                                                                                fontSize: 13,
                                                                                boxSizing: 'border-box'
                                                                            } })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                                                                fontSize: 12,
                                                                                fontWeight: 500,
                                                                                color: '#6b7280',
                                                                                display: 'block',
                                                                                marginBottom: 4
                                                                            }, children: "\u0424\u0430\u043C\u0438\u043B\u0438\u044F" }), _jsx("input", { value: editForm.lastName, onChange: (e) => setEditForm((f) => ({ ...f, lastName: e.target.value })), style: {
                                                                                width: '100%',
                                                                                padding: '7px 10px',
                                                                                border: '1px solid #d1d5db',
                                                                                borderRadius: 6,
                                                                                fontSize: 13,
                                                                                boxSizing: 'border-box'
                                                                            } })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                                                                fontSize: 12,
                                                                                fontWeight: 500,
                                                                                color: '#6b7280',
                                                                                display: 'block',
                                                                                marginBottom: 4
                                                                            }, children: "\u0420\u043E\u043B\u044F" }), _jsxs("select", { value: editForm.role, onChange: (e) => setEditForm((f) => ({ ...f, role: e.target.value })), style: {
                                                                                width: '100%',
                                                                                padding: '7px 10px',
                                                                                border: '1px solid #d1d5db',
                                                                                borderRadius: 6,
                                                                                fontSize: 13
                                                                            }, children: [_jsx("option", { value: "OPERATOR", children: "\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440" }), _jsx("option", { value: "MANAGER", children: "\u041C\u0435\u043D\u0438\u0434\u0436\u044A\u0440" }), _jsx("option", { value: "ADMIN", children: "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440" }), _jsx("option", { value: "READONLY", children: "\u0421\u0430\u043C\u043E \u0447\u0435\u0442\u0435\u043D\u0435" })] })] }), _jsxs("div", { children: [_jsxs("label", { style: {
                                                                                fontSize: 12,
                                                                                fontWeight: 500,
                                                                                color: '#6b7280',
                                                                                display: 'block',
                                                                                marginBottom: 4
                                                                            }, children: ["\u041D\u043E\u0432\u0430 \u043F\u0430\u0440\u043E\u043B\u0430 ", _jsx("span", { style: { color: '#9ca3af' }, children: "(\u043D\u0435\u0437\u0430\u0434\u044A\u043B\u0436\u0438\u0442\u0435\u043B\u043D\u043E)" })] }), _jsx("input", { type: "password", value: editForm.newPassword, onChange: (e) => setEditForm((f) => ({ ...f, newPassword: e.target.value })), placeholder: "\u041E\u0441\u0442\u0430\u0432\u0438 \u043F\u0440\u0430\u0437\u043D\u043E \u0437\u0430 \u0431\u0435\u0437 \u043F\u0440\u043E\u043C\u044F\u043D\u0430", style: {
                                                                                width: '100%',
                                                                                padding: '7px 10px',
                                                                                border: '1px solid #d1d5db',
                                                                                borderRadius: 6,
                                                                                fontSize: 13,
                                                                                boxSizing: 'border-box'
                                                                            } })] })] }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 14 }, children: [_jsx("button", { onClick: () => updateMutation.mutate({
                                                                        id: user.id,
                                                                        firstName: editForm.firstName,
                                                                        lastName: editForm.lastName,
                                                                        role: editForm.role,
                                                                        ...(editForm.newPassword ? { newPassword: editForm.newPassword } : {})
                                                                    }), disabled: updateMutation.isPending, style: {
                                                                        padding: '7px 16px',
                                                                        background: '#111',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: 6,
                                                                        fontSize: 13,
                                                                        cursor: 'pointer'
                                                                    }, children: updateMutation.isPending ? 'Запазване...' : 'Запази промените' }), _jsx("button", { onClick: () => setSelectedUser(null), style: {
                                                                        padding: '7px 16px',
                                                                        background: 'white',
                                                                        color: '#374151',
                                                                        border: '1px solid #d1d5db',
                                                                        borderRadius: 6,
                                                                        fontSize: 13,
                                                                        cursor: 'pointer'
                                                                    }, children: "\u041E\u0442\u043A\u0430\u0437" })] })] }) }) }))] }));
                            }) })] }) }))] }));
}
