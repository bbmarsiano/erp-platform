import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../components/ui';
import { api } from '../../../lib/api';
export default function Movements() {
    const { data, isLoading } = useQuery({
        queryKey: ['wms', 'movements'],
        queryFn: () => api.get('/api/wms/stock/movements').then((r) => r.data.data)
    });
    const typeLabels = {
        IN: { label: 'Вход', color: '#166534', bg: '#dcfce7' },
        OUT: { label: 'Изход', color: '#991b1b', bg: '#fee2e2' },
        TRANSFER: { label: 'Трансфер', color: '#1e40af', bg: '#dbeafe' },
        ADJUSTMENT: { label: 'Корекция', color: '#854d0e', bg: '#fef9c3' }
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u044F", subtitle: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043D\u0430 \u0432\u0441\u0438\u0447\u043A\u0438 \u0441\u043A\u043B\u0430\u0434\u043E\u0432\u0438 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F" }), isLoading ? (_jsx("div", { style: { textAlign: 'center', padding: 60, color: '#9ca3af' }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." })) : (_jsx("div", { style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    overflow: 'hidden'
                }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsx("tr", { style: { background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }, children: ['Тип', 'Артикул', 'Количество', 'От локация', 'До локация', 'Референция', 'Дата'].map((h) => (_jsx("th", { style: {
                                        padding: '11px 16px',
                                        textAlign: 'left',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#6b7280'
                                    }, children: h }, h))) }) }), _jsx("tbody", { children: !data?.length ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, style: { textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }, children: "\u041D\u044F\u043C\u0430 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u0438 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F" }) })) : (data.map((m) => {
                                const t = typeLabels[m.movementType] || {
                                    label: m.movementType,
                                    color: '#374151',
                                    bg: '#f3f4f6'
                                };
                                return (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '12px 16px' }, children: _jsx("span", { style: {
                                                    padding: '2px 10px',
                                                    borderRadius: 20,
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    background: t.bg,
                                                    color: t.color
                                                }, children: t.label }) }), _jsxs("td", { style: { padding: '12px 16px', fontSize: 13, fontWeight: 500 }, children: [m.product?.name || m.productId, _jsx("div", { style: { fontSize: 11, color: '#9ca3af' }, children: m.product?.code })] }), _jsxs("td", { style: {
                                                padding: '12px 16px',
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: m.movementType === 'IN' ? '#059669' : '#dc2626'
                                            }, children: [m.movementType === 'IN' ? '+' : '-', m.quantity, " ", m.product?.unit] }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13, color: '#6b7280' }, children: m.fromLocationId ? m.fromLocation?.code || '—' : '—' }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13, color: '#6b7280' }, children: m.toLocationId ? m.toLocation?.code || '—' : '—' }), _jsx("td", { style: { padding: '12px 16px', fontSize: 12, color: '#9ca3af' }, children: m.referenceType && _jsx("span", { children: m.referenceType }) }), _jsx("td", { style: { padding: '12px 16px', fontSize: 12, color: '#9ca3af' }, children: new Date(m.createdAt).toLocaleDateString('bg-BG') })] }, m.id));
                            })) })] }) }))] }));
}
