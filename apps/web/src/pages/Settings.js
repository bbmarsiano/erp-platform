import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/api';
function CompanySettings() {
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        api
            .get('/api/tenant')
            .then((r) => {
            setName(r.data.data.name || '');
            setLogoUrl(r.data.data.logoUrl || '');
        })
            .catch(() => { });
    }, []);
    const save = async () => {
        setSaving(true);
        await api.put('/api/tenant', { name, logoUrl: logoUrl || null });
        setSaved(true);
        setSaving(false);
        setTimeout(() => setSaved(false), 3000);
    };
    return (_jsxs("div", { style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 24
        }, children: [_jsx("h2", { style: { fontSize: 16, fontWeight: 600, margin: '0 0 20px' }, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043D\u0430 \u0444\u0438\u0440\u043C\u0430\u0442\u0430" }), _jsxs("div", { style: { display: 'grid', gap: 16, maxWidth: 480 }, children: [_jsxs("div", { children: [_jsx("label", { style: {
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: '#374151',
                                    display: 'block',
                                    marginBottom: 6
                                }, children: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0430 \u0444\u0438\u0440\u043C\u0430\u0442\u0430" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), style: {
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box'
                                } })] }), _jsxs("div", { children: [_jsxs("label", { style: {
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: '#374151',
                                    display: 'block',
                                    marginBottom: 6
                                }, children: ["URL \u043D\u0430 \u043B\u043E\u0433\u043E", _jsx("span", { style: { fontWeight: 400, color: '#9ca3af', marginLeft: 6 }, children: "(\u043B\u0438\u043D\u043A \u043A\u044A\u043C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u2014 https://...)" })] }), _jsx("input", { value: logoUrl, onChange: (e) => setLogoUrl(e.target.value), placeholder: "https://example.com/logo.png", style: {
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    boxSizing: 'border-box'
                                } })] }), logoUrl && (_jsxs("div", { style: {
                            padding: 16,
                            background: '#f9fafb',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb'
                        }, children: [_jsx("div", { style: { fontSize: 12, color: '#6b7280', marginBottom: 8 }, children: "\u041F\u0440\u0435\u0433\u043B\u0435\u0434:" }), _jsx("img", { src: logoUrl, alt: "Logo preview", style: { maxHeight: 48, maxWidth: 200, objectFit: 'contain' }, onError: (e) => {
                                    ;
                                    e.target.style.display = 'none';
                                } }), _jsx("div", { style: { fontSize: 11, color: '#9ca3af', marginTop: 4 }, children: "powered by DFlowERP" })] })), _jsx("button", { onClick: () => void save(), disabled: saving, style: {
                            padding: '10px 20px',
                            background: saving ? '#6b7280' : '#111',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            alignSelf: 'flex-start'
                        }, children: saving ? 'Запазване...' : saved ? '✓ Запазено!' : 'Запази настройките' })] })] }));
}
export default function Settings() {
    const user = useAuthStore((s) => s.user);
    const [activeTab, setActiveTab] = useState('profile');
    const tabs = [
        { id: 'profile', label: 'Профил' },
        { id: 'system', label: 'Система' },
        { id: 'license', label: 'Лиценз' },
        { id: 'company', label: 'Фирма' }
    ];
    return (_jsxs("div", { style: { padding: '32px', maxWidth: 800 }, children: [_jsx("h1", { style: { fontSize: 22, fontWeight: 600, margin: '0 0 24px' }, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }), _jsx("div", { style: {
                    display: 'flex',
                    gap: 4,
                    marginBottom: 24,
                    borderBottom: '1px solid #e5e7eb'
                }, children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), style: {
                        padding: '8px 16px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        color: activeTab === tab.id ? '#111' : '#6b7280',
                        borderBottom: activeTab === tab.id ? '2px solid #111' : '2px solid transparent',
                        marginBottom: -1
                    }, children: tab.label }, tab.id))) }), activeTab === 'profile' && (_jsxs("div", { style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: 24
                }, children: [_jsx("h2", { style: { fontSize: 16, fontWeight: 600, margin: '0 0 20px' }, children: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0437\u0430 \u043F\u0440\u043E\u0444\u0438\u043B\u0430" }), _jsxs("div", { style: { display: 'grid', gap: 16 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }, children: "\u0418\u043C\u0435\u0439\u043B" }), _jsx("div", { style: {
                                            fontSize: 14,
                                            padding: '10px 12px',
                                            background: '#f9fafb',
                                            borderRadius: 8,
                                            border: '1px solid #e5e7eb'
                                        }, children: user?.email })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }, children: "\u0420\u043E\u043B\u044F" }), _jsx("div", { style: {
                                            fontSize: 14,
                                            padding: '10px 12px',
                                            background: '#f9fafb',
                                            borderRadius: 8,
                                            border: '1px solid #e5e7eb'
                                        }, children: user?.role })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }, children: "Tenant ID" }), _jsx("div", { style: {
                                            fontSize: 13,
                                            padding: '10px 12px',
                                            fontFamily: 'monospace',
                                            background: '#f9fafb',
                                            borderRadius: 8,
                                            border: '1px solid #e5e7eb',
                                            color: '#6b7280'
                                        }, children: user?.tenantId })] })] })] })), activeTab === 'system' && (_jsxs("div", { style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: 24
                }, children: [_jsx("h2", { style: { fontSize: 16, fontWeight: 600, margin: '0 0 20px' }, children: "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0430 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }), _jsx("div", { style: { display: 'grid', gap: 12, fontSize: 14 }, children: [
                            { label: 'Версия', value: 'DFlowERP v0.1.0' },
                            { label: 'API URL', value: import.meta.env.VITE_API_URL || 'http://localhost:3001' },
                            { label: 'Среда', value: import.meta.env.MODE },
                            {
                                label: 'API Документация',
                                value: (_jsx("a", { href: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/docs`, target: "_blank", rel: "noreferrer", style: { color: '#2563eb' }, children: "\u041E\u0442\u0432\u043E\u0440\u0438 Swagger UI \u2192" }))
                            }
                        ].map(({ label, value }) => (_jsxs("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                background: '#f9fafb',
                                borderRadius: 8,
                                border: '1px solid #e5e7eb'
                            }, children: [_jsx("span", { style: { fontWeight: 500, color: '#374151' }, children: label }), _jsx("span", { style: { color: '#6b7280' }, children: value })] }, label))) })] })), activeTab === 'license' && (_jsxs("div", { style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: 24
                }, children: [_jsx("h2", { style: { fontSize: 16, fontWeight: 600, margin: '0 0 20px' }, children: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0437\u0430 \u043B\u0438\u0446\u0435\u043D\u0437\u0430" }), _jsx("div", { style: { display: 'grid', gap: 12, fontSize: 14 }, children: [
                            { label: 'Лиценз ключ', value: 'DEMO-0000-0000-0000' },
                            {
                                label: 'Статус',
                                value: (_jsx("span", { style: {
                                        padding: '2px 10px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        background: '#dcfce7',
                                        color: '#166534'
                                    }, children: "\u0410\u043A\u0442\u0438\u0432\u0435\u043D" }))
                            },
                            {
                                label: 'Активни модули',
                                value: (_jsx("div", { style: { display: 'flex', gap: 4, flexWrap: 'wrap' }, children: ['WMS', 'SCM', 'MES', 'POS', 'Backup'].map((m) => (_jsx("span", { style: {
                                            padding: '2px 8px',
                                            borderRadius: 20,
                                            fontSize: 11,
                                            background: '#dbeafe',
                                            color: '#1e40af'
                                        }, children: m }, m))) }))
                            }
                        ].map(({ label, value }) => (_jsxs("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                background: '#f9fafb',
                                borderRadius: 8,
                                border: '1px solid #e5e7eb'
                            }, children: [_jsx("span", { style: { fontWeight: 500, color: '#374151' }, children: label }), _jsx("span", { children: value })] }, label))) })] })), activeTab === 'company' && _jsx(CompanySettings, {})] }));
}
