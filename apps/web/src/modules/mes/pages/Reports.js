import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { PageHeader } from '../../../components/ui';
import * as XLSX from 'xlsx';
import { api } from '../../../lib/api';
const workOrderLabels = {
    DRAFT: { label: 'Чернова', bg: '#f3f4f6', color: '#374151' },
    RELEASED: { label: 'Планирано', bg: '#dbeafe', color: '#1e40af' },
    IN_PROGRESS: { label: 'В изпълнение', bg: '#fef9c3', color: '#854d0e' },
    COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
    CANCELLED: { label: 'Анулирано', bg: '#fee2e2', color: '#991b1b' }
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
export default function MesReports() {
    const [period, setPeriod] = useState('30d');
    const [custom, setCustom] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10)
    });
    const [activeTab, setActiveTab] = useState('orders');
    const { dateFrom, dateTo } = getPeriodDates(period, custom);
    const ordersQ = useQuery({
        queryKey: ['mes', 'reports', 'orders', dateFrom, dateTo],
        queryFn: () => api
            .get(`/api/mes/reports/orders-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((r) => r.data.data),
        enabled: activeTab === 'orders'
    });
    const bomQ = useQuery({
        queryKey: ['mes', 'reports', 'bom'],
        queryFn: () => api.get('/api/mes/reports/bom-summary').then((r) => r.data.data),
        enabled: activeTab === 'bom'
    });
    const exportExcel = useCallback(() => {
        let rows = [];
        let sheetName = '';
        if (activeTab === 'orders' && ordersQ.data) {
            sheetName = 'Нареждания';
            rows = ordersQ.data.orders.map((o) => ({
                Номер: o.orderNo,
                Продукт: o.product?.name || '',
                Количество: o.plannedQty,
                Статус: workOrderLabels[o.status]?.label || o.status,
                Дата: new Date(o.createdAt).toLocaleDateString('bg-BG')
            }));
        }
        else if (activeTab === 'bom' && bomQ.data) {
            sheetName = 'Рецептури';
            rows = bomQ.data.map((b) => ({
                Наименование: b.name,
                Продукт: b.product,
                Код: b.productCode,
                Версия: b.version,
                Компоненти: b.components,
                Статус: b.isActive ? 'Активна' : 'Неактивна'
            }));
        }
        if (!rows.length)
            return;
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `MES_${sheetName}_${dateFrom}_${dateTo}.xlsx`);
    }, [activeTab, ordersQ.data, bomQ.data, dateFrom, dateTo]);
    const tabs = [
        { id: 'orders', label: 'Производствени нареждания' },
        { id: 'bom', label: 'Рецептури' }
    ];
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0421\u043F\u0440\u0430\u0432\u043A\u0438", subtitle: "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u043E \u2014 \u0430\u043D\u0430\u043B\u0438\u0437\u0438 \u0438 \u043E\u0442\u0447\u0435\u0442\u0438", action: _jsxs("button", { onClick: exportExcel, style: {
                        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                        background: '#16a34a', color: 'white', border: 'none', borderRadius: 8,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
                    }, children: [_jsx(Download, { size: 15 }), "\u0415\u043A\u0441\u043F\u043E\u0440\u0442 Excel"] }) }), activeTab === 'orders' && (_jsx(PeriodBar, { period: period, custom: custom, onPeriod: setPeriod, onCustom: setCustom })), _jsx("div", { style: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }, children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), style: {
                        padding: '9px 18px', border: 'none', cursor: 'pointer', background: 'none',
                        fontSize: 14, fontWeight: 500,
                        color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
                        borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                        marginBottom: -1
                    }, children: tab.label }, tab.id))) }), activeTab === 'orders' && _jsx(OrdersReport, { data: ordersQ.data, loading: ordersQ.isLoading }), activeTab === 'bom' && _jsx(BomReport, { data: bomQ.data, loading: bomQ.isLoading })] }));
}
function PeriodBar({ period, custom, onPeriod, onCustom }) {
    const periods = [
        { id: '7d', label: '7 дни' },
        { id: '30d', label: '30 дни' },
        { id: '90d', label: '90 дни' },
        { id: 'custom', label: 'По избор' }
    ];
    return (_jsxs("div", { style: {
            background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
            padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
        }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 600, color: '#374151' }, children: "\u041F\u0435\u0440\u0438\u043E\u0434:" }), periods.map((p) => (_jsx("button", { onClick: () => onPeriod(p.id), style: {
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    border: period === p.id ? 'none' : '1px solid #e5e7eb',
                    background: period === p.id ? '#7c3aed' : 'white',
                    color: period === p.id ? 'white' : '#374151', fontWeight: period === p.id ? 600 : 400
                }, children: p.label }, p.id))), period === 'custom' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }, children: [_jsx("input", { type: "date", value: custom.from, onChange: (e) => onCustom({ ...custom, from: e.target.value }), style: { padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 } }), _jsx("span", { style: { color: '#9ca3af' }, children: "\u2014" }), _jsx("input", { type: "date", value: custom.to, onChange: (e) => onCustom({ ...custom, to: e.target.value }), style: { padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 } })] }))] }));
}
function KpiCard({ label, value, color }) {
    return (_jsxs("div", { style: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px', flex: '1 1 0' }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }, children: label }), _jsx("div", { style: { fontSize: 28, fontWeight: 800, color: color || '#0f172a' }, children: value })] }));
}
function ChartCard({ title, children }) {
    return (_jsxs("div", { style: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }, children: [_jsx("div", { style: { fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 20 }, children: title }), children] }));
}
function LoadingState() {
    return _jsx("div", { style: { textAlign: 'center', padding: 80, color: '#9ca3af', fontSize: 14 }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." });
}
function OrdersReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const { chart, orders, summary } = data;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap' }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E", value: summary.total }), _jsx(KpiCard, { label: "\u0412 \u0438\u0437\u043F\u044A\u043B\u043D\u0435\u043D\u0438\u0435", value: summary.inProgress, color: "#d97706" }), _jsx(KpiCard, { label: "\u0417\u0430\u0432\u044A\u0440\u0448\u0435\u043D\u0438", value: summary.completed, color: "#059669" }), _jsx(KpiCard, { label: "\u041F\u043B\u0430\u043D\u0438\u0440\u0430\u043D\u0438", value: summary.planned, color: "#1e40af" }), _jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", value: summary.totalQty })] }), _jsx(ChartCard, { title: "\u041D\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0438\u044F \u043F\u043E \u0434\u043D\u0438", children: _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(LineChart, { data: chart, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 } }), _jsx(YAxis, { tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "count", name: "\u0411\u0440\u043E\u0439 \u043D\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0438\u044F", stroke: "#f5576c", strokeWidth: 2, dot: { fill: '#f5576c', r: 4 } })] }) }) }), _jsx(ChartCard, { title: `Нареждания (${orders.length})`, children: _jsx("div", { style: { overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { style: { position: 'sticky', top: 0, background: 'white' }, children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Номер', 'Продукт', 'Количество', 'Статус', 'Дата'].map((h) => (_jsx("th", { style: { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }, children: h }, h))) }) }), _jsx("tbody", { children: orders.map((o) => {
                                    const s = workOrderLabels[o.status] || { label: o.status, bg: '#f3f4f6', color: '#374151' };
                                    return (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }, children: o.orderNo }), _jsx("td", { style: { padding: '8px 12px', fontWeight: 500 }, children: o.product?.name }), _jsxs("td", { style: { padding: '8px 12px', fontWeight: 700 }, children: [o.plannedQty, " ", o.product?.unit] }), _jsx("td", { style: { padding: '8px 12px' }, children: _jsx("span", { style: { padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }, children: s.label }) }), _jsx("td", { style: { padding: '8px 12px', color: '#9ca3af' }, children: new Date(o.createdAt).toLocaleDateString('bg-BG') })] }, o.id));
                                }) })] }) }) })] }));
}
function BomReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const active = data.filter((b) => b.isActive).length;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u0440\u0435\u0446\u0435\u043F\u0442\u0443\u0440\u0438", value: data.length }), _jsx(KpiCard, { label: "\u0410\u043A\u0442\u0438\u0432\u043D\u0438", value: active, color: "#059669" })] }), _jsx(ChartCard, { title: "\u0420\u0435\u0446\u0435\u043F\u0442\u0443\u0440\u0438", children: _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Наименование', 'Продукт', 'Версия', 'Компоненти', 'Статус'].map((h) => (_jsx("th", { style: { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }, children: h }, h))) }) }), _jsx("tbody", { children: data.map((b) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontWeight: 500 }, children: b.name }), _jsx("td", { style: { padding: '8px 12px' }, children: b.product }), _jsx("td", { style: { padding: '8px 12px', color: '#6b7280' }, children: b.version }), _jsx("td", { style: { padding: '8px 12px', fontWeight: 700 }, children: b.components }), _jsx("td", { style: { padding: '8px 12px' }, children: _jsx("span", { style: {
                                                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                    background: b.isActive ? '#dcfce7' : '#f3f4f6',
                                                    color: b.isActive ? '#166534' : '#6b7280'
                                                }, children: b.isActive ? 'Активна' : 'Неактивна' }) })] }, b.productCode))) })] }) }) })] }));
}
