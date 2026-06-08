import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from 'react-router-dom';
import BomDetail from './pages/BomDetail';
import MesReports from './pages/Reports';
import BomList from './pages/BomList';
import MesDashboard from './pages/MesDashboard';
import WorkOrderDetail from './pages/WorkOrderDetail';
import WorkOrders from './pages/WorkOrders';
export default function MesRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { index: true, element: _jsx(MesDashboard, {}) }), _jsx(Route, { path: "bom", element: _jsx(BomList, {}) }), _jsx(Route, { path: "bom/:productId", element: _jsx(BomDetail, {}) }), _jsx(Route, { path: "orders", element: _jsx(WorkOrders, {}) }), _jsx(Route, { path: "orders/:id", element: _jsx(WorkOrderDetail, {}) }), _jsx(Route, { path: "reports", element: _jsx(MesReports, {}) })] }));
}
