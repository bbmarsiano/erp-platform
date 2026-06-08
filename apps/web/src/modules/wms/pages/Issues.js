import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui';
import { StatusBadge } from '../components/StatusBadge';
import { WarehouseSelector } from '../components/WarehouseSelector';
import { useCreateIssue, useIssues, useWarehouses } from '../hooks/useWms';
export default function Issues() {
    const navigate = useNavigate();
    const issues = useIssues();
    const warehouses = useWarehouses();
    const createIssue = useCreateIssue();
    const [showForm, setShowForm] = useState(false);
    const [warehouseId, setWarehouseId] = useState('');
    const [destination, setDestination] = useState('');
    const [note, setNote] = useState('');
    const rows = useMemo(() => (issues.data ?? []), [issues.data]);
    const warehouseMap = useMemo(() => {
        const ws = (warehouses.data ?? []);
        return new Map(ws.map((w) => [w.id, `${w.code} — ${w.name}`]));
    }, [warehouses.data]);
    const onSubmit = async () => {
        if (!warehouseId)
            return;
        const created = await createIssue.mutateAsync({
            warehouseId,
            destination: destination.trim() || undefined,
            note: note.trim() || undefined
        });
        setShowForm(false);
        setWarehouseId('');
        setDestination('');
        setNote('');
        if (created?.id)
            navigate(`/wms/issues/${created.id}`);
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0415\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u0438", subtitle: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438 \u0437\u0430 \u0438\u0437\u043F\u0438\u0441\u0432\u0430\u043D\u0435 \u043D\u0430 \u0441\u0442\u043E\u043A\u0430", action: !showForm ? _jsx(Button, { onClick: () => setShowForm(true), children: "\u041D\u043E\u0432\u0430 \u0435\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u044F" }) : undefined }), showForm ? (_jsxs(Card, { style: { marginBottom: 20 }, children: [_jsxs(FormRow, { columns: 3, children: [_jsx(FormField, { label: "\u0421\u043A\u043B\u0430\u0434", required: true, children: _jsx(WarehouseSelector, { value: warehouseId, onChange: setWarehouseId, placeholder: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u0441\u043A\u043B\u0430\u0434" }) }), _jsx(FormField, { label: "\u0414\u0435\u0441\u0442\u0438\u043D\u0430\u0446\u0438\u044F", children: _jsx(Input, { value: destination, onChange: (e) => setDestination(e.target.value), placeholder: "\u041A\u043B\u0438\u0435\u043D\u0442 / \u0430\u0434\u0440\u0435\u0441" }) }), _jsx(FormField, { label: "\u0411\u0435\u043B\u0435\u0436\u043A\u0430", children: _jsx(Input, { value: note, onChange: (e) => setNote(e.target.value), placeholder: "\u041F\u043E \u0438\u0437\u0431\u043E\u0440" }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setShowForm(false), children: "\u041E\u0442\u043A\u0430\u0437" }), _jsx(Button, { onClick: onSubmit, disabled: createIssue.isPending, children: createIssue.isPending ? 'Запис...' : 'Създай' })] })] })) : null, _jsx("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }, children: [_jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u0435\u0441\u0442\u0438\u043D\u0430\u0446\u0438\u044F" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u0430\u0442\u0430" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: issues.isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { padding: 12, color: '#6b7280' }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." }) })) : issues.error ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { padding: 12, color: '#991b1b' }, children: "\u0413\u0440\u0435\u0448\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435 \u043D\u0430 \u0435\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u0438" }) })) : rows.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { padding: 12, color: '#6b7280' }, children: "\u041D\u044F\u043C\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438" }) })) : (rows.map((r) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }, children: r.issueNo }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: warehouseMap.get(r.warehouseId) ?? '—' }), _jsx("td", { style: { padding: '12px 16px', color: '#6b7280', fontSize: 13 }, children: r.destination ?? '—' }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(StatusBadge, { status: r.status }) }), _jsx("td", { style: { padding: '12px 16px', color: '#6b7280', fontSize: 13 }, children: r.createdAt ? new Date(r.createdAt).toLocaleString('bg-BG') : '—' }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate(`/wms/issues/${r.id}`), children: "\u041F\u0440\u0435\u0433\u043B\u0435\u0434" }) })] }, r.id)))) })] }) })] }));
}
