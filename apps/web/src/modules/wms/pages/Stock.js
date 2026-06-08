import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Scan } from 'lucide-react';
import { BarcodeScanner } from '../../../components/BarcodeScanner';
import { PageHeader, StatusBadge } from '../../../components/ui';
import { api } from '../../../lib/api';
import { WarehouseSelector } from '../components/WarehouseSelector';
import { useStock } from '../hooks/useWms';
export default function Stock() {
    const [warehouseId, setWarehouseId] = useState('');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [highlightProductId, setHighlightProductId] = useState(null);
    const [editingBarcode, setEditingBarcode] = useState(null);
    const rowRefs = useRef({});
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useStock(warehouseId || undefined);
    const rows = useMemo(() => (data ?? []), [data]);
    const handleProductFound = (product) => {
        setScannerOpen(false);
        setHighlightProductId(product.id);
        const el = rowRefs.current[product.id];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => setHighlightProductId(null), 3000);
    };
    const saveBarcode = async (productId, barcode) => {
        await api.put(`/api/wms/products/${productId}/barcode`, { barcode });
        await queryClient.invalidateQueries({ queryKey: ['wms', 'stock'] });
        setEditingBarcode(null);
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "\u041D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438", subtitle: "\u0422\u0435\u043A\u0443\u0449\u0438 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438 \u043F\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u0438 \u043B\u043E\u043A\u0430\u0446\u0438\u044F", action: _jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center' }, children: [_jsxs("button", { type: "button", onClick: () => setScannerOpen(true), style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 14px',
                                background: '#7c3aed',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600
                            }, children: [_jsx(Scan, { size: 14 }), "\u0421\u043A\u0430\u043D\u0438\u0440\u0430\u0439 \u0438 \u0442\u044A\u0440\u0441\u0438"] }), _jsx("span", { style: { fontSize: 12, color: '#6b7280' }, children: "\u0424\u0438\u043B\u0442\u044A\u0440 \u043F\u043E \u0441\u043A\u043B\u0430\u0434" }), _jsx(WarehouseSelector, { value: warehouseId, onChange: setWarehouseId, placeholder: "\u0412\u0441\u0438\u0447\u043A\u0438 \u0441\u043A\u043B\u0430\u0434\u043E\u0432\u0435" })] }) }), _jsx("div", { style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12 }, children: isLoading ? (_jsx("div", { style: { padding: 12, color: '#6b7280' }, children: "\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435..." })) : error ? (_jsx("div", { style: { padding: 12, color: '#991b1b' }, children: "\u0413\u0440\u0435\u0448\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0440\u0435\u0436\u0434\u0430\u043D\u0435 \u043D\u0430 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438" })) : rows.length === 0 ? (_jsx("div", { style: { padding: 12, color: '#6b7280' }, children: "\u041D\u044F\u043C\u0430 \u043D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442\u0438" })) : (_jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }, children: [_jsx("th", { style: { width: '18%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }, children: "\u0410\u0440\u0442\u0438\u043A\u0443\u043B" }), _jsx("th", { style: { width: '12%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }, children: "\u041A\u043E\u0434" }), _jsx("th", { style: { width: '14%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }, children: "\u0411\u0430\u0440\u043A\u043E\u0434" }), _jsx("th", { style: { width: '22%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }, children: "\u041B\u043E\u043A\u0430\u0446\u0438\u044F" }), _jsx("th", { style: { width: '12%', padding: '11px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }, children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("th", { style: { width: '8%', padding: '11px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }, children: "\u041C\u0438\u043D." }), _jsx("th", { style: { width: '14%', padding: '11px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }, children: "\u0421\u0442\u0430\u0442\u0443\u0441" })] }) }), _jsx("tbody", { children: rows.map((item) => {
                                    const isLow = item.quantity < item.product?.minStock;
                                    const isEmpty = item.quantity === 0;
                                    const productId = item.product?.id;
                                    const isHighlighted = highlightProductId === productId;
                                    return (_jsxs("tr", { ref: (el) => {
                                            if (productId)
                                                rowRefs.current[productId] = el;
                                        }, style: {
                                            background: isHighlighted ? '#ede9fe' : isEmpty ? '#fff1f2' : isLow ? '#fff7ed' : 'white',
                                            borderBottom: '1px solid #f3f4f6',
                                            outline: isHighlighted ? '2px solid #7c3aed' : undefined,
                                            transition: 'background 0.3s'
                                        }, children: [_jsx("td", { style: { padding: '12px 16px', fontSize: 13, fontWeight: 500 }, children: item.product?.name }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }, children: item.product?.code }), _jsx("td", { style: { padding: '12px 16px' }, children: editingBarcode && editingBarcode.id === productId ? (_jsxs("div", { style: { display: 'flex', gap: 4 }, children: [_jsx("input", { value: editingBarcode.value, onChange: (e) => setEditingBarcode({ id: productId, value: e.target.value }), style: {
                                                                padding: '4px 8px',
                                                                border: '1.5px solid #7c3aed',
                                                                borderRadius: 6,
                                                                fontSize: 12,
                                                                width: 120,
                                                                outline: 'none'
                                                            }, autoFocus: true, onKeyDown: async (e) => {
                                                                const draft = editingBarcode;
                                                                if (e.key === 'Enter' && draft) {
                                                                    await saveBarcode(productId, draft.value);
                                                                }
                                                                if (e.key === 'Escape')
                                                                    setEditingBarcode(null);
                                                            } }), _jsx("button", { type: "button", onClick: () => setEditingBarcode(null), style: { border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }, children: "\u2715" })] })) : (_jsxs("div", { role: "button", tabIndex: 0, onClick: () => setEditingBarcode({ id: productId, value: item.product?.barcode || '' }), onKeyDown: (e) => {
                                                        if (e.key === 'Enter')
                                                            setEditingBarcode({ id: productId, value: item.product?.barcode || '' });
                                                    }, style: {
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        color: item.product?.barcode ? '#0f172a' : '#9ca3af',
                                                        fontFamily: item.product?.barcode ? 'monospace' : 'inherit',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4
                                                    }, children: [_jsx(Scan, { size: 11, color: item.product?.barcode ? '#7c3aed' : '#d1d5db' }), item.product?.barcode || 'Задай баркод'] })) }), _jsx("td", { style: { padding: '12px 16px', fontSize: 13, color: item.location ? 'inherit' : '#9ca3af' }, children: item.location ? `${item.location.code} — ${item.location.warehouse?.name}` : '—' }), _jsxs("td", { style: {
                                                    padding: '12px 16px',
                                                    textAlign: 'right',
                                                    fontSize: 13,
                                                    fontWeight: isLow ? 700 : 400,
                                                    color: isEmpty ? '#dc2626' : isLow ? '#c2410c' : '#111'
                                                }, children: [item.quantity, " ", item.product?.unit] }), _jsxs("td", { style: { padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }, children: [item.product?.minStock, " ", item.product?.unit] }), _jsx("td", { style: { padding: '12px 16px', textAlign: 'center' }, children: isEmpty ? (_jsx(StatusBadge, { label: "\u0418\u0437\u0447\u0435\u0440\u043F\u0430\u043D", bg: "#fee2e2", color: "#991b1b" })) : isLow ? (_jsx(StatusBadge, { label: "\u26A0\uFE0F \u041F\u043E\u0434 \u043C\u0438\u043D\u0438\u043C\u0443\u043C", bg: "#fff7ed", color: "#c2410c" })) : (_jsx(StatusBadge, { label: "\u2713 \u041D\u043E\u0440\u043C\u0430\u043B\u043D\u043E", bg: "#dcfce7", color: "#166534" })) })] }, item.id));
                                }) })] }) })) }), scannerOpen && (_jsx(BarcodeScanner, { title: "\u0422\u044A\u0440\u0441\u0435\u043D\u0435 \u043F\u043E \u0431\u0430\u0440\u043A\u043E\u0434", onProductFound: handleProductFound, onClose: () => setScannerOpen(false) }))] }));
}
