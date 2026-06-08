import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PageHeader } from '../../../components/ui';
import { api } from '../../../lib/api';
const orderStatusLabels = {
    DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
    SENT: { label: 'Изпратена', bg: '#dbeafe', color: '#1e40af' },
    RECEIVED: { label: 'Получена', bg: '#dcfce7', color: '#166534' },
    CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' },
    PARTIALLY_RECEIVED: { label: 'Частично', bg: '#fef9c3', color: '#854d0e' }
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
export default function ScmReports() {
    const [period, setPeriod] = useState('30d');
    const [custom, setCustom] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10)
    });
    const [activeTab, setActiveTab] = useState('orders');
    const { dateFrom, dateTo } = getPeriodDates(period, custom);
    const ordersQ = useQuery({
        queryKey: ['scm', 'reports', 'orders', dateFrom, dateTo],
        queryFn: () => api
            .get(`/api/scm/reports/orders-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((r) => r.data.data),
        enabled: activeTab === 'orders'
    });
    const suppliersQ = useQuery({
        queryKey: ['scm', 'reports', 'suppliers'],
        queryFn: () => api.get('/api/scm/reports/suppliers-summary').then((r) => r.data.data),
        enabled: activeTab === 'suppliers'
    });
    const deliveriesQ = useQuery({
        queryKey: ['scm', 'reports', 'deliveries', dateFrom, dateTo],
        queryFn: () => api
            .get(`/api/scm/reports/deliveries-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
            .then((r) => r.data.data),
        enabled: activeTab === 'deliveries'
    });
    const exportExcel = useCallback(() => {
        let rows = [];
        let sheetName = '';
        if (activeTab === 'orders' && ordersQ.data) {
            sheetName = 'Поръчки';
            rows = ordersQ.data.orders.map((o) => ({
                Номер: o.orderNo,
                Доставчик: o.supplier?.name || '',
                Статус: orderStatusLabels[o.status]?.label || o.status,
                Редове: o.lines.length,
                Дата: new Date(o.createdAt).toLocaleDateString('bg-BG')
            }));
        }
        else if (activeTab === 'suppliers' && suppliersQ.data) {
            sheetName = 'Доставчици';
            rows = suppliersQ.data.map((s) => ({
                Доставчик: s.name,
                Код: s.code,
                'Общо поръчки': s.total,
                Получени: s.received,
                Статус: s.isActive ? 'Активен' : 'Неактивен'
            }));
        }
        else if (activeTab === 'deliveries' && deliveriesQ.data) {
            sheetName = 'Доставки';
            rows = deliveriesQ.data.deliveries.map((d) => ({
                Номер: d.deliveryNo,
                Доставчик: d.supplierName || d.purchaseOrder?.supplier?.name || '',
                Статус: d.status === 'CONFIRMED' ? 'Потвърдена' : 'Чернова',
                Дата: new Date(d.createdAt).toLocaleDateString('bg-BG')
            }));
        }
        if (!rows.length)
            return;
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `SCM_${sheetName}_${dateFrom}_${dateTo}.xlsx`);
    }, [activeTab, ordersQ.data, suppliersQ.data, deliveriesQ.data, dateFrom, dateTo]);
    const tabs = [
        { id: 'orders', label: 'Поръчки' },
        { id: 'suppliers', label: 'Доставчици' },
        { id: 'deliveries', label: 'Доставки' }
    ];
    const periods = [
        { id: '7d', label: '7 дни' },
        { id: '30d', label: '30 дни' },
        { id: '90d', label: '90 дни' },
        { id: 'custom', label: 'По избор' }
    ];
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(ReportHeader, { subtitle: "\u0412\u0435\u0440\u0438\u0433\u0430 \u043D\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438\u0442\u0435 \u2014 \u0430\u043D\u0430\u043B\u0438\u0437\u0438 \u0438 \u043E\u0442\u0447\u0435\u0442\u0438", onExport: exportExcel }), _jsx(PeriodSelector, { period: period, custom: custom, periods: periods, onPeriodChange: setPeriod, onCustomChange: setCustom }), _jsx(TabBar, { tabs: tabs, activeTab: activeTab, onTabChange: (id) => setActiveTab(id) }), activeTab === 'orders' && _jsx(OrdersReport, { data: ordersQ.data, loading: ordersQ.isLoading }), activeTab === 'suppliers' && (_jsx(SuppliersReport, { data: suppliersQ.data, loading: suppliersQ.isLoading })), activeTab === 'deliveries' && (_jsx(DeliveriesReport, { data: deliveriesQ.data, loading: deliveriesQ.isLoading }))] }));
}
function ReportHeader({ subtitle, onExport }) {
    return (_jsx(PageHeader, { title: "\u0421\u043F\u0440\u0430\u0432\u043A\u0438", subtitle: subtitle, action: _jsxs("button", { onClick: onExport, style: {
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
            }, children: [_jsx(Download, { size: 15 }), "\u0415\u043A\u0441\u043F\u043E\u0440\u0442 Excel"] }) }));
}
function PeriodSelector({ period, custom, periods, onPeriodChange, onCustomChange }) {
    return (_jsxs("div", { style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap'
        }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 600, color: '#374151' }, children: "\u041F\u0435\u0440\u0438\u043E\u0434:" }), periods.map((p) => (_jsx("button", { onClick: () => onPeriodChange(p.id), style: {
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    cursor: 'pointer',
                    border: period === p.id ? 'none' : '1px solid #e5e7eb',
                    background: period === p.id ? '#7c3aed' : 'white',
                    color: period === p.id ? 'white' : '#374151',
                    fontWeight: period === p.id ? 600 : 400
                }, children: p.label }, p.id))), period === 'custom' && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }, children: [_jsx("input", { type: "date", value: custom.from, onChange: (e) => onCustomChange({ ...custom, from: e.target.value }), style: { padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 } }), _jsx("span", { style: { color: '#9ca3af' }, children: "\u2014" }), _jsx("input", { type: "date", value: custom.to, onChange: (e) => onCustomChange({ ...custom, to: e.target.value }), style: { padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 } })] }))] }));
}
function TabBar({ tabs, activeTab, onTabChange }) {
    return (_jsx("div", { style: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }, children: tabs.map((tab) => (_jsx("button", { onClick: () => onTabChange(tab.id), style: {
                padding: '9px 18px',
                border: 'none',
                cursor: 'pointer',
                background: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                marginBottom: -1
            }, children: tab.label }, tab.id))) }));
}
function KpiCard({ label, value, color }) {
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
                }, children: label }), _jsx("div", { style: { fontSize: 28, fontWeight: 800, color: color || '#0f172a' }, children: value })] }));
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
function StatusBadge({ status, labels }) {
    const s = labels[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
    return (_jsx("span", { style: {
            padding: '2px 8px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            background: s.bg,
            color: s.color
        }, children: s.label }));
}
function OrdersReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const { chart, orders, summary } = data;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap' }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u043F\u043E\u0440\u044A\u0447\u043A\u0438", value: summary.total }), _jsx(KpiCard, { label: "\u0418\u0437\u043F\u0440\u0430\u0442\u0435\u043D\u0438", value: summary.sent, color: "#1e40af" }), _jsx(KpiCard, { label: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438", value: summary.received, color: "#059669" }), _jsx(KpiCard, { label: "\u0427\u0435\u0440\u043D\u043E\u0432\u0438", value: summary.draft, color: "#d97706" })] }), _jsx(ChartCard, { title: "\u041F\u043E\u0440\u044A\u0447\u043A\u0438 \u043F\u043E \u0434\u043D\u0438", children: _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(LineChart, { data: chart, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 } }), _jsx(YAxis, { tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "count", name: "\u0411\u0440\u043E\u0439 \u043F\u043E\u0440\u044A\u0447\u043A\u0438", stroke: "#7c3aed", strokeWidth: 2, dot: { fill: '#7c3aed', r: 4 } })] }) }) }), _jsx(ChartCard, { title: `Поръчки (${orders.length})`, children: _jsx("div", { style: { overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { style: { position: 'sticky', top: 0, background: 'white' }, children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Номер', 'Доставчик', 'Статус', 'Редове', 'Дата'].map((h) => (_jsx("th", { style: { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }, children: h }, h))) }) }), _jsx("tbody", { children: orders.map((o) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }, children: o.orderNo }), _jsx("td", { style: { padding: '8px 12px' }, children: o.supplier?.name }), _jsx("td", { style: { padding: '8px 12px' }, children: _jsx(StatusBadge, { status: o.status, labels: orderStatusLabels }) }), _jsx("td", { style: { padding: '8px 12px' }, children: o.lines.length }), _jsx("td", { style: { padding: '8px 12px', color: '#9ca3af' }, children: new Date(o.createdAt).toLocaleDateString('bg-BG') })] }, o.id))) })] }) }) })] }));
}
function SuppliersReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const active = data.filter((s) => s.isActive).length;
    const withOrders = data.filter((s) => s.total > 0).length;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u0446\u0438", value: data.length }), _jsx(KpiCard, { label: "\u0410\u043A\u0442\u0438\u0432\u043D\u0438", value: active, color: "#059669" }), _jsx(KpiCard, { label: "\u0421 \u043F\u043E\u0440\u044A\u0447\u043A\u0438", value: withOrders, color: "#7c3aed" })] }), _jsx(ChartCard, { title: "\u041F\u043E\u0440\u044A\u0447\u043A\u0438 \u043F\u043E \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: data.slice(0, 15), layout: "vertical", margin: { left: 80, right: 20 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { type: "number", tick: { fontSize: 11 } }), _jsx(YAxis, { dataKey: "name", type: "category", tick: { fontSize: 11 }, width: 80 }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "total", name: "\u041E\u0431\u0449\u043E", fill: "#7c3aed", radius: [0, 4, 4, 0] }), _jsx(Bar, { dataKey: "received", name: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438", fill: "#059669", radius: [0, 4, 4, 0] })] }) }) }), _jsx(ChartCard, { title: "\u0414\u0435\u0442\u0430\u0439\u043B\u0438 \u043F\u043E \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u043A", children: _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Доставчик', 'Код', 'Общо поръчки', 'Получени'].map((h) => (_jsx("th", { style: { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }, children: h }, h))) }) }), _jsx("tbody", { children: data.map((s) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontWeight: 500 }, children: s.name }), _jsx("td", { style: { padding: '8px 12px', fontFamily: 'monospace', color: '#6b7280' }, children: s.code }), _jsx("td", { style: { padding: '8px 12px', fontWeight: 700 }, children: s.total }), _jsx("td", { style: { padding: '8px 12px', color: '#059669', fontWeight: 600 }, children: s.received })] }, s.code))) })] }) }) })] }));
}
function DeliveriesReport({ data, loading }) {
    if (loading || !data)
        return _jsx(LoadingState, {});
    const { chart, deliveries, summary } = data;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', gap: 16 }, children: [_jsx(KpiCard, { label: "\u041E\u0431\u0449\u043E \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438", value: summary.total }), _jsx(KpiCard, { label: "\u041F\u043E\u0442\u0432\u044A\u0440\u0434\u0435\u043D\u0438", value: summary.confirmed, color: "#059669" }), _jsx(KpiCard, { label: "\u0418\u0437\u0447\u0430\u043A\u0432\u0430\u0449\u0438", value: summary.pending, color: "#d97706" })] }), _jsx(ChartCard, { title: "\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0438 \u043F\u043E \u0434\u043D\u0438", children: _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(BarChart, { data: chart, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 11 } }), _jsx(YAxis, { tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", name: "\u0411\u0440\u043E\u0439 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438", fill: "#11998e", radius: [4, 4, 0, 0] })] }) }) }), _jsx(ChartCard, { title: `Доставки (${deliveries.length})`, children: _jsx("div", { style: { overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { style: { position: 'sticky', top: 0, background: 'white' }, children: _jsx("tr", { style: { borderBottom: '2px solid #e5e7eb' }, children: ['Номер', 'Доставчик', 'Статус', 'Дата'].map((h) => (_jsx("th", { style: { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }, children: h }, h))) }) }), _jsx("tbody", { children: deliveries.map((d) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }, children: d.deliveryNo }), _jsx("td", { style: { padding: '8px 12px' }, children: d.supplierName || d.purchaseOrder?.supplier?.name || '—' }), _jsx("td", { style: { padding: '8px 12px' }, children: _jsx("span", { style: {
                                                    padding: '2px 8px',
                                                    borderRadius: 20,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    background: d.status === 'CONFIRMED' ? '#dcfce7' : '#fef9c3',
                                                    color: d.status === 'CONFIRMED' ? '#166534' : '#854d0e'
                                                }, children: d.status === 'CONFIRMED' ? 'Потвърдена' : 'Чернова' }) }), _jsx("td", { style: { padding: '8px 12px', color: '#9ca3af' }, children: new Date(d.createdAt).toLocaleDateString('bg-BG') })] }, d.id))) })] }) }) })] }));
}
