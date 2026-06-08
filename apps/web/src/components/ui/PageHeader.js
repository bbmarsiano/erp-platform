import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PageHeader({ title, subtitle, action }) {
    return (_jsxs("div", { style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24
        }, children: [_jsxs("div", { children: [_jsx("h1", { style: {
                            fontSize: 22,
                            fontWeight: 700,
                            margin: '0 0 4px',
                            color: '#0f172a',
                            letterSpacing: '-0.3px'
                        }, children: title }), subtitle && _jsx("p", { style: { fontSize: 13, color: '#94a3b8', margin: 0 }, children: subtitle })] }), action && _jsx("div", { children: action })] }));
}
