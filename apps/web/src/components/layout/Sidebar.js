import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Warehouse, Truck, Factory, ShoppingCart, HardDrive, Settings, LogOut, ChevronDown, Package, BarChart3, ClipboardList, Building2, ListTree, Monitor, CreditCard, Shield, History, RotateCcw, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../lib/api';
const navGroups = [
    {
        id: 'wms',
        label: 'Складово стопанство',
        basePath: '/wms',
        items: [
            { label: 'Табло', path: '/wms' },
            { label: 'Складове', path: '/wms/warehouses' },
            { label: 'Наличности', path: '/wms/stock' },
            { label: 'Приемане', path: '/wms/receipts' },
            { label: 'Изпращане', path: '/wms/issues' },
            { label: 'Движения', path: '/wms/movements' },
            { label: 'Справки', path: '/wms/reports' }
        ]
    },
    {
        id: 'scm',
        label: 'Верига на доставките',
        basePath: '/scm',
        items: [
            { label: 'Табло', path: '/scm' },
            { label: 'Доставчици', path: '/scm/suppliers' },
            { label: 'Поръчки покупка', path: '/scm/orders' },
            { label: 'Доставки', path: '/scm/deliveries' },
            { label: 'Справки', path: '/scm/reports' }
        ]
    },
    {
        id: 'mes',
        label: 'Производство',
        basePath: '/mes',
        items: [
            { label: 'Табло', path: '/mes' },
            { label: 'Рецептури (BOM)', path: '/mes/bom' },
            { label: 'Производствени нар.', path: '/mes/orders' },
            { label: 'Справки', path: '/mes/reports' }
        ]
    },
    {
        id: 'pos',
        label: 'Точка на продажба',
        basePath: '/pos',
        items: [
            { label: 'Каса', path: '/pos' },
            { label: 'Продажби', path: '/pos/sales' },
            { label: 'Каси', path: '/pos/registers' },
            { label: 'Справки', path: '/pos/reports' }
        ]
    },
    {
        id: 'backup',
        label: 'Архивиране',
        basePath: '/backup',
        items: [
            { label: 'Табло', path: '/backup' },
            { label: 'Политики', path: '/backup/policies' },
            { label: 'История', path: '/backup/jobs' },
            { label: 'Възстановяване', path: '/backup/restore' }
        ]
    }
];
const groupIcons = {
    wms: { icon: _jsx(Warehouse, { size: 17 }), color: '#818cf8' },
    scm: { icon: _jsx(Truck, { size: 17 }), color: '#34d399' },
    mes: { icon: _jsx(Factory, { size: 17 }), color: '#f472b6' },
    pos: { icon: _jsx(ShoppingCart, { size: 17 }), color: '#38bdf8' },
    backup: { icon: _jsx(HardDrive, { size: 17 }), color: '#4ade80' }
};
const itemIcons = {
    '/wms': _jsx(LayoutDashboard, { size: 13 }),
    '/wms/warehouses': _jsx(Warehouse, { size: 13 }),
    '/wms/stock': _jsx(Package, { size: 13 }),
    '/wms/receipts': _jsx(ClipboardList, { size: 13 }),
    '/wms/issues': _jsx(ClipboardList, { size: 13 }),
    '/wms/movements': _jsx(BarChart3, { size: 13 }),
    '/wms/reports': _jsx(BarChart3, { size: 13 }),
    '/scm': _jsx(LayoutDashboard, { size: 13 }),
    '/scm/suppliers': _jsx(Building2, { size: 13 }),
    '/scm/orders': _jsx(ClipboardList, { size: 13 }),
    '/scm/deliveries': _jsx(Truck, { size: 13 }),
    '/scm/reports': _jsx(BarChart3, { size: 13 }),
    '/mes': _jsx(LayoutDashboard, { size: 13 }),
    '/mes/bom': _jsx(ListTree, { size: 13 }),
    '/mes/orders': _jsx(ClipboardList, { size: 13 }),
    '/mes/reports': _jsx(BarChart3, { size: 13 }),
    '/pos': _jsx(Monitor, { size: 13 }),
    '/pos/sales': _jsx(ClipboardList, { size: 13 }),
    '/pos/registers': _jsx(CreditCard, { size: 13 }),
    '/pos/reports': _jsx(BarChart3, { size: 13 }),
    '/backup': _jsx(LayoutDashboard, { size: 13 }),
    '/backup/policies': _jsx(Shield, { size: 13 }),
    '/backup/jobs': _jsx(History, { size: 13 }),
    '/backup/restore': _jsx(RotateCcw, { size: 13 })
};
export function Sidebar({ open, onToggle, isMobile }) {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const [tenant, setTenant] = useState(null);
    const [expandedGroup, setExpandedGroup] = useState(null);
    useEffect(() => {
        api
            .get('/api/tenant')
            .then((r) => setTenant(r.data.data))
            .catch(() => { });
    }, []);
    useEffect(() => {
        const active = navGroups.find((g) => location.pathname.startsWith(g.basePath));
        if (active)
            setExpandedGroup(active.id);
    }, [location.pathname]);
    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };
    return (_jsxs("div", { style: {
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 240,
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            zIndex: isMobile ? 100 : 100,
            overflow: 'hidden',
            boxShadow: '2px 0 12px rgba(0,0,0,0.15)'
        }, children: [isMobile && (_jsx("button", { onClick: onToggle, style: {
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    borderRadius: 6,
                    padding: 6,
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                }, children: _jsx(X, { size: 16 }) })), _jsx("div", { style: { padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }, children: tenant?.logoUrl ? (_jsxs("div", { children: [_jsx("img", { src: tenant.logoUrl, alt: tenant.name, style: { maxHeight: 36, maxWidth: 160, objectFit: 'contain', display: 'block' }, onError: (e) => {
                                ;
                                e.target.style.display = 'none';
                            } }), _jsx("div", { style: { fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4 }, children: "powered by DFlowERP" })] })) : (_jsx("div", { style: { fontSize: 16, fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }, children: tenant?.name || 'DFlowERP' })) }), _jsxs("nav", { style: { flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }, children: [_jsx(NavLink, { to: "/dashboard", end: true, style: { textDecoration: 'none' }, children: ({ isActive }) => (_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '9px 16px',
                                margin: '1px 8px',
                                borderRadius: 7,
                                background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                                color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.65)',
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }, children: [_jsx(LayoutDashboard, { size: 17, color: "#94a3b8" }), open && _jsx("span", { children: "\u0422\u0430\u0431\u043B\u043E" })] })) }), (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (_jsx(NavLink, { to: "/users", style: { textDecoration: 'none' }, children: ({ isActive }) => (_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '9px 16px',
                                margin: '1px 8px',
                                borderRadius: 7,
                                background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                                color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.65)',
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }, children: [_jsx(Users, { size: 17, color: "#94a3b8" }), open && _jsx("span", { children: "\u041F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u0438" })] })) })), _jsx("div", { style: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 16px' } }), navGroups.map((group) => {
                        const isGroupActive = location.pathname.startsWith(group.basePath);
                        const isExpanded = expandedGroup === group.id;
                        const gIcon = groupIcons[group.id];
                        return (_jsxs("div", { children: [_jsxs("div", { onClick: () => setExpandedGroup(isExpanded ? null : group.id), style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '9px 16px',
                                        justifyContent: 'space-between',
                                        margin: '1px 8px',
                                        borderRadius: 7,
                                        background: isGroupActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                                        color: isGroupActive ? '#e0e7ff' : 'rgba(255,255,255,0.65)',
                                        fontSize: 13,
                                        fontWeight: isGroupActive ? 600 : 400,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("span", { style: { color: gIcon.color, display: 'flex', flexShrink: 0 }, children: gIcon.icon }), open && _jsx("span", { style: { whiteSpace: 'nowrap' }, children: group.label })] }), open && (_jsx(ChevronDown, { size: 12, style: {
                                                opacity: 0.5,
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s',
                                                flexShrink: 0
                                            } }))] }), open && isExpanded && (_jsx("div", { style: { overflow: 'hidden' }, children: group.items.map((item) => {
                                        const isActive = location.pathname === item.path ||
                                            (item.path !== group.basePath && location.pathname.startsWith(item.path));
                                        return (_jsx(NavLink, { to: item.path, style: { textDecoration: 'none' }, children: _jsxs("div", { style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '7px 16px 7px 42px',
                                                    margin: '1px 8px',
                                                    borderRadius: 6,
                                                    background: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
                                                    color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                                                    fontSize: 12.5,
                                                    fontWeight: isActive ? 500 : 400,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.12s',
                                                    whiteSpace: 'nowrap',
                                                    borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent'
                                                }, children: [_jsx("span", { style: { opacity: 0.6, display: 'flex', flexShrink: 0 }, children: itemIcons[item.path] }), item.label] }) }, item.path));
                                    }) }))] }, group.id));
                    })] }), _jsxs("div", { style: { borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 8px' }, children: [_jsx(NavLink, { to: "/settings", style: { textDecoration: 'none' }, children: _jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 12px',
                                borderRadius: 7,
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: 12,
                                transition: 'all 0.15s'
                            }, children: [_jsx(Settings, { size: 15, color: "#6b7280" }), open && _jsx("span", { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] }) }), open && (_jsxs("div", { style: {
                            padding: '8px 12px',
                            borderRadius: 7,
                            marginTop: 2,
                            background: 'rgba(255,255,255,0.04)'
                        }, children: [_jsx("div", { style: {
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: 'rgba(255,255,255,0.8)',
                                    marginBottom: 2
                                }, children: user?.firstName || user?.email?.split('@')[0] }), _jsx("div", { style: { fontSize: 11, color: 'rgba(255,255,255,0.35)' }, children: user?.email })] })), _jsxs("button", { onClick: handleLogout, style: {
                            width: '100%',
                            marginTop: 6,
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 7,
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.45)',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: 8,
                            transition: 'all 0.15s'
                        }, children: [_jsx(LogOut, { size: 14, color: "#6b7280" }), open && 'Изход'] })] })] }));
}
