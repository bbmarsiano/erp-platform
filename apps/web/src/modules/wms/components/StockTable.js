import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function StockTable({ rows }) {
    return (_jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u0410\u0440\u0442\u0438\u043A\u0443\u043B" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u041B\u043E\u043A\u0430\u0446\u0438\u044F" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { padding: 10 }, children: "\u041C\u0438\u043D. \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" })] }) }), _jsx("tbody", { children: rows.map((r) => {
                    const isLow = r.quantity <= r.product.minStock;
                    return (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10 }, children: r.product.name }), _jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: r.product.code }), _jsx("td", { style: { padding: 10 }, children: r.location.code }), _jsx("td", { style: { padding: 10 }, children: r.location.warehouse.name }), _jsxs("td", { style: { padding: 10, fontWeight: 700, color: isLow ? '#991b1b' : '#111827' }, children: [r.quantity, " ", r.product.unit ?? ''] }), _jsx("td", { style: { padding: 10 }, children: r.product.minStock }), _jsx("td", { style: { padding: 10 }, children: _jsx("span", { style: {
                                        padding: '2px 10px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        background: isLow ? '#fee2e2' : '#dcfce7',
                                        color: isLow ? '#991b1b' : '#166534'
                                    }, children: isLow ? 'Под минимум' : 'Нормално' }) })] }, r.id));
                }) })] }));
}
