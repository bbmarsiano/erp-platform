import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { PageHeader } from '../../../components/ui';
import { useBackupJobs, useBackupPolicies } from '../hooks/useBackup';
function Card({ title, value }) {
    return (_jsxs("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }, children: [_jsx("div", { style: { color: '#6b7280', fontSize: 12, fontWeight: 700 }, children: title }), _jsx("div", { style: { marginTop: 8, fontSize: 26, fontWeight: 900 }, children: value })] }));
}
export default function BackupDashboard() {
    const policiesQuery = useBackupPolicies();
    const jobsQuery = useBackupJobs();
    const stats = useMemo(() => {
        const policies = (policiesQuery.data ?? []);
        const jobs = (jobsQuery.data ?? []);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const completed = jobs.filter((j) => j.status === 'COMPLETED');
        const lastCompleted = completed.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
        return {
            activePolicies: policies.filter((p) => p.isActive).length,
            lastBackup: lastCompleted ? new Date(lastCompleted.createdAt).toLocaleString('bg-BG') : 'Няма',
            successWeek: jobs.filter((j) => j.status === 'COMPLETED' && new Date(j.createdAt) >= weekStart).length,
            failedWeek: jobs.filter((j) => j.status === 'FAILED' && new Date(j.createdAt) >= weekStart).length
        };
    }, [jobsQuery.data, policiesQuery.data]);
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0410\u0440\u0445\u0438\u0432\u0438\u0440\u0430\u043D\u0435", subtitle: "\u041E\u0431\u0437\u043E\u0440 \u043D\u0430 \u0430\u0440\u0445\u0438\u0432\u0438\u0440\u0430\u043D\u0435\u0442\u043E" }), _jsxs("div", { style: { marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }, children: [_jsx(Card, { title: "\u0410\u043A\u0442\u0438\u0432\u043D\u0438 \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0438", value: stats.activePolicies }), _jsx(Card, { title: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u043E \u0430\u0440\u0445\u0438\u0432\u0438\u0440\u0430\u043D\u0435", value: stats.lastBackup }), _jsx(Card, { title: "\u0423\u0441\u043F\u0435\u0448\u043D\u0438 \u0442\u0430\u0437\u0438 \u0441\u0435\u0434\u043C\u0438\u0446\u0430", value: stats.successWeek }), _jsx(Card, { title: "\u041D\u0435\u0443\u0441\u043F\u0435\u0448\u043D\u0438 \u0442\u0430\u0437\u0438 \u0441\u0435\u0434\u043C\u0438\u0446\u0430", value: stats.failedWeek })] }), _jsxs("div", { style: { marginTop: 20, padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }, children: [_jsx("div", { style: { fontWeight: 600, marginBottom: 4 }, children: "\uD83D\uDFE2 Backup \u0430\u0433\u0435\u043D\u0442" }), _jsx("div", { style: { fontSize: 13, color: '#166534' }, children: "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0438\u0440\u0430\u043D \u2014 \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0432\u044A\u0440\u0437\u0432\u0430\u043D\u0435 \u0441 Go daemon" })] })] }));
}
