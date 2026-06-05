import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from 'react-router-dom';
import BackupDashboard from './pages/BackupDashboard';
import Jobs from './pages/Jobs';
import Policies from './pages/Policies';
import Restore from './pages/Restore';
export default function BackupRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { index: true, element: _jsx(BackupDashboard, {}) }), _jsx(Route, { path: "policies", element: _jsx(Policies, {}) }), _jsx(Route, { path: "jobs", element: _jsx(Jobs, {}) }), _jsx(Route, { path: "restore", element: _jsx(Restore, {}) })] }));
}
