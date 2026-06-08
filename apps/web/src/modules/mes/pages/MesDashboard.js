import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { PageHeader } from '../../../components/ui';
import { useBoms, useWorkOrders } from '../hooks/useMes';
function Card({ title, value }) {
    return (_jsxs("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }, children: [_jsx("div", { style: { color: '#6b7280', fontSize: 12, fontWeight: 700 }, children: title }), _jsx("div", { style: { marginTop: 8, fontSize: 28, fontWeight: 800 }, children: value })] }));
}
export default function MesDashboard() {
    const bomQuery = useBoms();
    const ordersQuery = useWorkOrders();
    const stats = useMemo(() => {
        const boms = (bomQuery.data ?? []);
        const orders = (ordersQuery.data ?? []);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        return {
            activeBoms: boms.filter((b) => b.isActive).length,
            inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
            completedWeek: orders.filter((o) => o.status === 'COMPLETED' && o.actualEnd && new Date(o.actualEnd) >= weekStart).length,
            draftOrders: orders.filter((o) => o.status === 'DRAFT').length
        };
    }, [bomQuery.data, ordersQuery.data]);
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u043E", subtitle: "MES \u0442\u0430\u0431\u043B\u043E" }), _jsxs("div", { style: { marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }, children: [_jsx(Card, { title: "\u0410\u043A\u0442\u0438\u0432\u043D\u0438 \u0440\u0435\u0446\u0435\u043F\u0442\u0443\u0440\u0438", value: stats.activeBoms }), _jsx(Card, { title: "\u041D\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0438\u044F \u0432 \u0438\u0437\u043F\u044A\u043B\u043D\u0435\u043D\u0438\u0435", value: stats.inProgress }), _jsx(Card, { title: "\u0417\u0430\u0432\u044A\u0440\u0448\u0435\u043D\u0438 \u0442\u0430\u0437\u0438 \u0441\u0435\u0434\u043C\u0438\u0446\u0430", value: stats.completedWeek }), _jsx(Card, { title: "\u0427\u0435\u0440\u043D\u043E\u0432\u0438 \u043D\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0438\u044F", value: stats.draftOrders })] })] }));
}
