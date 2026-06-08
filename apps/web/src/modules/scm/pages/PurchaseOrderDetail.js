import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, PageHeader } from '../../../components/ui';
import { useStock } from '../../wms/hooks/useWms';
import { useAddPurchaseOrderLine, usePurchaseOrder, useSendPurchaseOrder } from '../hooks/useScm';
export default function PurchaseOrderDetail() {
    const { id = '' } = useParams();
    const orderQuery = usePurchaseOrder(id);
    const addLine = useAddPurchaseOrderLine();
    const sendOrder = useSendPurchaseOrder();
    const order = orderQuery.data;
    const stock = useStock(order?.warehouseId);
    const products = useMemo(() => {
        const rows = (stock.data ?? []);
        const m = new Map();
        rows.forEach((r) => m.set(r.product.id, r.product));
        return Array.from(m.values());
    }, [stock.data]);
    const [line, setLine] = useState({ productId: '', quantity: 1, unitPrice: 0 });
    const onAdd = async () => {
        if (!line.productId || !line.quantity)
            return;
        await addLine.mutateAsync({ id, productId: line.productId, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) || undefined });
        setLine({ productId: '', quantity: 1, unitPrice: 0 });
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: `Поръчка покупка ${order?.orderNo ?? ''}`, action: order?.status === 'DRAFT' ? (_jsx(Button, { onClick: () => sendOrder.mutate(id), disabled: sendOrder.isPending, children: "\u0418\u0437\u043F\u0440\u0430\u0442\u0438" })) : undefined }), _jsx("div", { style: { marginTop: 8, color: '#6b7280' }, children: _jsx(Link, { to: "/scm/orders", children: "\u2190 \u041D\u0430\u0437\u0430\u0434" }) }), _jsxs("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }, children: [_jsx("div", { style: { fontWeight: 800, marginBottom: 10 }, children: "\u0420\u0435\u0434\u043E\u0432\u0435" }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 8 }, children: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442" }), _jsx("th", { style: { padding: 8 }, children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { padding: 8 }, children: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E" }), _jsx("th", { style: { padding: 8 }, children: "\u0426\u0435\u043D\u0430" })] }) }), _jsx("tbody", { children: (order?.lines ?? []).map((l) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 8 }, children: l.productId }), _jsx("td", { style: { padding: 8 }, children: l.quantity }), _jsx("td", { style: { padding: 8 }, children: l.receivedQty }), _jsx("td", { style: { padding: 8 }, children: l.unitPrice ?? '—' })] }, l.id))) })] }), order?.status === 'DRAFT' ? (_jsxs("div", { style: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: 8, alignItems: 'end' }, children: [_jsxs("select", { value: line.productId, onChange: (e) => setLine({ ...line, productId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442" }), products.map((p) => (_jsxs("option", { value: p.id, children: [p.code, " \u2014 ", p.name] }, p.id)))] }), _jsx("input", { type: "number", value: line.quantity, onChange: (e) => setLine({ ...line, quantity: Number(e.target.value) }), style: { padding: 8 } }), _jsx("input", { type: "number", value: line.unitPrice, onChange: (e) => setLine({ ...line, unitPrice: Number(e.target.value) }), style: { padding: 8 } }), _jsx(Button, { onClick: onAdd, disabled: addLine.isPending, children: "\u0414\u043E\u0431\u0430\u0432\u0438 \u0440\u0435\u0434" })] })) : null] })] }));
}
