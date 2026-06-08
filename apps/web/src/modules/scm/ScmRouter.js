import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from 'react-router-dom';
import DeliveryDetail from './pages/DeliveryDetail';
import ScmReports from './pages/Reports';
import Deliveries from './pages/Deliveries';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import PurchaseOrders from './pages/PurchaseOrders';
import ScmDashboard from './pages/ScmDashboard';
import Suppliers from './pages/Suppliers';
export default function ScmRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { index: true, element: _jsx(ScmDashboard, {}) }), _jsx(Route, { path: "suppliers", element: _jsx(Suppliers, {}) }), _jsx(Route, { path: "orders", element: _jsx(PurchaseOrders, {}) }), _jsx(Route, { path: "orders/:id", element: _jsx(PurchaseOrderDetail, {}) }), _jsx(Route, { path: "deliveries", element: _jsx(Deliveries, {}) }), _jsx(Route, { path: "deliveries/:id", element: _jsx(DeliveryDetail, {}) }), _jsx(Route, { path: "reports", element: _jsx(ScmReports, {}) })] }));
}
