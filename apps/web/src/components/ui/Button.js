import { jsx as _jsx } from "react/jsx-runtime";
export const Button = ({ children, style, ...props }) => (_jsx("button", { ...props, style: {
        borderRadius: 8,
        border: '1px solid #d4d4d8',
        padding: '8px 14px',
        fontWeight: 600,
        cursor: 'pointer',
        background: '#111827',
        color: '#ffffff',
        ...style
    }, children: children }));
