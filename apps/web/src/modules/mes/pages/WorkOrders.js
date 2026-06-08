import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui';
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
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u0438 \u043D\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0438\u044F", subtitle: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u0438 \u043F\u043E\u0440\u044A\u0447\u043A\u0438", action: !showForm ? _jsx(Button, { onClick: () => setShowForm(true), children: "\u041D\u043E\u0432\u043E \u043D\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435" }) : undefined }), showForm ? (_jsxs(Card, { style: { marginBottom: 20 }, children: [_jsxs(FormRow, { columns: 3, children: [_jsx(FormField, { label: "\u041A\u0440\u0430\u0435\u043D \u043F\u0440\u043E\u0434\u0443\u043A\u0442", required: true, children: _jsxs(Select, { value: form.productId, onChange: (e) => setForm({ ...form, productId: e.target.value }), children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442" }), bomList.map((b) => (_jsxs("option", { value: b.productId, children: [b.product?.code, " \u2014 ", b.product?.name] }, b.productId)))] }) }), _jsx(FormField, { label: "BOM", children: _jsxs(Select, { value: form.bomId, onChange: (e) => setForm({ ...form, bomId: e.target.value }), children: [_jsx("option", { value: "", children: "BOM (\u043F\u043E \u0438\u0437\u0431\u043E\u0440)" }), bomList.map((b) => (_jsxs("option", { value: b.id, children: [b.product?.code, " v", b.version] }, b.id)))] }) }), _jsx(FormField, { label: "\u0421\u043A\u043B\u0430\u0434", required: true, children: _jsx(WarehouseSelector, { value: form.warehouseId, onChange: (warehouseId) => setForm({ ...form, warehouseId }) }) })] }), _jsxs(FormRow, { columns: 3, children: [_jsx(FormField, { label: "\u0418\u0437\u0445\u043E\u0434\u043D\u0430 \u043B\u043E\u043A\u0430\u0446\u0438\u044F", required: true, children: _jsxs(Select, { value: form.outputLocationId, onChange: (e) => setForm({ ...form, outputLocationId: e.target.value }), children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043B\u043E\u043A\u0430\u0446\u0438\u044F" }), (locations.data ?? []).map((l) => (_jsx("option", { value: l.id, children: l.code }, l.id)))] }) }), _jsx(FormField, { label: "\u041F\u043B\u0430\u043D\u0438\u0440\u0430\u043D\u043E \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", required: true, children: _jsx(Input, { type: "number", value: form.plannedQty, onChange: (e) => setForm({ ...form, plannedQty: Number(e.target.value) }) }) }), _jsx(FormField, { label: "\u0411\u0435\u043B\u0435\u0436\u043A\u0430", children: _jsx(Input, { value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }), placeholder: "\u041F\u043E \u0438\u0437\u0431\u043E\u0440" }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setShowForm(false), children: "\u041E\u0442\u043A\u0430\u0437" }), _jsx(Button, { onClick: onCreate, disabled: createOrder.isPending, children: createOrder.isPending ? 'Запис...' : 'Създай' })] })] })) : null, _jsx("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }, children: [_jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041F\u043B\u0430\u043D\u0438\u0440\u0430\u043D\u043E \u043A\u043E\u043B." }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041D\u0430\u0447\u0430\u043B\u043E" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u041A\u0440\u0430\u0439" }), _jsx("th", { style: { padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: rows.map((wo) => {
                                const st = woStatusMap[wo.status] ?? { label: wo.status, bg: '#f3f4f6', color: '#374151' };
                                return (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }, children: wo.orderNo }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: wo.product?.name }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: wo.plannedQty }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(StatusBadge, { label: st.label, bg: st.bg, color: st.color }) }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: wo.actualStart ? new Date(wo.actualStart).toLocaleString('bg-BG') : '—' }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: wo.actualEnd ? new Date(wo.actualEnd).toLocaleString('bg-BG') : '—' }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate(`/mes/orders/${wo.id}`), children: "\u041F\u0440\u0435\u0433\u043B\u0435\u0434" }) })] }, wo.id));
                            }) })] }) })] }));
}
