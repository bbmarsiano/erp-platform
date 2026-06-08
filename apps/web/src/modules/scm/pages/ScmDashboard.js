import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { PageHeader } from '../../../components/ui';
import { useDeliveries, usePurchaseOrders, useSuppliers } from '../hooks/useScm';
function Card({ title, value }) {
    return (_jsxs("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }, children: [_jsx("div", { style: { color: '#6b7280', fontSize: 12, fontWeight: 700 }, children: title }), _jsx("div", { style: { marginTop: 8, fontSize: 28, fontWeight: 800 }, children: value })] }));
}
export default function ScmDashboard() {
    const suppliers = useSuppliers();
    const orders = usePurchaseOrders();
    const deliveries = useDeliveries();
    const stats = useMemo(() => {
        const s = (suppliers.data ?? []);
        const o = (orders.data ?? []);
        const d = (deliveries.data ?? []);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        return {
            activeSuppliers: s.filter((x) => x.isActive).length,
            sentOrders: o.filter((x) => x.status === 'SENT').length,
            weekDeliveries: d.filter((x) => new Date(x.createdAt) >= weekStart).length,
            openOrders: o.filter((x) => x.status !== 'RECEIVED' && x.status !== 'CANCELLED').length
        };
    }, [deliveries.data, orders.data, suppliers.data]);
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0412\u0435\u0440\u0438\u0433\u0430 \u043D\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438\u0442\u0435", subtitle: "SCM \u0442\u0430\u0431\u043B\u043E" }), _jsxs("div", { style: { marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }, children: [_jsx(Card, { title: "\u0410\u043A\u0442\u0438\u0432\u043D\u0438 \u0434\u043E\u0441\u0442\u0430\u0432\u0447\u0438\u0446\u0438", value: suppliers.isLoading ? '...' : stats.activeSuppliers }), _jsx(Card, { title: "\u041F\u043E\u0440\u044A\u0447\u043A\u0438 \u0432 \u0438\u0437\u0447\u0430\u043A\u0432\u0430\u043D\u0435", value: orders.isLoading ? '...' : stats.sentOrders }), _jsx(Card, { title: "\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0438 \u0442\u0430\u0437\u0438 \u0441\u0435\u0434\u043C\u0438\u0446\u0430", value: deliveries.isLoading ? '...' : stats.weekDeliveries }), _jsx(Card, { title: "\u041D\u0435\u0437\u0430\u0442\u0432\u043E\u0440\u0435\u043D\u0438 \u043F\u043E\u0440\u044A\u0447\u043A\u0438", value: orders.isLoading ? '...' : stats.openOrders })] })] }));
}
