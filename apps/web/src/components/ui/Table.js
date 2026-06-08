import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Table({ columns, data, onRowClick, emptyMessage = 'Няма данни', keyField = 'id' }) {
    return (_jsx("div", { style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden'
        }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsx("tr", { style: { background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }, children: columns.map((col) => (_jsx("th", { style: {
                                padding: '11px 16px',
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#6b7280',
                                width: col.width
                            }, children: col.label }, col.key))) }) }), _jsx("tbody", { children: !data.length ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, style: { padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }, children: emptyMessage }) })) : (data.map((row, i) => (_jsx("tr", { onClick: () => onRowClick?.(row), style: {
                            borderBottom: '1px solid #f3f4f6',
                            cursor: onRowClick ? 'pointer' : 'default',
                            transition: 'background 0.1s'
                        }, onMouseEnter: (e) => {
                            if (onRowClick)
                                e.currentTarget.style.background = '#fafafa';
                        }, onMouseLeave: (e) => {
                            if (onRowClick)
                                e.currentTarget.style.background = 'white';
                        }, children: columns.map((col) => (_jsx("td", { style: { padding: '12px 16px', fontSize: 13 }, children: col.render ? col.render(row) : String(row[col.key] ?? '') }, col.key))) }, String(row[keyField] ?? i))))) })] }) }));
}
