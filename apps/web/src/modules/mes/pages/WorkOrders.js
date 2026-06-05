import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { WarehouseSelector } from '../../wms/components/WarehouseSelector';
import { useWarehouseLocations } from '../../wms/hooks/useWms';
import { useBoms, useCreateWorkOrder, useWorkOrders } from '../hooks/useMes';
const woStatusMap = {
    DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
    RELEASED: { label: 'Пуснато', bg: '#dbeafe', color: '#1e40af' },
    IN_PROGRESS: { label: 'В изпълнение', bg: '#fed7aa', color: '#9a3412' },
    COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
    CANCELLED: { label: 'Анулирано', bg: '#fee2e2', color: '#991b1b' }
};
export default function WorkOrders() {
    const navigate = useNavigate();
    const orders = useWorkOrders();
    const boms = useBoms();
    const createOrder = useCreateWorkOrder();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ productId: '', bomId: '', warehouseId: '', outputLocationId: '', plannedQty: 1, note: '' });
    const locations = useWarehouseLocations(form.warehouseId);
    const bomList = (boms.data ?? []);
    const onCreate = async () => {
        if (!form.productId || !form.warehouseId || !form.outputLocationId)
            return;
        const created = await createOrder.mutateAsync({
            productId: form.productId,
            bomId: form.bomId || undefined,
            warehouseId: form.warehouseId,
            outputLocationId: form.outputLocationId,
            plannedQty: Number(form.plannedQty),
            note: form.note || undefined
        });
        setShowForm(false);
        navigate(`/mes/orders/${created.id}`);
    };
    const rows = useMemo(() => (orders.data ?? []), [orders.data]);
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u0438 \u043D\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0438\u044F" }), _jsx(Button, { onClick: () => setShowForm((x) => !x), children: showForm ? 'Отказ' : 'Ново нареждане' })] }), showForm ? (_jsxs("div", { style: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 120px 1fr auto', gap: 8, alignItems: 'end' }, children: [_jsxs("select", { value: form.productId, onChange: (e) => setForm({ ...form, productId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u041A\u0440\u0430\u0435\u043D \u043F\u0440\u043E\u0434\u0443\u043A\u0442" }), bomList.map((b) => (_jsxs("option", { value: b.productId, children: [b.product?.code, " \u2014 ", b.product?.name] }, b.productId)))] }), _jsxs("select", { value: form.bomId, onChange: (e) => setForm({ ...form, bomId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "BOM (\u043F\u043E \u0438\u0437\u0431\u043E\u0440)" }), bomList.map((b) => (_jsxs("option", { value: b.id, children: [b.product?.code, " v", b.version] }, b.id)))] }), _jsx(WarehouseSelector, { value: form.warehouseId, onChange: (warehouseId) => setForm({ ...form, warehouseId }) }), _jsxs("select", { value: form.outputLocationId, onChange: (e) => setForm({ ...form, outputLocationId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u0418\u0437\u0445\u043E\u0434\u043D\u0430 \u043B\u043E\u043A\u0430\u0446\u0438\u044F" }), (locations.data ?? []).map((l) => (_jsx("option", { value: l.id, children: l.code }, l.id)))] }), _jsx("input", { type: "number", value: form.plannedQty, onChange: (e) => setForm({ ...form, plannedQty: Number(e.target.value) }), style: { padding: 8 } }), _jsx("input", { value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }), placeholder: "\u0411\u0435\u043B\u0435\u0436\u043A\u0430", style: { padding: 8 } }), _jsx(Button, { onClick: onCreate, children: "\u0421\u044A\u0437\u0434\u0430\u0439" })] })) : null, _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: 10 }, children: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442" }), _jsx("th", { style: { padding: 10 }, children: "\u041F\u043B\u0430\u043D\u0438\u0440\u0430\u043D\u043E \u043A\u043E\u043B." }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u041D\u0430\u0447\u0430\u043B\u043E" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u0440\u0430\u0439" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: rows.map((wo) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: wo.orderNo }), _jsx("td", { style: { padding: 10 }, children: wo.product?.name }), _jsx("td", { style: { padding: 10 }, children: wo.plannedQty }), _jsx("td", { style: { padding: 10 }, children: _jsx("span", { style: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: woStatusMap[wo.status]?.bg, color: woStatusMap[wo.status]?.color }, children: woStatusMap[wo.status]?.label ?? wo.status }) }), _jsx("td", { style: { padding: 10 }, children: wo.actualStart ? new Date(wo.actualStart).toLocaleString('bg-BG') : '—' }), _jsx("td", { style: { padding: 10 }, children: wo.actualEnd ? new Date(wo.actualEnd).toLocaleString('bg-BG') : '—' }), _jsx("td", { style: { padding: 10 }, children: _jsx(Button, { onClick: () => navigate(`/mes/orders/${wo.id}`), style: { background: '#fff', color: '#111', border: '1px solid #ddd' }, children: "\u041F\u0440\u0435\u0433\u043B\u0435\u0434" }) })] }, wo.id))) })] }) })] }));
}
