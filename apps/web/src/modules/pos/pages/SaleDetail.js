import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Link, useParams } from 'react-router-dom';
import { useSale } from '../hooks/usePos';
const paymentLabels = {
    CASH: 'Кеш',
    CARD: 'Карта',
    MIXED: 'Смесено'
};
export default function SaleDetail() {
    const { id = '' } = useParams();
    const saleQuery = useSale(id);
    const sale = saleQuery.data;
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { fontSize: 22, fontWeight: 900 }, children: ["\u041A\u0430\u0441\u043E\u0432\u0430 \u0431\u0435\u043B\u0435\u0436\u043A\u0430 ", sale?.saleNo ?? ''] }), _jsx("div", { style: { marginTop: 8 }, children: _jsx(Link, { to: "/pos/sales", children: "\u2190 \u041D\u0430\u0437\u0430\u0434" }) }), _jsxs("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }, children: [_jsxs("div", { children: ["\u041A\u0430\u0441\u0430: ", sale?.cashRegister?.name ?? '-'] }), _jsxs("div", { children: ["\u041C\u0435\u0442\u043E\u0434: ", sale?.paymentMethod ? paymentLabels[sale.paymentMethod] ?? sale.paymentMethod : '-'] }), _jsxs("div", { children: ["\u0414\u0430\u0442\u0430: ", sale?.createdAt ? new Date(sale.createdAt).toLocaleString('bg-BG') : '-'] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', marginTop: 12 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 8 }, children: "\u0410\u0440\u0442\u0438\u043A\u0443\u043B" }), _jsx("th", { style: { padding: 8 }, children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { padding: 8 }, children: "\u0415\u0434. \u0446\u0435\u043D\u0430" }), _jsx("th", { style: { padding: 8 }, children: "\u0421\u0443\u043C\u0430" })] }) }), _jsx("tbody", { children: (sale?.lines ?? []).map((l) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 8 }, children: l.product?.name }), _jsx("td", { style: { padding: 8 }, children: l.quantity }), _jsxs("td", { style: { padding: 8 }, children: [l.unitPrice.toFixed(2), " \u043B\u0432."] }), _jsxs("td", { style: { padding: 8 }, children: [l.totalPrice.toFixed(2), " \u043B\u0432."] })] }, l.id))) })] }), _jsxs("div", { style: { marginTop: 12, fontSize: 24, fontWeight: 800 }, children: ["\u041E\u0431\u0449\u043E: ", sale?.totalAmount?.toFixed?.(2) ?? 0, " \u043B\u0432."] })] })] }));
}
