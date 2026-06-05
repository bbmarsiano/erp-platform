import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useStock, useWarehouseLocations } from '../../wms/hooks/useWms';
import { useAddDeliveryLine, useConfirmDelivery, useDelivery } from '../hooks/useScm';
export default function DeliveryDetail() {
    const { id = '' } = useParams();
    const deliveryQuery = useDelivery(id);
    const addLine = useAddDeliveryLine();
    const confirm = useConfirmDelivery();
    const delivery = deliveryQuery.data;
    const locations = useWarehouseLocations(delivery?.warehouseId);
    const stock = useStock(delivery?.warehouseId);
    const products = useMemo(() => {
        const rows = (stock.data ?? []);
        const m = new Map();
        rows.forEach((r) => m.set(r.product.id, r.product));
        return Array.from(m.values());
    }, [stock.data]);
    const [line, setLine] = useState({ productId: '', locationId: '', quantity: 1, lotNumber: '' });
    const [lastReceipt, setLastReceipt] = useState(null);
    const onAdd = async () => {
        if (!line.productId || !line.locationId || !line.quantity)
            return;
        await addLine.mutateAsync({
            id,
            productId: line.productId,
            locationId: line.locationId,
            quantity: Number(line.quantity),
            lotNumber: line.lotNumber || undefined
        });
        setLine({ productId: '', locationId: '', quantity: 1, lotNumber: '' });
    };
    const onConfirm = async () => {
        const result = await confirm.mutateAsync(id);
        if (result?.goodsReceiptNo) {
            setLastReceipt(result.goodsReceiptNo);
        }
    };
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { style: { fontSize: 22, fontWeight: 900 }, children: ["\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430 ", delivery?.deliveryNo ?? ''] }), delivery?.status === 'DRAFT' ? (_jsx(Button, { onClick: onConfirm, disabled: confirm.isPending, children: "\u041F\u043E\u0442\u0432\u044A\u0440\u0434\u0438 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430" })) : null] }), _jsx("div", { style: { marginTop: 8, color: '#6b7280' }, children: _jsx(Link, { to: "/scm/deliveries", children: "\u2190 \u041D\u0430\u0437\u0430\u0434" }) }), lastReceipt ? (_jsxs("div", { style: { marginTop: 12, padding: 12, border: '1px solid #86efac', borderRadius: 10, background: '#f0fdf4', color: '#166534' }, children: ["\u2705 \u0421\u044A\u0437\u0434\u0430\u0434\u0435\u043D\u0430 \u043F\u0440\u0438\u0445\u043E\u0434\u043D\u0430 \u0431\u0435\u043B\u0435\u0436\u043A\u0430: ", lastReceipt, " ", _jsx(Link, { to: "/wms/receipts", children: "\u043A\u044A\u043C WMS" })] })) : null, _jsxs("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }, children: [_jsx("div", { style: { fontWeight: 800, marginBottom: 10 }, children: "\u0420\u0435\u0434\u043E\u0432\u0435" }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 8 }, children: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442" }), _jsx("th", { style: { padding: 8 }, children: "\u041B\u043E\u043A\u0430\u0446\u0438\u044F" }), _jsx("th", { style: { padding: 8 }, children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { padding: 8 }, children: "\u041F\u0430\u0440\u0442\u0438\u0434\u0430" })] }) }), _jsx("tbody", { children: (delivery?.lines ?? []).map((l) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 8 }, children: l.productId }), _jsx("td", { style: { padding: 8 }, children: l.locationId }), _jsx("td", { style: { padding: 8 }, children: l.quantity }), _jsx("td", { style: { padding: 8 }, children: l.lotNumber ?? '—' })] }, l.id))) })] }), delivery?.status === 'DRAFT' ? (_jsxs("div", { style: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 120px 1fr auto', gap: 8, alignItems: 'end' }, children: [_jsxs("select", { value: line.productId, onChange: (e) => setLine({ ...line, productId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442" }), products.map((p) => (_jsxs("option", { value: p.id, children: [p.code, " \u2014 ", p.name] }, p.id)))] }), _jsxs("select", { value: line.locationId, onChange: (e) => setLine({ ...line, locationId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043B\u043E\u043A\u0430\u0446\u0438\u044F" }), (locations.data ?? []).map((l) => (_jsxs("option", { value: l.id, children: [l.code, " \u2014 ", l.name] }, l.id)))] }), _jsx("input", { type: "number", value: line.quantity, onChange: (e) => setLine({ ...line, quantity: Number(e.target.value) }), style: { padding: 8 } }), _jsx("input", { placeholder: "\u041F\u0430\u0440\u0442\u0438\u0434\u0430", value: line.lotNumber, onChange: (e) => setLine({ ...line, lotNumber: e.target.value }), style: { padding: 8 } }), _jsx(Button, { onClick: onAdd, disabled: addLine.isPending, children: "\u0414\u043E\u0431\u0430\u0432\u0438 \u0440\u0435\u0434" })] })) : null] })] }));
}
