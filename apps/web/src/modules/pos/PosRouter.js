import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from 'react-router-dom';
import PosDashboard from './pages/PosDashboard';
import Registers from './pages/Registers';
import SaleDetail from './pages/SaleDetail';
import Sales from './pages/Sales';
export default function PosRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { index: true, element: _jsx(PosDashboard, {}) }), _jsx(Route, { path: "sales", element: _jsx(Sales, {}) }), _jsx(Route, { path: "sales/:id", element: _jsx(SaleDetail, {}) }), _jsx(Route, { path: "registers", element: _jsx(Registers, {}) })] }));
}
