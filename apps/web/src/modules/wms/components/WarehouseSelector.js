import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useWarehouses } from '../hooks/useWms';
export function WarehouseSelector({ value, onChange, placeholder = 'Изберете склад', disabled }) {
    const { data, isLoading } = useWarehouses();
    const options = useMemo(() => {
        const warehouses = (data ?? []);
        return warehouses.filter((w) => w.isActive !== false);
    }, [data]);
    return (_jsxs("select", { value: value ?? '', disabled: disabled || isLoading, onChange: (e) => onChange(e.target.value), style: {
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #d4d4d8',
            background: '#fff',
            minWidth: 240
        }, children: [_jsx("option", { value: "", children: isLoading ? 'Зареждане...' : placeholder }), options.map((w) => (_jsxs("option", { value: w.id, children: [w.code, " \u2014 ", w.name] }, w.id)))] }));
}
