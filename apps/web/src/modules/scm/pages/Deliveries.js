import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
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
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0438" }), _jsx(Button, { onClick: () => setShowForm((x) => !x), children: showForm ? 'Отказ' : 'Нова доставка' })] }), showForm ? (_jsxs("div", { style: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }, children: [_jsxs("select", { value: form.purchaseOrderId, onChange: (e) => setForm({ ...form, purchaseOrderId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u0411\u0435\u0437 \u043F\u043E\u0440\u044A\u0447\u043A\u0430" }), orderOptions.map((o) => (_jsx("option", { value: o.id, children: o.orderNo }, o.id)))] }), _jsx(WarehouseSelector, { value: form.warehouseId, onChange: (warehouseId) => setForm({ ...form, warehouseId }) }), _jsx("input", { placeholder: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A", value: form.supplierName, onChange: (e) => setForm({ ...form, supplierName: e.target.value }), style: { padding: 8 } }), _jsx("input", { type: "date", value: form.deliveryDate, onChange: (e) => setForm({ ...form, deliveryDate: e.target.value }), style: { padding: 8 } }), _jsx(Button, { onClick: onCreate, disabled: createDelivery.isPending, children: "\u0421\u044A\u0437\u0434\u0430\u0439" })] })) : null, _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: 10 }, children: "\u041F\u043E\u0440\u044A\u0447\u043A\u0430" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u0430\u0442\u0430" })] }) }), _jsx("tbody", { children: rows.map((d) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }, onClick: () => navigate(`/scm/deliveries/${d.id}`), children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: d.deliveryNo }), _jsx("td", { style: { padding: 10 }, children: d.purchaseOrder?.orderNo ?? '—' }), _jsx("td", { style: { padding: 10 }, children: d.supplierName ?? '—' }), _jsx("td", { style: { padding: 10 }, children: d.warehouse?.name ?? '—' }), _jsx("td", { style: { padding: 10 }, children: _jsx("span", { style: {
                                                padding: '2px 10px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: (deliveryStatusMap[d.status] ?? { bg: '#f3f4f6' }).bg,
                                                color: (deliveryStatusMap[d.status] ?? { color: '#374151' }).color
                                            }, children: (deliveryStatusMap[d.status] ?? { label: d.status }).label }) }), _jsx("td", { style: { padding: 10 }, children: d.createdAt ? new Date(d.createdAt).toLocaleString('bg-BG') : '—' })] }, d.id))) })] }) })] }));
}
