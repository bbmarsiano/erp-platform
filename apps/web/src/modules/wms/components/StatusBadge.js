import { jsx as _jsx } from "react/jsx-runtime";
const statusMap = {
    DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
    CONFIRMED: { label: 'Потвърден', bg: '#dcfce7', color: '#166534' },
    CANCELLED: { label: 'Анулиран', bg: '#fee2e2', color: '#991b1b' }
};
export function StatusBadge({ status }) {
    const s = statusMap[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' };
    return (_jsx("span", { style: {
            padding: '2px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            background: s.bg,
            color: s.color
        }, children: s.label }));
}
