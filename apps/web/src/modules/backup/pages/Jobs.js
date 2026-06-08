import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, PageHeader } from '../../../components/ui';
import { useBackupJobs, useVerifyBackupJob } from '../hooks/useBackup';
const jobStatusMap = {
    PENDING: { label: 'Изчакване', bg: '#fef9c3', color: '#854d0e' },
    RUNNING: { label: 'Изпълнява се', bg: '#dbeafe', color: '#1e40af' },
    COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
    FAILED: { label: 'Грешка', bg: '#fee2e2', color: '#991b1b' },
    VERIFIED: { label: 'Верифицирано', bg: '#f0fdf4', color: '#14532d' }
};
const formatBytes = (bytes) => {
    if (!bytes)
        return '—';
    const b = Number(bytes);
    if (!Number.isFinite(b) || b <= 0)
        return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let val = b;
    let i = 0;
    while (val >= 1024 && i < units.length - 1) {
        val /= 1024;
        i += 1;
    }
    return `${val.toFixed(1)} ${units[i]}`;
};
export default function Jobs() {
    const jobs = useBackupJobs();
    const verify = useVerifyBackupJob();
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F", subtitle: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043D\u0430 \u0430\u0440\u0445\u0438\u0432\u043D\u0438 \u0437\u0430\u0434\u0430\u0447\u0438" }), _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "ID" }), _jsx("th", { style: { padding: 10 }, children: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u041D\u0430\u0447\u0430\u043B\u043E" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u0440\u0430\u0439" }), _jsx("th", { style: { padding: 10 }, children: "\u0420\u0430\u0437\u043C\u0435\u0440" }), _jsx("th", { style: { padding: 10 }, children: "\u0412\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u0430\u043D\u043E" })] }) }), _jsx("tbody", { children: (jobs.data ?? []).map((j) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: j.id.slice(0, 8) }), _jsx("td", { style: { padding: 10 }, children: j.policy?.name ?? '—' }), _jsx("td", { style: { padding: 10 }, children: _jsx("span", { style: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: jobStatusMap[j.status]?.bg, color: jobStatusMap[j.status]?.color }, children: jobStatusMap[j.status]?.label ?? j.status }) }), _jsx("td", { style: { padding: 10 }, children: j.startedAt ? new Date(j.startedAt).toLocaleString('bg-BG') : '—' }), _jsx("td", { style: { padding: 10 }, children: j.completedAt ? new Date(j.completedAt).toLocaleString('bg-BG') : '—' }), _jsx("td", { style: { padding: 10 }, children: formatBytes(j.sizeBytes) }), _jsx("td", { style: { padding: 10 }, children: j.isVerified ? ('Да') : (_jsx(Button, { variant: "secondary", size: "sm", onClick: () => verify.mutate(j.id), children: "\u0412\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u0430\u0439" })) })] }, j.id))) })] }) })] }));
}
