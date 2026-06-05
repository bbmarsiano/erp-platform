import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useAuthStore } from '../store/auth.store';
export default function Dashboard() {
    const user = useAuthStore((s) => s.user);
    const modules = [
        { id: 'wms', name: 'Warehouse Management', status: 'coming_soon', icon: '🏭' },
        { id: 'scm', name: 'Supply Chain', status: 'coming_soon', icon: '🚚' },
        { id: 'mes', name: 'Manufacturing', status: 'coming_soon', icon: '⚙️' },
        { id: 'pos', name: 'Point of Sale', status: 'coming_soon', icon: '🛒' },
        { id: 'backup', name: 'Backup & Archive', status: 'coming_soon', icon: '💾' }
    ];
    return (_jsxs("div", { style: { padding: '32px' }, children: [_jsxs("h1", { style: { fontSize: '24px', fontWeight: 600, margin: '0 0 4px' }, children: ["Welcome, ", user?.firstName ?? user?.email] }), _jsxs("p", { style: { color: '#666', margin: '0 0 32px', fontSize: '14px' }, children: [user?.role, " \u00B7 Tenant ID: ", user?.tenantId] }), _jsx("h2", { style: { fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }, children: "Modules" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }, children: modules.map((mod) => (_jsxs("div", { style: {
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }, children: [_jsx("span", { style: { fontSize: '28px' }, children: mod.icon }), _jsx("span", { style: { fontSize: '14px', fontWeight: 500 }, children: mod.name }), _jsx("span", { style: {
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                background: '#f3f4f6',
                                color: '#6b7280',
                                alignSelf: 'flex-start'
                            }, children: "Coming soon" })] }, mod.id))) })] }));
}
