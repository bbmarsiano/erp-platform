import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
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
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u041F\u043E\u0440\u044A\u0447\u043A\u0438 \u043F\u043E\u043A\u0443\u043F\u043A\u0430" }), _jsx(Button, { onClick: () => setShowForm((x) => !x), children: showForm ? 'Отказ' : 'Нова поръчка' })] }), showForm ? (_jsxs("div", { style: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }, children: [_jsxs("select", { value: form.supplierId, onChange: (e) => setForm({ ...form, supplierId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }), supplierOptions.map((s) => (_jsxs("option", { value: s.id, children: [s.code, " \u2014 ", s.name] }, s.id)))] }), _jsx(WarehouseSelector, { value: form.warehouseId, onChange: (warehouseId) => setForm({ ...form, warehouseId }) }), _jsx("input", { type: "date", value: form.expectedDate, onChange: (e) => setForm({ ...form, expectedDate: e.target.value }), style: { padding: 8 } }), _jsx("input", { placeholder: "\u0411\u0435\u043B\u0435\u0436\u043A\u0430", value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }), style: { padding: 8 } }), _jsx(Button, { onClick: onCreate, disabled: createOrder.isPending, children: createOrder.isPending ? 'Запис...' : 'Създай' })] })) : null, _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u041E\u0447\u0430\u043A\u0432\u0430\u043D\u0430 \u0434\u0430\u0442\u0430" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: rows.map((o) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: o.orderNo }), _jsx("td", { style: { padding: 10 }, children: o.supplier?.name }), _jsx("td", { style: { padding: 10 }, children: o.warehouse?.name }), _jsx("td", { style: { padding: 10 }, children: _jsx("span", { style: {
                                                padding: '2px 10px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: (poStatusMap[o.status] ?? { bg: '#f3f4f6' }).bg,
                                                color: (poStatusMap[o.status] ?? { color: '#374151' }).color
                                            }, children: (poStatusMap[o.status] ?? { label: o.status }).label }) }), _jsx("td", { style: { padding: 10 }, children: o.expectedDate ? new Date(o.expectedDate).toLocaleDateString('bg-BG') : '—' }), _jsx("td", { style: { padding: 10 }, children: _jsx(Button, { onClick: () => navigate(`/scm/orders/${o.id}`), style: { background: '#fff', color: '#111', border: '1px solid #ddd' }, children: "\u041F\u0440\u0435\u0433\u043B\u0435\u0434" }) })] }, o.id))) })] }) })] }));
}
