import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { WarehouseSelector } from '../components/WarehouseSelector';
import { useStock } from '../hooks/useWms';
export default function Stock() {
    const [warehouseId, setWarehouseId] = useState('');
    const { data, isLoading, error } = useStock(warehouseId || undefined);
    const rows = useMemo(() => (data ?? []), [data]);
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u041D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438" }), _jsx("div", { style: { marginTop: 4, color: '#6b7280', fontSize: 13 }, children: "\u0422\u0435\u043A\u0443\u0449\u0438 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438 \u043F\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u0438 \u043B\u043E\u043A\u0430\u0446\u0438\u044F" })] }), _jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: 12, color: '#6b7280' }, children: "\u0424\u0438\u043B\u0442\u044A\u0440 \u043F\u043E \u0441\u043A\u043B\u0430\u0434" }), _jsx(WarehouseSelector, { value: warehouseId, onChange: setWarehouseId, placeholder: "\u0412\u0441\u0438\u0447\u043A\u0438 \u0441\u043A\u043B\u0430\u0434\u043E\u0432\u0435" })] })] }), _jsx("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10 }, children: isLoading ? (_jsx("div", { style: { padding: 12, color: '#6b7280' }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." })) : error ? (_jsx("div", { style: { padding: 12, color: '#991b1b' }, children: "\u0413\u0440\u0435\u0448\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435 \u043D\u0430 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438" })) : rows.length === 0 ? (_jsx("div", { style: { padding: 12, color: '#6b7280' }, children: "\u041D\u044F\u043C\u0430 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438" })) : (_jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }, children: [_jsx("th", { style: { width: '22%', padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }, children: "\u0410\u0440\u0442\u0438\u043A\u0443\u043B" }), _jsx("th", { style: { width: '14%', padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { width: '28%', padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }, children: "\u041B\u043E\u043A\u0430\u0446\u0438\u044F" }), _jsx("th", { style: { width: '14%', padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }, children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { width: '10%', padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }, children: "\u041C\u0438\u043D." }), _jsx("th", { style: { width: '12%', padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" })] }) }), _jsx("tbody", { children: rows.map((item) => {
                                    const isLow = item.quantity < item.product?.minStock;
                                    const isEmpty = item.quantity === 0;
                                    return (_jsxs("tr", { style: {
                                            background: isEmpty ? '#fff1f2' : isLow ? '#fff7ed' : 'white',
                                            borderBottom: '1px solid #f3f4f6'
                                        }, children: [_jsx("td", { style: { padding: '12px', fontSize: 14, fontWeight: 500 }, children: item.product?.name }), _jsx("td", { style: { padding: '12px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }, children: item.product?.code }), _jsx("td", { style: { padding: '12px', fontSize: 13, color: item.location ? 'inherit' : '#9ca3af' }, children: item.location ? `${item.location.code} — ${item.location.warehouse?.name}` : '—' }), _jsxs("td", { style: {
                                                    padding: '12px',
                                                    textAlign: 'right',
                                                    fontSize: 14,
                                                    fontWeight: isLow ? 700 : 400,
                                                    color: isEmpty ? '#dc2626' : isLow ? '#c2410c' : '#111'
                                                }, children: [item.quantity, " ", item.product?.unit] }), _jsxs("td", { style: { padding: '12px', textAlign: 'right', fontSize: 13, color: '#6b7280' }, children: [item.product?.minStock, " ", item.product?.unit] }), _jsx("td", { style: { padding: '12px', textAlign: 'center' }, children: isEmpty ? (_jsx("span", { style: {
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        background: '#fee2e2',
                                                        color: '#991b1b',
                                                        border: '1px solid #fca5a5'
                                                    }, children: "\u0418\u0437\u0447\u0435\u0440\u043F\u0430\u043D" })) : isLow ? (_jsx("span", { style: {
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        background: '#fff7ed',
                                                        color: '#c2410c',
                                                        border: '1px solid #fdba74'
                                                    }, children: "\u26A0\uFE0F \u041F\u043E\u0434 \u043C\u0438\u043D\u0438\u043C\u0443\u043C" })) : (_jsx("span", { style: {
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        background: '#dcfce7',
                                                        color: '#166534',
                                                        border: '1px solid #86efac'
                                                    }, children: "\u2713 \u041D\u043E\u0440\u043C\u0430\u043B\u043D\u043E" })) })] }, item.id));
                                }) })] }) })) })] }));
}
