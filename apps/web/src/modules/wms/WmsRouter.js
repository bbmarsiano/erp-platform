import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import WmsDashboard from './pages/WmsDashboard';
import Warehouses from './pages/Warehouses';
import Stock from './pages/Stock';
import Receipts from './pages/Receipts';
import ReceiptDetail from './pages/ReceiptDetail';
import Issues from './pages/Issues';
import IssueDetail from './pages/IssueDetail';
function Placeholder({ title }) {
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsx("div", { style: { fontSize: 22, fontWeight: 900 }, children: title }), _jsx("div", { style: { marginTop: 6, color: '#6b7280' }, children: "\u0422\u0430\u0437\u0438 \u0441\u0435\u043A\u0446\u0438\u044F \u0449\u0435 \u0431\u044A\u0434\u0435 \u0434\u043E\u0431\u0430\u0432\u0435\u043D\u0430 \u0432 \u0441\u043B\u0435\u0434\u0432\u0430\u0449 \u0435\u0442\u0430\u043F." })] }));
}
export default function WmsRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { index: true, element: _jsx(WmsDashboard, {}) }), _jsx(Route, { path: "warehouses", element: _jsx(Warehouses, {}) }), _jsx(Route, { path: "stock", element: _jsx(Stock, {}) }), _jsx(Route, { path: "receipts", element: _jsx(Receipts, {}) }), _jsx(Route, { path: "receipts/:id", element: _jsx(ReceiptDetail, {}) }), _jsx(Route, { path: "issues", element: _jsx(Issues, {}) }), _jsx(Route, { path: "issues/:id", element: _jsx(IssueDetail, {}) }), _jsx(Route, { path: "movements", element: _jsx(Placeholder, { title: "\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u044F" }) }), _jsx(Route, { path: "reports", element: _jsx(Placeholder, { title: "\u0421\u043F\u0440\u0430\u0432\u043A\u0438" }) })] }));
}
