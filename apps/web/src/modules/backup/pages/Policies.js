import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useBackupPolicies, useCreateBackupPolicy, useRunPolicy } from '../hooks/useBackup';
const cronLabel = (cron) => {
    if (cron.trim() === '0 2 * * *')
        return 'Всеки ден в 02:00';
    return cron;
};
export default function Policies() {
    const policies = useBackupPolicies();
    const createPolicy = useCreateBackupPolicy();
    const runPolicy = useRunPolicy();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: '',
        schedule: '0 2 * * *',
        retentionDays: 30,
        targetType: 'LOCAL',
        targetPath: '/backups/dflow',
        isEncrypted: true
    });
    const onCreate = async () => {
        if (!form.name || !form.schedule)
            return;
        await createPolicy.mutateAsync(form);
        setShowForm(false);
        setForm({
            name: '',
            schedule: '0 2 * * *',
            retentionDays: 30,
            targetType: 'LOCAL',
            targetPath: '/backups/dflow',
            isEncrypted: true
        });
    };
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0438" }), _jsx(Button, { onClick: () => setShowForm((x) => !x), children: showForm ? 'Отказ' : 'Нова политика' })] }), showForm ? (_jsxs("div", { style: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px 1fr auto', gap: 8, alignItems: 'end' }, children: [_jsx("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435", style: { padding: 8 } }), _jsx("input", { value: form.schedule, onChange: (e) => setForm({ ...form, schedule: e.target.value }), placeholder: "Cron", style: { padding: 8 } }), _jsx("input", { type: "number", value: form.retentionDays, onChange: (e) => setForm({ ...form, retentionDays: Number(e.target.value) }), style: { padding: 8 } }), _jsxs("select", { value: form.targetType, onChange: (e) => setForm({ ...form, targetType: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "LOCAL", children: "LOCAL" }), _jsx("option", { value: "NETWORK", children: "NETWORK" }), _jsx("option", { value: "S3", children: "S3" })] }), _jsx("input", { value: form.targetPath, onChange: (e) => setForm({ ...form, targetPath: e.target.value }), placeholder: "\u041F\u044A\u0442/target", style: { padding: 8 } }), _jsx(Button, { onClick: onCreate, children: "\u0421\u044A\u0437\u0434\u0430\u0439" })] })) : null, _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435" }), _jsx("th", { style: { padding: 10 }, children: "\u0413\u0440\u0430\u0444\u0438\u043A" }), _jsx("th", { style: { padding: 10 }, children: "\u0417\u0430\u0434\u044A\u0440\u0436\u0430\u043D\u0435 (\u0434\u043D\u0438)" }), _jsx("th", { style: { padding: 10 }, children: "\u0426\u0435\u043B" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u0440\u0438\u043F\u0442\u0438\u0440\u0430\u043D\u0435" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { style: { padding: 10 }, children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: (policies.data ?? []).map((p) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10 }, children: p.name }), _jsx("td", { style: { padding: 10 }, children: cronLabel(p.schedule) }), _jsx("td", { style: { padding: 10 }, children: p.retentionDays }), _jsx("td", { style: { padding: 10 }, children: p.targetType }), _jsx("td", { style: { padding: 10 }, children: p.isEncrypted ? 'Да' : 'Не' }), _jsx("td", { style: { padding: 10 }, children: p.isActive ? 'Активна' : 'Неактивна' }), _jsx("td", { style: { padding: 10 }, children: _jsx(Button, { onClick: () => runPolicy.mutate(p.id), style: { background: '#fff', border: '1px solid #ddd', color: '#111' }, children: "\u0421\u0442\u0430\u0440\u0442\u0438\u0440\u0430\u0439 \u0441\u0435\u0433\u0430" }) })] }, p.id))) })] }) })] }));
}
