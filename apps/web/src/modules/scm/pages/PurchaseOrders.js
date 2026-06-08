import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui';
import { WarehouseSelector } from '../../wms/components/WarehouseSelector';
import { useCreatePurchaseOrder, usePurchaseOrders, useSuppliers } from '../hooks/useScm';
const poStatusMap = {
    DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
    SENT: { label: 'Изпратена', bg: '#dbeafe', color: '#1e40af' },
    PARTIALLY_RECEIVED: { label: 'Частично получена', bg: '#fed7aa', color: '#9a3412' },
    RECEIVED: { label: 'Получена', bg: '#dcfce7', color: '#166534' },
    CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' }
};
export default function PurchaseOrders() {
    const navigate = useNavigate();
    const orders = usePurchaseOrders();
    const suppliers = useSuppliers();
    const createOrder = useCreatePurchaseOrder();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ supplierId: '', warehouseId: '', expectedDate: '', note: '' });
    const supplierOptions = (suppliers.data ?? []);
    const rows = useMemo(() => (orders.data ?? []), [orders.data]);
    const onCreate = async () => {
        if (!form.supplierId || !form.warehouseId)
            return;
        const created = await createOrder.mutateAsync({
            supplierId: form.supplierId,
            warehouseId: form.warehouseId,
            expectedDate: form.expectedDate || undefined,
            note: form.note || undefined
        });
        setShowForm(false);
        setForm({ supplierId: '', warehouseId: '', expectedDate: '', note: '' });
        navigate(`/scm/orders/${created.id}`);
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u041F\u043E\u0440\u044A\u0447\u043A\u0438 \u043F\u043E\u043A\u0443\u043F\u043A\u0430", subtitle: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u043F\u043E\u0440\u044A\u0447\u043A\u0438 \u043A\u044A\u043C \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u0446\u0438", action: !showForm ? _jsx(Button, { onClick: () => setShowForm(true), children: "\u041D\u043E\u0432\u0430 \u043F\u043E\u0440\u044A\u0447\u043A\u0430" }) : undefined }), showForm ? (_jsxs(Card, { style: { marginBottom: 20 }, children: [_jsxs(FormRow, { columns: 4, children: [_jsx(FormField, { label: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A", required: true, children: _jsxs(Select, { value: form.supplierId, onChange: (e) => setForm({ ...form, supplierId: e.target.value }), children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }), supplierOptions.map((s) => (_jsxs("option", { value: s.id, children: [s.code, " \u2014 ", s.name] }, s.id)))] }) }), _jsx(FormField, { label: "\u0421\u043A\u043B\u0430\u0434", required: true, children: _jsx(WarehouseSelector, { value: form.warehouseId, onChange: (warehouseId) => setForm({ ...form, warehouseId }) }) }), _jsx(FormField, { label: "\u041E\u0447\u0430\u043A\u0432\u0430\u043D\u0430 \u0434\u0430\u0442\u0430", children: _jsx(Input, { type: "date", value: form.expectedDate, onChange: (e) => setForm({ ...form, expectedDate: e.target.value }) }) }), _jsx(FormField, { label: "\u0411\u0435\u043B\u0435\u0436\u043A\u0430", children: _jsx(Input, { value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }), placeholder: "\u041F\u043E \u0438\u0437\u0431\u043E\u0440" }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setShowForm(false), children: "\u041E\u0442\u043A\u0430\u0437" }), _jsx(Button, { onClick: onCreate, disabled: createOrder.isPending, children: createOrder.isPending ? 'Запис...' : 'Създай' })] })] })) : null, _jsx("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }, children: [_jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041E\u0447\u0430\u043A\u0432\u0430\u043D\u0430 \u0434\u0430\u0442\u0430" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: rows.map((o) => {
                                const st = poStatusMap[o.status] ?? { label: o.status, bg: '#f3f4f6', color: '#374151' };
                                return (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }, children: o.orderNo }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: o.supplier?.name }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: o.warehouse?.name }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(StatusBadge, { label: st.label, bg: st.bg, color: st.color }) }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: o.expectedDate ? new Date(o.expectedDate).toLocaleDateString('bg-BG') : '—' }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate(`/scm/orders/${o.id}`), children: "\u041F\u0440\u0435\u0433\u043B\u0435\u0434" }) })] }, o.id));
                            }) })] }) })] }));
}
