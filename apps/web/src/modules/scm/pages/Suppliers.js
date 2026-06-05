import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
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
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u0446\u0438" }), _jsx(Button, { onClick: () => setShowForm((x) => !x), children: showForm ? 'Отказ' : 'Нов доставчик' })] }), showForm ? (_jsxs("div", { style: {
                    marginTop: 12,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: 14,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr)) auto',
                    gap: 10,
                    alignItems: 'end'
                }, children: [_jsx("input", { placeholder: "\u041A\u043E\u0434", value: form.code, onChange: (e) => setForm({ ...form, code: e.target.value }), style: { padding: 8 } }), _jsx("input", { placeholder: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), style: { padding: 8 } }), _jsx("input", { placeholder: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442", value: form.contactName, onChange: (e) => setForm({ ...form, contactName: e.target.value }), style: { padding: 8 } }), _jsx("input", { placeholder: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), style: { padding: 8 } }), _jsx("input", { placeholder: "Email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), style: { padding: 8 } }), _jsx(Button, { onClick: onCreate, disabled: createSupplier.isPending, children: createSupplier.isPending ? 'Запис...' : 'Създай' })] })) : null, _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442" }), _jsx("th", { style: { padding: 10 }, children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" }), _jsx("th", { style: { padding: 10 }, children: "Email" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" })] }) }), _jsx("tbody", { children: rows.map((s) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: s.code }), _jsx("td", { style: { padding: 10, fontWeight: 700 }, children: s.name }), _jsx("td", { style: { padding: 10 }, children: s.contactName ?? '—' }), _jsx("td", { style: { padding: 10 }, children: s.phone ?? '—' }), _jsx("td", { style: { padding: 10 }, children: s.email ?? '—' }), _jsx("td", { style: { padding: 10 }, children: s.isActive ? 'Активен' : 'Неактивен' })] }, s.id))) })] }) })] }));
}
