import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, PageHeader } from '../../../components/ui';
import { useRestorePoints, useTestRestore } from '../hooks/useBackup';
const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('bg-BG') : '—');
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
export default function Restore() {
    const restorePoints = useRestorePoints();
    const testRestore = useTestRestore();
    const handleTestRestore = (jobId) => {
        testRestore.mutate({ jobId, note: 'Ръчен тест на възстановяване от UI' });
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0412\u044A\u0437\u0441\u0442\u0430\u043D\u043E\u0432\u044F\u0432\u0430\u043D\u0435", subtitle: "\u0422\u043E\u0447\u043A\u0438 \u0437\u0430 \u0432\u044A\u0437\u0441\u0442\u0430\u043D\u043E\u0432\u044F\u0432\u0430\u043D\u0435" }), _jsx("div", { style: { marginTop: 14 }, children: (restorePoints.data ?? []).map((job) => (_jsx("div", { style: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8, background: '#fff' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontWeight: 600 }, children: ["\u0410\u0440\u0445\u0438\u0432 \u043E\u0442 ", formatDate(job.createdAt)] }), _jsxs("div", { style: { fontSize: 13, color: '#6b7280' }, children: ["\u0420\u0430\u0437\u043C\u0435\u0440: ", formatBytes(job.sizeBytes), " \u00B7 \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430: ", job.policy?.name ?? '—'] })] }), _jsx(Button, { variant: "secondary", onClick: () => handleTestRestore(job.id), children: "\u0422\u0435\u0441\u0442 \u043D\u0430 \u0432\u044A\u0437\u0441\u0442\u0430\u043D\u043E\u0432\u044F\u0432\u0430\u043D\u0435" })] }) }, job.id))) })] }));
}
