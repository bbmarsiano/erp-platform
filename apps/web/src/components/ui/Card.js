import { jsx as _jsx } from "react/jsx-runtime";
export function Card({ children, padding = 24, style }) {
    return (_jsx("div", { style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding,
            ...style
        }, children: children }));
}
