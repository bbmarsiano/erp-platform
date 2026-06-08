import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import WmsDashboard from './pages/WmsDashboard';
import WmsReports from './pages/Reports';
import Warehouses from './pages/Warehouses';
import Stock from './pages/Stock';
import Receipts from './pages/Receipts';
import ReceiptDetail from './pages/ReceiptDetail';
import Issues from './pages/Issues';
import IssueDetail from './pages/IssueDetail';
import Movements from './pages/Movements';
export default function WmsRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { index: true, element: _jsx(WmsDashboard, {}) }), _jsx(Route, { path: "warehouses", element: _jsx(Warehouses, {}) }), _jsx(Route, { path: "stock", element: _jsx(Stock, {}) }), _jsx(Route, { path: "receipts", element: _jsx(Receipts, {}) }), _jsx(Route, { path: "receipts/:id", element: _jsx(ReceiptDetail, {}) }), _jsx(Route, { path: "issues", element: _jsx(Issues, {}) }), _jsx(Route, { path: "issues/:id", element: _jsx(IssueDetail, {}) }), _jsx(Route, { path: "movements", element: _jsx(Movements, {}) }), _jsx(Route, { path: "reports", element: _jsx(WmsReports, {}) })] }));
}
