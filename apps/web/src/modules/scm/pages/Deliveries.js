import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui';
import { WarehouseSelector } from '../../wms/components/WarehouseSelector';
import { useCreateDelivery, useDeliveries, usePurchaseOrders } from '../hooks/useScm';
const deliveryStatusMap = {
    DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
    CONFIRMED: { label: 'Потвърдена', bg: '#dcfce7', color: '#166534' },
    CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' }
};
export default function Deliveries() {
    const navigate = useNavigate();
    const deliveries = useDeliveries();
    const orders = usePurchaseOrders();
    const createDelivery = useCreateDelivery();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        purchaseOrderId: '',
        warehouseId: '',
        supplierName: '',
        deliveryDate: '',
        note: ''
    });
    const rows = useMemo(() => (deliveries.data ?? []), [deliveries.data]);
    const orderOptions = (orders.data ?? []);
    const onCreate = async () => {
        if (!form.warehouseId)
            return;
        const created = await createDelivery.mutateAsync({
            purchaseOrderId: form.purchaseOrderId || undefined,
            warehouseId: form.warehouseId,
            supplierName: form.supplierName || undefined,
            deliveryDate: form.deliveryDate || undefined,
            note: form.note || undefined
        });
        setShowForm(false);
        setForm({ purchaseOrderId: '', warehouseId: '', supplierName: '', deliveryDate: '', note: '' });
        navigate(`/scm/deliveries/${created.id}`);
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0438", subtitle: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438 \u0437\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430 \u043D\u0430 \u0441\u0442\u043E\u043A\u0430", action: !showForm ? _jsx(Button, { onClick: () => setShowForm(true), children: "\u041D\u043E\u0432\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430" }) : undefined }), showForm ? (_jsxs(Card, { style: { marginBottom: 20 }, children: [_jsxs(FormRow, { columns: 4, children: [_jsx(FormField, { label: "\u041F\u043E\u0440\u044A\u0447\u043A\u0430", children: _jsxs(Select, { value: form.purchaseOrderId, onChange: (e) => setForm({ ...form, purchaseOrderId: e.target.value }), children: [_jsx("option", { value: "", children: "\u0411\u0435\u0437 \u043F\u043E\u0440\u044A\u0447\u043A\u0430" }), orderOptions.map((o) => (_jsx("option", { value: o.id, children: o.orderNo }, o.id)))] }) }), _jsx(FormField, { label: "\u0421\u043A\u043B\u0430\u0434", required: true, children: _jsx(WarehouseSelector, { value: form.warehouseId, onChange: (warehouseId) => setForm({ ...form, warehouseId }) }) }), _jsx(FormField, { label: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A", children: _jsx(Input, { value: form.supplierName, onChange: (e) => setForm({ ...form, supplierName: e.target.value }), placeholder: "\u0418\u043C\u0435 \u043D\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }) }), _jsx(FormField, { label: "\u0414\u0430\u0442\u0430 \u043D\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430", children: _jsx(Input, { type: "date", value: form.deliveryDate, onChange: (e) => setForm({ ...form, deliveryDate: e.target.value }) }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setShowForm(false), children: "\u041E\u0442\u043A\u0430\u0437" }), _jsx(Button, { onClick: onCreate, disabled: createDelivery.isPending, children: createDelivery.isPending ? 'Запис...' : 'Създай' })] })] })) : null, _jsx("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }, children: [_jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041F\u043E\u0440\u044A\u0447\u043A\u0430" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u0430\u0442\u0430" })] }) }), _jsx("tbody", { children: rows.map((d) => {
                                const st = deliveryStatusMap[d.status] ?? { label: d.status, bg: '#f3f4f6', color: '#374151' };
                                return (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }, onClick: () => navigate(`/scm/deliveries/${d.id}`), children: [_jsx("td", { style: { padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }, children: d.deliveryNo }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: d.purchaseOrder?.orderNo ?? '—' }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: d.supplierName ?? '—' }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: d.warehouse?.name ?? '—' }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(StatusBadge, { label: st.label, bg: st.bg, color: st.color }) }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: d.createdAt ? new Date(d.createdAt).toLocaleString('bg-BG') : '—' })] }, d.id));
                            }) })] }) })] }));
}
