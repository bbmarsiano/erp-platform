import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, PageHeader } from '../../../components/ui';
import { StatusBadge } from '../components/StatusBadge';
import { WarehouseSelector } from '../components/WarehouseSelector';
import { useCancelIssue, useConfirmIssue, useIssue, useStock, useUpdateIssueDraft, useWarehouseLocations } from '../hooks/useWms';
export default function IssueDetail() {
    const { id } = useParams();
    const issueId = id ?? '';
    const navigate = useNavigate();
    const issueQuery = useIssue(issueId);
    const updateDraft = useUpdateIssueDraft();
    const confirm = useConfirmIssue();
    const cancel = useCancelIssue();
    const issue = issueQuery.data;
    const warehouseId = issue?.warehouseId;
    const locationsQuery = useWarehouseLocations(warehouseId);
    const stockQuery = useStock(warehouseId);
    const [newLine, setNewLine] = useState({ productId: '', locationId: '', quantity: 1, lotNumber: '' });
    const [localLines, setLocalLines] = useState(null);
    const lines = useMemo(() => {
        const apiLines = (issue?.lines ?? []);
        const base = apiLines.map((l) => ({
            productId: l.productId,
            locationId: l.locationId,
            quantity: l.quantity,
            lotNumber: l.lotNumber ?? undefined
        }));
        return localLines ?? base;
    }, [issue?.lines, localLines]);
    const products = useMemo(() => {
        const stock = (stockQuery.data ?? []);
        const map = new Map();
        for (const s of stock) {
            if (!s.product?.id)
                continue;
            const prev = map.get(s.product.id);
            const available = (prev?.available ?? 0) + (s.quantity ?? 0);
            map.set(s.product.id, { id: s.product.id, code: s.product.code, name: s.product.name, available });
        }
        return Array.from(map.values());
    }, [stockQuery.data]);
    const locations = useMemo(() => {
        const locs = (locationsQuery.data ?? []);
        return locs.map((l) => ({ id: l.id, code: l.code, name: l.name }));
    }, [locationsQuery.data]);
    const addLine = () => {
        if (!newLine.productId || !newLine.locationId || !newLine.quantity || newLine.quantity <= 0)
            return;
        setLocalLines((prev) => [...(prev ?? lines), { ...newLine, lotNumber: newLine.lotNumber?.trim() || undefined }]);
        setNewLine({ productId: '', locationId: '', quantity: 1, lotNumber: '' });
    };
    const saveDraft = async () => {
        await updateDraft.mutateAsync({ id: issueId, lines });
        setLocalLines(null);
    };
    const onConfirm = async () => {
        await confirm.mutateAsync(issueId);
    };
    const onCancel = async () => {
        await cancel.mutateAsync(issueId);
        navigate('/wms/issues');
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u0415\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u044F", subtitle: issue?.issueNo ? issue.issueNo : undefined, action: _jsx(Button, { variant: "secondary", onClick: () => navigate('/wms/issues'), children: "\u041D\u0430\u0437\u0430\u0434" }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }, children: [_jsxs("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }, children: [_jsx("div", { style: { fontSize: 12, color: '#6b7280', fontWeight: 700 }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("div", { style: { marginTop: 8 }, children: _jsx(WarehouseSelector, { value: warehouseId, onChange: () => { }, disabled: true }) })] }), _jsxs("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }, children: [_jsx("div", { style: { fontSize: 12, color: '#6b7280', fontWeight: 700 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("div", { style: { marginTop: 8 }, children: issue?.status ? _jsx(StatusBadge, { status: issue.status }) : '—' })] }), _jsxs("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }, children: [_jsx("div", { style: { fontSize: 12, color: '#6b7280', fontWeight: 700 }, children: "\u0414\u0430\u0442\u0430" }), _jsx("div", { style: { marginTop: 8, color: '#111827' }, children: issue?.createdAt ? new Date(issue.createdAt).toLocaleString('bg-BG') : '—' })] })] }), _jsxs("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, children: [_jsx("div", { style: { fontWeight: 900 }, children: "\u0420\u0435\u0434\u043E\u0432\u0435" }), _jsx("div", { style: { display: 'flex', gap: 8 }, children: issue?.status === 'DRAFT' ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: saveDraft, disabled: updateDraft.isPending, children: updateDraft.isPending ? 'Запис...' : 'Запази' }), _jsx(Button, { onClick: onConfirm, disabled: confirm.isPending || lines.length === 0, children: "\u041F\u043E\u0442\u0432\u044A\u0440\u0434\u0438" }), _jsx(Button, { variant: "danger", onClick: onCancel, disabled: cancel.isPending, children: "\u0410\u043D\u0443\u043B\u0438\u0440\u0430\u0439" })] })) : null })] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u0410\u0440\u0442\u0438\u043A\u0443\u043B" }), _jsx("th", { style: { padding: 10 }, children: "\u041B\u043E\u043A\u0430\u0446\u0438\u044F" }), _jsx("th", { style: { padding: 10 }, children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { padding: 10 }, children: "\u041F\u0430\u0440\u0442\u0438\u0434\u0430" })] }) }), _jsx("tbody", { children: issueQuery.isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, style: { padding: 12, color: '#6b7280' }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." }) })) : lines.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, style: { padding: 12, color: '#6b7280' }, children: "\u041D\u044F\u043C\u0430 \u0440\u0435\u0434\u043E\u0432\u0435" }) })) : (lines.map((l, idx) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: l.productId }), _jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: l.locationId }), _jsx("td", { style: { padding: 10, fontWeight: 700 }, children: l.quantity }), _jsx("td", { style: { padding: 10 }, children: l.lotNumber ?? '—' })] }, `${l.productId}-${l.locationId}-${idx}`)))) })] }), issue?.status === 'DRAFT' ? (_jsxs("div", { style: { marginTop: 14, borderTop: '1px solid #f3f4f6', paddingTop: 14 }, children: [_jsx("div", { style: { fontWeight: 900, marginBottom: 8 }, children: "\u0414\u043E\u0431\u0430\u0432\u0438 \u0440\u0435\u0434" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 140px 1fr auto', gap: 10, alignItems: 'end' }, children: [_jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }, children: ["\u0410\u0440\u0442\u0438\u043A\u0443\u043B (\u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442)", _jsxs("select", { value: newLine.productId, onChange: (e) => setNewLine((p) => ({ ...p, productId: e.target.value })), style: { padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8', background: '#fff' }, children: [_jsx("option", { value: "", children: products.length ? 'Изберете артикул' : 'Няма наличности за избор' }), products.map((p) => (_jsxs("option", { value: p.id, children: [p.code ? `${p.code} — ${p.name ?? p.id}` : p.id, " (", p.available ?? 0, ")"] }, p.id)))] })] }), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }, children: ["\u041B\u043E\u043A\u0430\u0446\u0438\u044F", _jsxs("select", { value: newLine.locationId, onChange: (e) => setNewLine((p) => ({ ...p, locationId: e.target.value })), style: { padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8', background: '#fff' }, children: [_jsx("option", { value: "", children: locationsQuery.isLoading ? 'Зареждане...' : 'Изберете локация' }), locations.map((l) => (_jsxs("option", { value: l.id, children: [l.code, " \u2014 ", l.name] }, l.id)))] })] }), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }, children: ["\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", _jsx("input", { type: "number", min: 0, value: newLine.quantity, onChange: (e) => setNewLine((p) => ({ ...p, quantity: Number(e.target.value) })), style: { padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' } })] }), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }, children: ["\u041F\u0430\u0440\u0442\u0438\u0434\u0430 (\u043F\u043E \u0438\u0437\u0431\u043E\u0440)", _jsx("input", { value: newLine.lotNumber ?? '', onChange: (e) => setNewLine((p) => ({ ...p, lotNumber: e.target.value })), placeholder: "LOT-001", style: { padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' } })] }), _jsx(Button, { onClick: addLine, children: "\u0414\u043E\u0431\u0430\u0432\u0438" })] })] })) : null] })] }));
}
