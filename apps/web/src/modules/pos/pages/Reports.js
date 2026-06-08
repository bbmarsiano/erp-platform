import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { PageHeader } from '../../../components/ui';
import * as XLSX from 'xlsx';
import { api } from '../../../lib/api';
const paymentLabels = {
    CASH: 'Кеш',
    CARD: 'Карта',
    MIXED: 'Смесено'
};
function getPeriodDates(period, custom) {
    const to = new Date();
    const toStr = to.toISOString().slice(0, 10);
    if (period === 'custom')
        return { dateFrom: custom.from, dateTo: custom.to };
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: toStr };
}
export default function PosReports() {
    const [period, setPeriod] = useState('30d');
    const [custom, setCustom] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10)
    });
    const [activeTab, setActiveTab] = useState('sales');
    const { dateFrom, dateTo } = getPeriodDates(period, custom);
    const salesQ = useQuery({
        queryKey: ['pos', 'reports', 'sales', dateFrom, dateTo],
        queryFn: () => api
            .get(`/api/pos/reports/sales-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((r) => r.data.data),
        enabled: activeTab === 'sales'
    });
    const productsQ = useQuery({
        queryKey: ['pos', 'reports', 'products', dateFrom, dateTo],
        queryFn: () => api
            .get(`/api/pos/reports/top-products?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((r) => r.data.data),
        enabled: activeTab === 'products'
    });
    const exportExcel = useCallback(() => {
        let rows = [];
        let sheetName = '';
        if (activeTab === 'sales' && salesQ.data) {
            sheetName = 'Продажби';
            rows = salesQ.data.sales.map((s) => ({
                Номер: s.saleNo,
                Каса: s.cashRegister?.name || '',
                Метод: paymentLabels[s.paymentMethod] || s.paymentMethod,
                Сума: s.totalAmount,
                Дата: new Date(s.createdAt).toLocaleDateString('bg-BG')
            }));
        }
        else if (activeTab === 'products' && productsQ.data) {
            sheetName = 'Топ артикули';
            rows = productsQ.data.map((p) => ({
                Артикул: p.name,
                Код: p.code,
                Количество: p.qty,
                Приход: p.revenue
            }));
        }
        if (!rows.length)
            return;
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `POS_${sheetName}_${dateFrom}_${dateTo}.xlsx`);
    }, [activeTab, salesQ.data, productsQ.data, dateFrom, dateTo]);
    const tabs = [
        { id: 'sales', label: 'Продажби' },
        { id: 'products', label: 'Топ артикули' }
    ];
    const periods = [
        { id: '7d', label: '7 дни' },
        { id: '30d', label: '30 дни' },
        { id: '90d', label: '90 дни' },
        { id: 'custom', label: 'По избор' }
    ];
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0421\u043F\u0440\u0430\u0432\u043A\u0438", subtitle: "\u0422\u043E\u0447\u043A\u0430 \u043D\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0431\u0430 \u2014 \u0430\u043D\u0430\u043B\u0438\u0437\u0438 \u0438 \u043E\u0442\u0447\u0435\u0442\u0438", action: _jsxs("button", { onClick: exportExcel, style: {
                        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                        background: '#16a34a', color: 'white', border: 'none', borderRadius: 8,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
                    }, children: [_jsx(Download, { size: 15 }), "\u0415\u043A\u0441\u043F\u043E\u0440\u0442 Excel"] }) }), _jsxs("div", { style: {
                    background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
                    padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
                }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 600, color: '#374151' }, children: "\u041F\u0435\u0440\u0438\u043E\u0434:" }), periods.map((p) => (_jsx("button", { onClick: () => setPeriod(p.id), style: {
                            padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                            border: period === p.id ? 'none' : '1px solid #e5e7eb',
                            background: period === p.id ? '#7c3aed' : 'white',
                            color: period === p.id ? 'white' : '#374151', fontWeight: period === p.id ? 600 : 400
                        }, children: p.label }, p.id))), period === 'custom' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }, children: [_jsx("input", { type: "date", value: custom.from, onChange: (e) => setCustom({ ...custom, from: e.target.value }), style: { padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 } }), _jsx("span", { style: { color: '#9ca3af' }, children: "\u2014" }), _jsx("input", { type: "date", value: custom.to, onChange: (e) => setCustom({ ...custom, to: e.target.value }), style: { padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 } })] }))] }), _jsx("div", { style: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }, children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), style: {
                        padding: '9px 18px', border: 'none', cursor: 'pointer', background: 'none', fontSize: 14, fontWeight: 500,
                        color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
                        borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: -1
                    }, children: tab.label }, tab.id))) }), activeTab === 'sales' && _jsx(SalesReport, { data: salesQ.data, loading: salesQ.isLoading }), activeTab === 'products' && _jsx(ProductsReport, { data: productsQ.data, loading: productsQ.isLoading })] }));
}
function KpiCard({ label, value, color, sub }) {
    return (_jsxs("div", { style: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px', flex: '1 1 0' }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }, children: label }), _jsx("div", { style: { fontSize: 28, fontWeight: 800, color: color || '#0f172a' }, children: value }), sub && _jsx("div", { style: { fontSize: 12, color: '#9ca3af', marginTop: 4 }, children: sub })] }));
}
function ChartCard({ title, children }) {
    return (_jsxs("div", { style: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }, children: [_jsx("div", { style: { fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 20 }, children: title }), children] }));
}
function LoadingState() {
    return _jsx("div", { style: { textAlign: 'center', padding: 80, color: '#9ca3af', fontSize: 14 }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." });
}
function SalesReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const { chart, sales, summary } = data;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap' }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u043F\u0440\u043E\u0434\u0430\u0436\u0431\u0438", value: summary.total }), _jsx(KpiCard, { label: "\u041F\u0440\u0438\u0445\u043E\u0434", value: `${summary.totalRevenue.toFixed(2)} лв.`, color: "#059669" }), _jsx(KpiCard, { label: "\u0421\u0440\u0435\u0434\u043D\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0431\u0430", value: `${summary.avgSale.toFixed(2)} лв.` }), _jsx(KpiCard, { label: "\u041A\u0435\u0448", value: summary.cash, color: "#d97706" }), _jsx(KpiCard, { label: "\u041A\u0430\u0440\u0442\u0430", value: summary.card, color: "#1e40af" })] }), _jsx(ChartCard, { title: "\u041F\u0440\u043E\u0434\u0430\u0436\u0431\u0438 \u043F\u043E \u0434\u043D\u0438", children: _jsx(ResponsiveContainer, { width: "100%", height: 280, children: _jsxs(BarChart, { data: chart, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 } }), _jsx(YAxis, { yAxisId: "left", tick: { fontSize: 11 } }), _jsx(YAxis, { yAxisId: "right", orientation: "right", tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { yAxisId: "left", dataKey: "count", name: "\u0411\u0440\u043E\u0439", fill: "#4facfe", radius: [4, 4, 0, 0] }), _jsx(Bar, { yAxisId: "right", dataKey: "revenue", name: "\u041F\u0440\u0438\u0445\u043E\u0434 (\u043B\u0432.)", fill: "#7c3aed", radius: [4, 4, 0, 0] })] }) }) }), _jsx(ChartCard, { title: `Продажби (${sales.length})`, children: _jsx("div", { style: { overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { style: { position: 'sticky', top: 0, background: 'white' }, children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Номер', 'Каса', 'Метод', 'Сума', 'Дата'].map((h) => (_jsx("th", { style: { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }, children: h }, h))) }) }), _jsx("tbody", { children: sales.map((s) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }, children: s.saleNo }), _jsx("td", { style: { padding: '8px 12px' }, children: s.cashRegister?.name }), _jsx("td", { style: { padding: '8px 12px' }, children: paymentLabels[s.paymentMethod] || s.paymentMethod }), _jsxs("td", { style: { padding: '8px 12px', fontWeight: 700, color: '#059669' }, children: [s.totalAmount.toFixed(2), " \u043B\u0432."] }), _jsx("td", { style: { padding: '8px 12px', color: '#9ca3af' }, children: new Date(s.createdAt).toLocaleDateString('bg-BG') })] }, s.id))) })] }) }) })] }));
}
function ProductsReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const totalQty = data.reduce((s, p) => s + p.qty, 0);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx(KpiCard, { label: "\u0410\u0440\u0442\u0438\u043A\u0443\u043B\u0438 \u043F\u0440\u043E\u0434\u0430\u0434\u0435\u043D\u0438", value: totalQty }), _jsx(KpiCard, { label: "\u0423\u043D\u0438\u043A\u0430\u043B\u043D\u0438 \u0430\u0440\u0442\u0438\u043A\u0443\u043B\u0438", value: data.length, color: "#7c3aed" })] }), _jsx(ChartCard, { title: "\u0422\u043E\u043F 10 \u043F\u043E \u043F\u0440\u0438\u0445\u043E\u0434", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: data.slice(0, 10), layout: "vertical", margin: { left: 80, right: 20 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { type: "number", tick: { fontSize: 11 } }), _jsx(YAxis, { dataKey: "name", type: "category", tick: { fontSize: 11 }, width: 80 }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "revenue", name: "\u041F\u0440\u0438\u0445\u043E\u0434 (\u043B\u0432.)", fill: "#4facfe", radius: [0, 4, 4, 0] })] }) }) }), _jsx(ChartCard, { title: "\u0414\u0435\u0442\u0430\u0439\u043B\u0438 \u043F\u043E \u0430\u0440\u0442\u0438\u043A\u0443\u043B", children: _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Артикул', 'Код', 'Количество', 'Приход'].map((h) => (_jsx("th", { style: { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }, children: h }, h))) }) }), _jsx("tbody", { children: data.map((p) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontWeight: 500 }, children: p.name }), _jsx("td", { style: { padding: '8px 12px', fontFamily: 'monospace', color: '#6b7280' }, children: p.code }), _jsx("td", { style: { padding: '8px 12px', fontWeight: 700 }, children: p.qty }), _jsxs("td", { style: { padding: '8px 12px', fontWeight: 700, color: '#059669' }, children: [p.revenue.toFixed(2), " \u043B\u0432."] })] }, p.code))) })] }) }) })] }));
}
