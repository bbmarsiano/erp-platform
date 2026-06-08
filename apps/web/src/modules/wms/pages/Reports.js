import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PageHeader } from '../../../components/ui';
import { api } from '../../../lib/api';
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
export default function WmsReports() {
    const [period, setPeriod] = useState('30d');
    const [custom, setCustom] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10)
    });
    const [activeTab, setActiveTab] = useState('movements');
    const { dateFrom, dateTo } = getPeriodDates(period, custom);
    const movementsQ = useQuery({
        queryKey: ['wms', 'reports', 'movements', dateFrom, dateTo],
        queryFn: () => api
            .get(`/api/wms/reports/movements-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((r) => r.data.data),
        enabled: activeTab === 'movements'
    });
    const stockQ = useQuery({
        queryKey: ['wms', 'reports', 'stock'],
        queryFn: () => api.get('/api/wms/reports/stock-by-product').then((r) => r.data.data),
        enabled: activeTab === 'stock'
    });
    const receiptsQ = useQuery({
        queryKey: ['wms', 'reports', 'receipts', dateFrom, dateTo],
        queryFn: () => api
            .get(`/api/wms/reports/receipts-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((r) => r.data.data),
        enabled: activeTab === 'receipts'
    });
    const exportExcel = useCallback(() => {
        let rows = [];
        let sheetName = '';
        if (activeTab === 'movements' && movementsQ.data) {
            sheetName = 'Движения';
            rows = movementsQ.data.movements.map((m) => ({
                Тип: m.movementType === 'IN' ? 'Вход' : 'Изход',
                Артикул: m.product?.name || '',
                Код: m.product?.code || '',
                Количество: m.quantity,
                'М.Е.': m.product?.unit || '',
                Дата: new Date(m.createdAt).toLocaleDateString('bg-BG')
            }));
        }
        else if (activeTab === 'stock' && stockQ.data) {
            sheetName = 'Наличности';
            rows = stockQ.data.map((p) => ({
                Артикул: p.name,
                Код: p.code,
                Наличност: p.quantity,
                'М.Е.': p.unit,
                'Мин. наличност': p.minStock,
                Статус: p.status
            }));
        }
        else if (activeTab === 'receipts' && receiptsQ.data) {
            sheetName = 'Приходи';
            rows = receiptsQ.data.receipts.map((r) => ({
                Номер: r.receiptNo,
                Склад: r.warehouse?.name || '',
                Доставчик: r.supplierName || '',
                Статус: r.status,
                Дата: new Date(r.createdAt).toLocaleDateString('bg-BG')
            }));
        }
        if (!rows.length)
            return;
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `WMS_${sheetName}_${dateFrom}_${dateTo}.xlsx`);
    }, [activeTab, movementsQ.data, stockQ.data, receiptsQ.data, dateFrom, dateTo]);
    const tabs = [
        { id: 'movements', label: 'Движения' },
        { id: 'stock', label: 'Наличности' },
        { id: 'receipts', label: 'Приходи' }
    ];
    const periods = [
        { id: '7d', label: '7 дни' },
        { id: '30d', label: '30 дни' },
        { id: '90d', label: '90 дни' },
        { id: 'custom', label: 'По избор' }
    ];
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0421\u043F\u0440\u0430\u0432\u043A\u0438", subtitle: "\u0421\u043A\u043B\u0430\u0434\u043E\u0432\u043E \u0441\u0442\u043E\u043F\u0430\u043D\u0441\u0442\u0432\u043E \u2014 \u0430\u043D\u0430\u043B\u0438\u0437\u0438 \u0438 \u043E\u0442\u0447\u0435\u0442\u0438", action: _jsxs("button", { onClick: exportExcel, style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 18px',
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
                    }, children: [_jsx(Download, { size: 15 }), "\u0415\u043A\u0441\u043F\u043E\u0440\u0442 Excel"] }) }), _jsxs("div", { style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap'
                }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 600, color: '#374151' }, children: "\u041F\u0435\u0440\u0438\u043E\u0434:" }), periods.map((p) => (_jsx("button", { onClick: () => setPeriod(p.id), style: {
                            padding: '6px 14px',
                            borderRadius: 20,
                            fontSize: 13,
                            cursor: 'pointer',
                            border: period === p.id ? 'none' : '1px solid #e5e7eb',
                            background: period === p.id ? '#7c3aed' : 'white',
                            color: period === p.id ? 'white' : '#374151',
                            fontWeight: period === p.id ? 600 : 400,
                            transition: 'all 0.15s'
                        }, children: p.label }, p.id))), period === 'custom' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }, children: [_jsx("input", { type: "date", value: custom.from, onChange: (e) => setCustom((c) => ({ ...c, from: e.target.value })), style: {
                                    padding: '5px 10px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 6,
                                    fontSize: 13
                                } }), _jsx("span", { style: { color: '#9ca3af' }, children: "\u2014" }), _jsx("input", { type: "date", value: custom.to, onChange: (e) => setCustom((c) => ({ ...c, to: e.target.value })), style: {
                                    padding: '5px 10px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 6,
                                    fontSize: 13
                                } })] }))] }), _jsx("div", { style: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }, children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), style: {
                        padding: '9px 18px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
                        borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                        marginBottom: -1,
                        transition: 'all 0.15s'
                    }, children: tab.label }, tab.id))) }), activeTab === 'movements' && (_jsx(MovementsReport, { data: movementsQ.data, loading: movementsQ.isLoading })), activeTab === 'stock' && _jsx(StockReport, { data: stockQ.data, loading: stockQ.isLoading }), activeTab === 'receipts' && (_jsx(ReceiptsReport, { data: receiptsQ.data, loading: receiptsQ.isLoading }))] }));
}
function KpiCard({ label, value, sub, color }) {
    return (_jsxs("div", { style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '18px 20px',
            flex: '1 1 0'
        }, children: [_jsx("div", { style: {
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8
                }, children: label }), _jsx("div", { style: {
                    fontSize: 28,
                    fontWeight: 800,
                    color: color || '#0f172a',
                    letterSpacing: '-0.5px'
                }, children: value }), sub && _jsx("div", { style: { fontSize: 12, color: '#9ca3af', marginTop: 4 }, children: sub })] }));
}
function ChartCard({ title, children }) {
    return (_jsxs("div", { style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '20px 24px'
        }, children: [_jsx("div", { style: { fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 20 }, children: title }), children] }));
}
function LoadingState() {
    return (_jsx("div", { style: { textAlign: 'center', padding: 80, color: '#9ca3af', fontSize: 14 }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." }));
}
function MovementsReport({ data, loading }) {
    if (loading)
        return _jsx(LoadingState, {});
    if (!data)
        return _jsx(LoadingState, {});
    const { chart, movements, summary } = data;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u0432\u0445\u043E\u0434", value: summary.totalIn, sub: `${summary.totalInQty} бр.`, color: "#059669" }), _jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u0438\u0437\u0445\u043E\u0434", value: summary.totalOut, sub: `${summary.totalOutQty} бр.`, color: "#dc2626" }), _jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F", value: summary.totalIn + summary.totalOut })] }), _jsx(ChartCard, { title: "\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u044F \u043F\u043E \u0434\u043D\u0438", children: _jsx(ResponsiveContainer, { width: "100%", height: 280, children: _jsxs(BarChart, { data: chart, margin: { top: 0, right: 10, bottom: 0, left: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 } }), _jsx(YAxis, { tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "inQty", name: "\u0412\u0445\u043E\u0434 (\u043A\u043E\u043B.)", fill: "#059669", radius: [4, 4, 0, 0] }), _jsx(Bar, { dataKey: "outQty", name: "\u0418\u0437\u0445\u043E\u0434 (\u043A\u043E\u043B.)", fill: "#dc2626", radius: [4, 4, 0, 0] })] }) }) }), _jsx(ChartCard, { title: `Детайли (${movements.length} записа)`, children: _jsx("div", { style: { overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { style: { position: 'sticky', top: 0, background: 'white' }, children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Тип', 'Артикул', 'Количество', 'Дата'].map((h) => (_jsx("th", { style: {
                                            padding: '8px 12px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: '#6b7280',
                                            fontSize: 12
                                        }, children: h }, h))) }) }), _jsx("tbody", { children: movements.slice(0, 100).map((m) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px' }, children: _jsx("span", { style: {
                                                    padding: '2px 8px',
                                                    borderRadius: 20,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    background: m.movementType === 'IN' ? '#dcfce7' : '#fee2e2',
                                                    color: m.movementType === 'IN' ? '#166534' : '#991b1b'
                                                }, children: m.movementType === 'IN' ? 'Вход' : 'Изход' }) }), _jsxs("td", { style: { padding: '8px 12px', fontWeight: 500 }, children: [m.product?.name, _jsx("div", { style: { fontSize: 11, color: '#9ca3af' }, children: m.product?.code })] }), _jsxs("td", { style: {
                                                padding: '8px 12px',
                                                fontWeight: 700,
                                                color: m.movementType === 'IN' ? '#059669' : '#dc2626'
                                            }, children: [m.movementType === 'IN' ? '+' : '-', m.quantity, " ", m.product?.unit] }), _jsx("td", { style: { padding: '8px 12px', color: '#9ca3af' }, children: new Date(m.createdAt).toLocaleDateString('bg-BG') })] }, m.id))) })] }) }) })] }));
}
function StockReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const low = data.filter((p) => p.status === 'Под минимум').length;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u0430\u0440\u0442\u0438\u043A\u0443\u043B\u0438", value: data.length }), _jsx(KpiCard, { label: "\u041F\u043E\u0434 \u043C\u0438\u043D\u0438\u043C\u0443\u043C", value: low, color: low > 0 ? '#dc2626' : '#059669' }), _jsx(KpiCard, { label: "\u041D\u043E\u0440\u043C\u0430\u043B\u043D\u0438", value: data.length - low, color: "#059669" })] }), _jsx(ChartCard, { title: "\u041D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438 \u043F\u043E \u0430\u0440\u0442\u0438\u043A\u0443\u043B", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: data.slice(0, 15), layout: "vertical", margin: { left: 80, right: 20 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { type: "number", tick: { fontSize: 11 } }), _jsx(YAxis, { dataKey: "name", type: "category", tick: { fontSize: 11 }, width: 80 }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "quantity", name: "\u041D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442", fill: "#7c3aed", radius: [0, 4, 4, 0] }), _jsx(Bar, { dataKey: "minStock", name: "\u041C\u0438\u043D\u0438\u043C\u0443\u043C", fill: "#e5e7eb", radius: [0, 4, 4, 0] })] }) }) }), _jsx(ChartCard, { title: "\u0414\u0435\u0442\u0430\u0439\u043B\u0438 \u043F\u043E \u0430\u0440\u0442\u0438\u043A\u0443\u043B", children: _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Артикул', 'Код', 'Наличност', 'Мин.', 'Статус'].map((h) => (_jsx("th", { style: {
                                            padding: '8px 12px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: '#6b7280',
                                            fontSize: 12
                                        }, children: h }, h))) }) }), _jsx("tbody", { children: data.map((p) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontWeight: 500 }, children: p.name }), _jsx("td", { style: { padding: '8px 12px', color: '#6b7280', fontFamily: 'monospace' }, children: p.code }), _jsxs("td", { style: {
                                                padding: '8px 12px',
                                                fontWeight: 700,
                                                color: p.status === 'Под минимум' ? '#dc2626' : '#059669'
                                            }, children: [p.quantity, " ", p.unit] }), _jsxs("td", { style: { padding: '8px 12px', color: '#9ca3af' }, children: [p.minStock, " ", p.unit] }), _jsx("td", { style: { padding: '8px 12px' }, children: _jsx("span", { style: {
                                                    padding: '2px 8px',
                                                    borderRadius: 20,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    background: p.status === 'Под минимум' ? '#fee2e2' : '#dcfce7',
                                                    color: p.status === 'Под минимум' ? '#991b1b' : '#166534'
                                                }, children: p.status }) })] }, p.code))) })] }) }) })] }));
}
function ReceiptsReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const { chart, receipts, summary } = data;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u043F\u0440\u0438\u0445\u043E\u0434\u0438", value: summary.total }), _jsx(KpiCard, { label: "\u041F\u043E\u0442\u0432\u044A\u0440\u0434\u0435\u043D\u0438", value: summary.confirmed, color: "#059669" }), _jsx(KpiCard, { label: "\u0427\u0435\u0440\u043D\u043E\u0432\u0438", value: summary.draft, color: "#d97706" })] }), _jsx(ChartCard, { title: "\u041F\u0440\u0438\u0445\u043E\u0434\u0438 \u043F\u043E \u0434\u043D\u0438", children: _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(LineChart, { data: chart, margin: { top: 0, right: 10, bottom: 0, left: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 } }), _jsx(YAxis, { tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "count", name: "\u0411\u0440\u043E\u0439 \u043F\u0440\u0438\u0445\u043E\u0434\u0438", stroke: "#7c3aed", strokeWidth: 2, dot: { fill: '#7c3aed', r: 4 } })] }) }) }), _jsx(ChartCard, { title: `Приходни бележки (${receipts.length})`, children: _jsx("div", { style: { overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { style: { position: 'sticky', top: 0, background: 'white' }, children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Номер', 'Склад', 'Доставчик', 'Статус', 'Дата'].map((h) => (_jsx("th", { style: {
                                            padding: '8px 12px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: '#6b7280',
                                            fontSize: 12
                                        }, children: h }, h))) }) }), _jsx("tbody", { children: receipts.map((r) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }, children: r.receiptNo }), _jsx("td", { style: { padding: '8px 12px' }, children: r.warehouse?.name }), _jsx("td", { style: { padding: '8px 12px', color: '#6b7280' }, children: r.supplierName || '—' }), _jsx("td", { style: { padding: '8px 12px' }, children: _jsx("span", { style: {
                                                    padding: '2px 8px',
                                                    borderRadius: 20,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    background: r.status === 'CONFIRMED' ? '#dcfce7' : '#fef9c3',
                                                    color: r.status === 'CONFIRMED' ? '#166534' : '#854d0e'
                                                }, children: r.status === 'CONFIRMED' ? 'Потвърден' : 'Чернова' }) }), _jsx("td", { style: { padding: '8px 12px', color: '#9ca3af', fontSize: 12 }, children: new Date(r.createdAt).toLocaleDateString('bg-BG') })] }, r.id))) })] }) }) })] }));
}
