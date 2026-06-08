import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui';
import { useCreateSupplier, useSuppliers } from '../hooks/useScm';
export default function Suppliers() {
    const suppliers = useSuppliers();
    const createSupplier = useCreateSupplier();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        code: '',
        name: '',
        contactName: '',
        phone: '',
        email: ''
    });
    const onCreate = async () => {
        if (!form.code || !form.name)
            return;
        await createSupplier.mutateAsync({
            code: form.code,
            name: form.name,
            contactName: form.contactName || undefined,
            phone: form.phone || undefined,
            email: form.email || undefined
        });
        setForm({ code: '', name: '', contactName: '', phone: '', email: '' });
        setShowForm(false);
    };
    const rows = (suppliers.data ?? []);
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u0446\u0438", subtitle: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u0446\u0438", action: !showForm ? _jsx(Button, { onClick: () => setShowForm(true), children: "\u041D\u043E\u0432 \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }) : undefined }), showForm ? (_jsxs(Card, { style: { marginBottom: 20 }, children: [_jsxs(FormRow, { columns: 5, children: [_jsx(FormField, { label: "\u041A\u043E\u0434", required: true, children: _jsx(Input, { value: form.code, onChange: (e) => setForm({ ...form, code: e.target.value }), placeholder: "SUP-01" }) }), _jsx(FormField, { label: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435", required: true, children: _jsx(Input, { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "\u0418\u043C\u0435 \u043D\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }) }), _jsx(FormField, { label: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442", children: _jsx(Input, { value: form.contactName, onChange: (e) => setForm({ ...form, contactName: e.target.value }), placeholder: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E \u043B\u0438\u0446\u0435" }) }), _jsx(FormField, { label: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", children: _jsx(Input, { value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), placeholder: "+359..." }) }), _jsx(FormField, { label: "Email", children: _jsx(Input, { value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), placeholder: "email@example.com" }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setShowForm(false), children: "\u041E\u0442\u043A\u0430\u0437" }), _jsx(Button, { onClick: onCreate, disabled: createSupplier.isPending, children: createSupplier.isPending ? 'Запис...' : 'Създай' })] })] })) : null, _jsx("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }, children: [_jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "Email" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" })] }) }), _jsx("tbody", { children: rows.map((s) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }, children: s.code }), _jsx("td", { style: { padding: '12px 16px', fontWeight: 700, fontSize: 13 }, children: s.name }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: s.contactName ?? '—' }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: s.phone ?? '—' }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: s.email ?? '—' }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: s.isActive ? 'Активен' : 'Неактивен' })] }, s.id))) })] }) })] }));
}
