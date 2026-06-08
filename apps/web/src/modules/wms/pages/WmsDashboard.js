import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui';
import { useLowStock, useReceipts, useStockSummary, useWarehouses } from '../hooks/useWms';
function StatCard({ title, value, subtitle }) {
    return (_jsxs("div", { style: {
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 20
        }, children: [_jsx("div", { style: { color: '#6b7280', fontSize: 12, fontWeight: 700 }, children: title }), _jsx("div", { style: { fontSize: 28, fontWeight: 800, marginTop: 8 }, children: value }), subtitle ? _jsx("div", { style: { marginTop: 6, color: '#6b7280', fontSize: 12 }, children: subtitle }) : null] }));
}
export default function WmsDashboard() {
    const navigate = useNavigate();
    const warehouses = useWarehouses();
    const stockSummary = useStockSummary();
    const lowStock = useLowStock();
    const receipts = useReceipts();
    const lowStockData = (lowStock.data ?? []);
    const totals = useMemo(() => {
        const ws = (warehouses.data ?? []);
        const summary = (stockSummary.data ?? []);
        const low = (lowStock.data ?? []);
        const rs = (receipts.data ?? []);
        return {
            warehousesCount: ws.length,
            stockedItemsCount: summary.reduce((acc, s) => acc + (s.totalItems ?? 0), 0),
            draftReceiptsCount: rs.filter((r) => r.status === 'DRAFT').length,
            lowStockCount: low.length
        };
    }, [lowStock.data, receipts.data, stockSummary.data, warehouses.data]);
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0421\u043A\u043B\u0430\u0434 (WMS)", subtitle: "\u041E\u0431\u0437\u043E\u0440 \u0438 \u043A\u043B\u044E\u0447\u043E\u0432\u0438 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u0438" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }, children: [_jsx(StatCard, { title: "\u041E\u0431\u0449\u043E \u0441\u043A\u043B\u0430\u0434\u043E\u0432\u0435", value: warehouses.isLoading ? '...' : totals.warehousesCount }), _jsx(StatCard, { title: "\u0410\u0440\u0442\u0438\u043A\u0443\u043B\u0438 \u0441 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442", value: stockSummary.isLoading ? '...' : totals.stockedItemsCount }), _jsx(StatCard, { title: "\u0427\u0435\u0440\u043D\u043E\u0432\u0438 \u043F\u0440\u0438\u0445\u043E\u0434\u043D\u0438", value: receipts.isLoading ? '...' : totals.draftReceiptsCount }), _jsx(StatCard, { title: "\u0410\u0440\u0442\u0438\u043A\u0443\u043B\u0438 \u043F\u043E\u0434 \u043C\u0438\u043D\u0438\u043C\u0443\u043C", value: lowStock.isLoading ? '...' : totals.lowStockCount })] }), lowStockData && lowStockData.length > 0 ? (_jsxs("div", { onClick: () => navigate('/wms/stock'), style: {
                    marginTop: '20px',
                    padding: '14px 18px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }, children: ["\u26A0\uFE0F ", lowStockData.length, " \u0430\u0440\u0442\u0438\u043A\u0443\u043B(\u0430) \u043F\u043E\u0434 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u043D\u0430\u0442\u0430 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442.", _jsx("span", { style: { textDecoration: 'underline', fontWeight: 500 }, children: "\u0412\u0438\u0436 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438 \u2192" })] })) : null] }));
}
