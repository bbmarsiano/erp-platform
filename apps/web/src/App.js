import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Users from './pages/users/Users';
import BackupRouter from './modules/backup/BackupRouter';
import PosRouter from './modules/pos/PosRouter';
import NotFound from './pages/NotFound';
import { useAuthStore } from './store/auth.store';
import AppShell from './components/layout/AppShell';
import MesRouter from './modules/mes/MesRouter';
import WmsRouter from './modules/wms/WmsRouter';
import ScmRouter from './modules/scm/ScmRouter';
function PrivateRoute({ children }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return isAuthenticated ? _jsx(_Fragment, { children: children }) : _jsx(Navigate, { to: "/login", replace: true });
}
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/dashboard", element: _jsx(PrivateRoute, { children: _jsx(AppShell, { children: _jsx(Dashboard, {}) }) }) }), _jsx(Route, { path: "/wms/*", element: _jsx(PrivateRoute, { children: _jsx(AppShell, { children: _jsx(WmsRouter, {}) }) }) }), _jsx(Route, { path: "/scm/*", element: _jsx(PrivateRoute, { children: _jsx(AppShell, { children: _jsx(ScmRouter, {}) }) }) }), _jsx(Route, { path: "/mes/*", element: _jsx(PrivateRoute, { children: _jsx(AppShell, { children: _jsx(MesRouter, {}) }) }) }), _jsx(Route, { path: "/pos/*", element: _jsx(PrivateRoute, { children: _jsx(AppShell, { children: _jsx(PosRouter, {}) }) }) }), _jsx(Route, { path: "/users", element: _jsx(PrivateRoute, { children: _jsx(AppShell, { children: _jsx(Users, {}) }) }) }), _jsx(Route, { path: "/settings", element: _jsx(PrivateRoute, { children: _jsx(AppShell, { children: _jsx(Settings, {}) }) }) }), _jsx(Route, { path: "/backup/*", element: _jsx(PrivateRoute, { children: _jsx(AppShell, { children: _jsx(BackupRouter, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) })] }) }));
}
