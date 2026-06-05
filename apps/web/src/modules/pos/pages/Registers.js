import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { WarehouseSelector } from '../../wms/components/WarehouseSelector';
import { useWarehouseLocations } from '../../wms/hooks/useWms';
import { useCreateRegister, useRegisters } from '../hooks/usePos';
export default function Registers() {
    const registers = useRegisters();
    const createRegister = useCreateRegister();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: '', name: '', warehouseId: '', locationId: '' });
    const locations = useWarehouseLocations(form.warehouseId);
    const onCreate = async () => {
        if (!form.code || !form.name || !form.warehouseId || !form.locationId)
            return;
        await createRegister.mutateAsync(form);
        setShowForm(false);
        setForm({ code: '', name: '', warehouseId: '', locationId: '' });
    };
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: "\u041A\u0430\u0441\u0438" }), _jsx(Button, { onClick: () => setShowForm((x) => !x), children: showForm ? 'Отказ' : 'Нова каса' })] }), showForm ? (_jsxs("div", { style: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }, children: [_jsx("input", { value: form.code, onChange: (e) => setForm({ ...form, code: e.target.value }), placeholder: "\u041A\u043E\u0434", style: { padding: 8 } }), _jsx("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435", style: { padding: 8 } }), _jsx(WarehouseSelector, { value: form.warehouseId, onChange: (warehouseId) => setForm({ ...form, warehouseId }) }), _jsxs("select", { value: form.locationId, onChange: (e) => setForm({ ...form, locationId: e.target.value }), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u041B\u043E\u043A\u0430\u0446\u0438\u044F" }), (locations.data ?? []).map((l) => (_jsxs("option", { value: l.id, children: [l.code, " \u2014 ", l.name] }, l.id)))] }), _jsx(Button, { onClick: onCreate, children: "\u0421\u044A\u0437\u0434\u0430\u0439" })] })) : null, _jsx("div", { style: { marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { padding: 10 }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx("th", { style: { padding: 10 }, children: "\u041B\u043E\u043A\u0430\u0446\u0438\u044F" }), _jsx("th", { style: { padding: 10 }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" })] }) }), _jsx("tbody", { children: (registers.data ?? []).map((r) => (_jsxs("tr", { style: { borderBottom: '1px solid #f3f4f6' }, children: [_jsx("td", { style: { padding: 10, fontFamily: 'monospace' }, children: r.code }), _jsx("td", { style: { padding: 10 }, children: r.name }), _jsx("td", { style: { padding: 10 }, children: r.warehouse?.name }), _jsx("td", { style: { padding: 10 }, children: r.location?.code }), _jsx("td", { style: { padding: 10 }, children: r.isActive ? 'Активна' : 'Неактивна' })] }, r.id))) })] }) })] }));
}
