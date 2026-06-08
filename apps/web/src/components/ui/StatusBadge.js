import { jsx as _jsx } from "react/jsx-runtime";
export function StatusBadge({ label, bg, color }) {
    return (_jsx("span", { style: {
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: bg,
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1.4
        }, children: label }));
}
