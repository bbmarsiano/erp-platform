import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, PageHeader } from '../../../components/ui';
import { useStock } from '../../wms/hooks/useWms';
import { useAddBomItem, useBom } from '../hooks/useMes';
export default function BomDetail() {
    const { productId = '' } = useParams();
    const bomQuery = useBom(productId);
    const addItem = useAddBomItem();
    const stock = useStock();
    const products = Array.from(new Map((stock.data ?? []).map((r) => [r.product.id, r.product])).values());
    const [form, setForm] = useState({ componentId: '', quantity: 1, unit: '', note: '' });
    const bom = bomQuery.data;
    const onAdd = async () => {
        if (!bom?.id || !form.componentId || !form.quantity)
            return;
        await addItem.mutateAsync({
            id: bom.id,
            componentId: form.componentId,
            quantity: Number(form.quantity),
            unit: form.unit || undefined,
            note: form.note || undefined
        });
        setForm({ componentId: '', quantity: 1, unit: '', note: '' });
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: `Рецептура: ${bom?.product?.name ?? ''}` }), _jsx("div", { style: { marginTop: 8, color: '#6b7280' }, children: _jsx(Link, { to: "/mes/bom", children: "\u2190 \u041D\u0430\u0437\u0430\u0434" }) }), _jsxs("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }, children: [_jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 8 }, children: "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442" }), _jsx("th", { style: { padding: 8 }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { padding: 8 }, children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { padding: 8 }, children: "\u041C.\u0415." }), _jsx("th", { style: { padding: 8 }, children: "\u0411\u0435\u043B\u0435\u0436\u043A\u0430" })] }) }), _jsx("tbody", { children: (bom?.items ?? []).map((i) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 8 }, children: i.component?.name }), _jsx("td", { style: { padding: 8, fontFamily: 'monospace' }, children: i.component?.code }), _jsx("td", { style: { padding: 8 }, children: i.quantity }), _jsx("td", { style: { padding: 8 }, children: i.unit ?? i.component?.unit ?? '—' }), _jsx("td", { style: { padding: 8 }, children: i.note ?? '—' })] }, i.id))) })] }), _jsxs("div", { style: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 120px 100px 1fr auto', gap: 8, alignItems: 'end' }, children: [_jsxs("select", { value: form.componentId, onChange: (e) => setForm({ ...form, componentId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442" }), products.map((p) => (_jsxs("option", { value: p.id, children: [p.code, " \u2014 ", p.name] }, p.id)))] }), _jsx("input", { type: "number", value: form.quantity, onChange: (e) => setForm({ ...form, quantity: Number(e.target.value) }), style: { padding: 8 } }), _jsx("input", { value: form.unit, onChange: (e) => setForm({ ...form, unit: e.target.value }), placeholder: "\u041C.\u0415.", style: { padding: 8 } }), _jsx("input", { value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }), placeholder: "\u0411\u0435\u043B\u0435\u0436\u043A\u0430", style: { padding: 8 } }), _jsx(Button, { onClick: onAdd, children: "\u0414\u043E\u0431\u0430\u0432\u0438 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442" })] })] })] }));
}
