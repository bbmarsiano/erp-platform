import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui';
import { StatusBadge } from '../components/StatusBadge';
import { WarehouseSelector } from '../components/WarehouseSelector';
import { useCreateReceipt, useReceipts, useWarehouses } from '../hooks/useWms';
export default function Receipts() {
    const navigate = useNavigate();
    const receipts = useReceipts();
    const warehouses = useWarehouses();
    const createReceipt = useCreateReceipt();
    const [showForm, setShowForm] = useState(false);
    const [warehouseId, setWarehouseId] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [note, setNote] = useState('');
    const rows = useMemo(() => (receipts.data ?? []), [receipts.data]);
    const warehouseMap = useMemo(() => {
        const ws = (warehouses.data ?? []);
        return new Map(ws.map((w) => [w.id, `${w.code} — ${w.name}`]));
    }, [warehouses.data]);
    const onSubmit = async () => {
        if (!warehouseId)
            return;
        const created = await createReceipt.mutateAsync({
            warehouseId,
            supplierName: supplierName.trim() || undefined,
            note: note.trim() || undefined
        });
        setShowForm(false);
        setWarehouseId('');
        setSupplierName('');
        setNote('');
        if (created?.id)
            navigate(`/wms/receipts/${created.id}`);
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u041F\u0440\u0438\u0445\u043E\u0434\u043D\u0438", subtitle: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438 \u0437\u0430 \u043F\u0440\u0438\u0435\u043C\u0430\u043D\u0435 \u043D\u0430 \u0441\u0442\u043E\u043A\u0430", action: !showForm ? _jsx(Button, { onClick: () => setShowForm(true), children: "\u041D\u043E\u0432\u0430 \u043F\u0440\u0438\u0445\u043E\u0434\u043D\u0430 \u0431\u0435\u043B\u0435\u0436\u043A\u0430" }) : undefined }), showForm ? (_jsxs(Card, { style: { marginBottom: 20 }, children: [_jsxs(FormRow, { columns: 3, children: [_jsx(FormField, { label: "\u0421\u043A\u043B\u0430\u0434", required: true, children: _jsx(WarehouseSelector, { value: warehouseId, onChange: setWarehouseId, placeholder: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u0441\u043A\u043B\u0430\u0434" }) }), _jsx(FormField, { label: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A", children: _jsx(Input, { value: supplierName, onChange: (e) => setSupplierName(e.target.value), placeholder: "\u0418\u043C\u0435 \u043D\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }) }), _jsx(FormField, { label: "\u0411\u0435\u043B\u0435\u0436\u043A\u0430", children: _jsx(Input, { value: note, onChange: (e) => setNote(e.target.value), placeholder: "\u041F\u043E \u0438\u0437\u0431\u043E\u0440" }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setShowForm(false), children: "\u041E\u0442\u043A\u0430\u0437" }), _jsx(Button, { onClick: onSubmit, disabled: createReceipt.isPending, children: createReceipt.isPending ? 'Запис...' : 'Създай' })] })] })) : null, _jsx("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }, children: [_jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u0430\u0442\u0430" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: receipts.isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { padding: 12, color: '#6b7280' }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." }) })) : receipts.error ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { padding: 12, color: '#991b1b' }, children: "\u0413\u0440\u0435\u0448\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435 \u043D\u0430 \u043F\u0440\u0438\u0445\u043E\u0434\u043D\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438" }) })) : rows.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { padding: 12, color: '#6b7280' }, children: "\u041D\u044F\u043C\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438" }) })) : (rows.map((r) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }, children: r.receiptNo }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: warehouseMap.get(r.warehouseId) ?? '—' }), _jsx("td", { style: { padding: '12px 16px', color: '#6b7280', fontSize: 13 }, children: r.supplierName ?? '—' }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(StatusBadge, { status: r.status }) }), _jsx("td", { style: { padding: '12px 16px', color: '#6b7280', fontSize: 13 }, children: r.createdAt ? new Date(r.createdAt).toLocaleString('bg-BG') : '—' }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate(`/wms/receipts/${r.id}`), children: "\u041F\u0440\u0435\u0433\u043B\u0435\u0434" }) })] }, r.id)))) })] }) })] }));
}
