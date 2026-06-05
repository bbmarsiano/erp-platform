import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../components/StatusBadge';
import { useCreateWarehouse, useWarehouses } from '../hooks/useWms';
export default function Warehouses() {
    const { data, isLoading, error } = useWarehouses();
    const createWarehouse = useCreateWarehouse();
    const [showForm, setShowForm] = useState(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const rows = useMemo(() => (data ?? []), [data]);
    const onSubmit = async () => {
        if (!code.trim() || !name.trim())
            return;
        await createWarehouse.mutateAsync({ code: code.trim(), name: name.trim(), address: address.trim() || undefined });
        setCode('');
        setName('');
        setAddress('');
        setShowForm(false);
    };
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u0421\u043A\u043B\u0430\u0434\u043E\u0432\u0435" }), _jsx("div", { style: { marginTop: 4, color: '#6b7280', fontSize: 13 }, children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u0441\u043A\u043B\u0430\u0434\u043E\u0432\u0435 \u0438 \u0430\u0434\u0440\u0435\u0441\u0438" })] }), _jsx(Button, { onClick: () => setShowForm((v) => !v), children: showForm ? 'Отказ' : 'Нов склад' })] }), showForm ? (_jsxs("div", { style: {
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 14,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr auto',
                    gap: 10,
                    alignItems: 'end'
                }, children: [_jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }, children: ["\u041A\u043E\u0434", _jsx("input", { value: code, onChange: (e) => setCode(e.target.value), placeholder: "WH-01", style: { padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' } })] }), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }, children: ["\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435", _jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "\u041E\u0441\u043D\u043E\u0432\u0435\u043D \u0441\u043A\u043B\u0430\u0434", style: { padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' } })] }), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }, children: ["\u0410\u0434\u0440\u0435\u0441", _jsx("input", { value: address, onChange: (e) => setAddress(e.target.value), placeholder: "\u0421\u043E\u0444\u0438\u044F, \u0411\u044A\u043B\u0433\u0430\u0440\u0438\u044F", style: { padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' } })] }), _jsx(Button, { onClick: onSubmit, disabled: createWarehouse.isPending, style: { height: 38 }, children: createWarehouse.isPending ? 'Запис...' : 'Създай' })] })) : null, _jsx("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435" }), _jsx("th", { style: { padding: 10 }, children: "\u0410\u0434\u0440\u0435\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, style: { padding: 12, color: '#6b7280' }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." }) })) : error ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, style: { padding: 12, color: '#991b1b' }, children: "\u0413\u0440\u0435\u0448\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435 \u043D\u0430 \u0441\u043A\u043B\u0430\u0434\u043E\u0432\u0435" }) })) : rows.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, style: { padding: 12, color: '#6b7280' }, children: "\u041D\u044F\u043C\u0430 \u0441\u043A\u043B\u0430\u0434\u043E\u0432\u0435" }) })) : (rows.map((w) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: w.code }), _jsx("td", { style: { padding: 10, fontWeight: 700 }, children: w.name }), _jsx("td", { style: { padding: 10, color: '#6b7280' }, children: w.address ?? '—' }), _jsx("td", { style: { padding: 10 }, children: w.isActive ? _jsx(StatusBadge, { status: "CONFIRMED" }) : _jsx(StatusBadge, { status: "CANCELLED" }) }), _jsx("td", { style: { padding: 10, color: '#6b7280' }, children: "\u2014" })] }, w.id)))) })] }) })] }));
}
