import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
const AppShell = ({ children }) => (_jsxs("div", { style: { display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }, children: [_jsx(Sidebar, {}), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column' }, children: [_jsx(TopBar, {}), _jsx("main", { style: { padding: 24 }, children: children })] })] }));
export default AppShell;
