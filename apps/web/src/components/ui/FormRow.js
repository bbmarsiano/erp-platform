import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function FormRow({ children, columns = 2, gap = 12 }) {
    return (_jsx("div", { style: {
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap,
            marginBottom: 16
        }, children: children }));
}
export function FormField({ label, children, required }) {
    return (_jsxs("div", { children: [_jsxs("label", { style: {
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 6
                }, children: [label, required && _jsx("span", { style: { color: '#dc2626', marginLeft: 2 }, children: "*" })] }), children] }));
}
export function Input(props) {
    return (_jsx("input", { ...props, style: {
            width: '100%',
            padding: '9px 12px',
            border: '1.5px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
            outline: 'none',
            ...props.style
        }, onFocus: (e) => {
            e.target.style.borderColor = '#7c3aed';
            props.onFocus?.(e);
        }, onBlur: (e) => {
            e.target.style.borderColor = '#e5e7eb';
            props.onBlur?.(e);
        } }));
}
export function Select(props) {
    return (_jsx("select", { ...props, style: {
            width: '100%',
            padding: '9px 12px',
            border: '1.5px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'inherit',
            background: 'white',
            cursor: 'pointer',
            outline: 'none',
            boxSizing: 'border-box',
            ...props.style
        } }));
}
