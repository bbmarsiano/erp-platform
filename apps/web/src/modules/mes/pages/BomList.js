import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useStock } from '../../wms/hooks/useWms';
import { useBoms, useCreateBom } from '../hooks/useMes';
export default function BomList() {
    const boms = useBoms();
    const createBom = useCreateBom();
    const stock = useStock();
    const [showForm, setShowForm] = useState(false);
    const [productId, setProductId] = useState('');
    const products = Array.from(new Map((stock.data ?? []).map((r) => [r.product.id, r.product])).values());
    const onCreate = async () => {
        if (!productId)
            return;
        await createBom.mutateAsync({ productId, version: '1.0' });
        setProductId('');
        setShowForm(false);
    };
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u0420\u0435\u0446\u0435\u043F\u0442\u0443\u0440\u0438 (BOM)" }), _jsx(Button, { onClick: () => setShowForm((x) => !x), children: showForm ? 'Отказ' : 'Нова рецептура' })] }), showForm ? (_jsxs("div", { style: { marginTop: 12, display: 'flex', gap: 8 }, children: [_jsxs("select", { value: productId, onChange: (e) => setProductId(e.target.value), style: { padding: 8, minWidth: 260 }, children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442" }), products.map((p) => (_jsxs("option", { value: p.id, children: [p.code, " \u2014 ", p.name] }, p.id)))] }), _jsx(Button, { onClick: onCreate, children: "\u0421\u044A\u0437\u0434\u0430\u0439" })] })) : null, _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u0412\u0435\u0440\u0441\u0438\u044F" }), _jsx("th", { style: { padding: 10 }, children: "\u0411\u0440\u043E\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0438" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: (boms.data ?? []).map((b) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10 }, children: b.product?.name }), _jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: b.product?.code }), _jsx("td", { style: { padding: 10 }, children: b.version }), _jsx("td", { style: { padding: 10 }, children: b.items?.length ?? 0 }), _jsx("td", { style: { padding: 10 }, children: b.isActive ? 'Активна' : 'Неактивна' }), _jsx("td", { style: { padding: 10 }, children: _jsx(Link, { to: `/mes/bom/${b.productId}`, children: "\u041F\u0440\u0435\u0433\u043B\u0435\u0434" }) })] }, b.id))) })] }) })] }));
}
