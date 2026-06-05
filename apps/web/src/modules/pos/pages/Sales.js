import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useSales } from '../hooks/usePos';
const paymentMap = {
    CASH: { label: 'Кеш', bg: '#fef9c3', color: '#854d0e' },
    CARD: { label: 'Карта', bg: '#dbeafe', color: '#1e40af' },
    MIXED: { label: 'Смесено', bg: '#e9d5ff', color: '#6b21a8' }
};
const saleStatusMap = {
    COMPLETED: { label: 'Завършена', bg: '#dcfce7', color: '#166534' },
    REFUNDED: { label: 'Върната', bg: '#fef9c3', color: '#854d0e' },
    CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' }
};
export default function Sales() {
    const navigate = useNavigate();
    const sales = useSales();
    const rows = (sales.data ?? []);
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u041F\u0440\u043E\u0434\u0430\u0436\u0431\u0438" }), _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u0430\u0441\u0430" }), _jsx("th", { style: { padding: 10 }, children: "\u041C\u0435\u0442\u043E\u0434 \u043D\u0430 \u043F\u043B\u0430\u0449\u0430\u043D\u0435" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0443\u043C\u0430" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u0430\u0442\u0430" })] }) }), _jsx("tbody", { children: rows.map((s) => (_jsxs("tr", { onClick: () => navigate(`/pos/sales/${s.id}`), style: { borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }, children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: s.saleNo }), _jsx("td", { style: { padding: 10 }, children: s.cashRegister?.name ?? '-' }), _jsx("td", { style: { padding: 10 }, children: _jsx("span", { style: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: paymentMap[s.paymentMethod]?.bg, color: paymentMap[s.paymentMethod]?.color }, children: paymentMap[s.paymentMethod]?.label ?? s.paymentMethod }) }), _jsxs("td", { style: { padding: 10 }, children: [s.totalAmount.toFixed(2), " \u043B\u0432."] }), _jsx("td", { style: { padding: 10 }, children: _jsx("span", { style: {
                                                padding: '2px 10px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: saleStatusMap[s.status]?.bg ?? '#f3f4f6',
                                                color: saleStatusMap[s.status]?.color ?? '#374151'
                                            }, children: saleStatusMap[s.status]?.label ?? s.status }) }), _jsx("td", { style: { padding: 10 }, children: new Date(s.createdAt).toLocaleString('bg-BG') })] }, s.id))) })] }) })] }));
}
