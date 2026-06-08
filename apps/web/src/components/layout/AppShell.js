import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
export function AppShell({ children }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mobileOpen, setMobileOpen] = useState(false);
    useEffect(() => {
        const handler = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768)
                setMobileOpen(false);
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return (_jsxs("div", { style: {
            display: 'flex',
            minHeight: '100vh',
            background: '#f6f8fa',
            fontFamily: "'Inter', system-ui, sans-serif"
        }, children: [!isMobile && _jsx(Sidebar, { open: true, onToggle: () => { }, isMobile: false }), isMobile && mobileOpen && (_jsxs(_Fragment, { children: [_jsx("div", { onClick: () => setMobileOpen(false), style: {
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            zIndex: 99
                        } }), _jsx(Sidebar, { open: true, onToggle: () => setMobileOpen(false), isMobile: true })] })), _jsxs("div", { style: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    marginLeft: isMobile ? 0 : 240,
                    minWidth: 0
                }, children: [_jsx(TopBar, { onMenuToggle: () => setMobileOpen((o) => !o), showHamburger: isMobile }), _jsx("main", { style: { flex: 1, padding: '28px 32px' }, children: children })] })] }));
}
export default AppShell;
