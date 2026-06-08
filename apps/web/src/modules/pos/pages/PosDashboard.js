import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { Scan } from 'lucide-react';
import { BarcodeScanner } from '../../../components/BarcodeScanner';
import { Button, PageHeader } from '../../../components/ui';
import { useStock } from '../../wms/hooks/useWms';
import { useCreateSale, useRegisters } from '../hooks/usePos';
export default function PosDashboard() {
    const stock = useStock();
    const registers = useRegisters();
    const createSale = useCreateSale();
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [registerId, setRegisterId] = useState('');
    const [lastSale, setLastSale] = useState(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const products = useMemo(() => (stock.data ?? [])
        .filter((x) => x.quantity > 0 && x.location)
        .sort((a, b) => a.product.code.localeCompare(b.product.code)), [stock.data]);
    const addToCart = useCallback((row) => {
        setCart((prev) => {
            const idx = prev.findIndex((c) => c.productId === row.product.id && c.locationId === row.location.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: Math.min(next[idx].quantity + 1, row.quantity) };
                return next;
            }
            return [
                ...prev,
                {
                    productId: row.product.id,
                    locationId: row.location.id,
                    name: row.product.name,
                    code: row.product.code,
                    unit: row.product.unit,
                    available: row.quantity,
                    quantity: 1,
                    unitPrice: 1
                }
            ];
        });
    }, []);
    const handleProductScanned = useCallback((product) => {
        setScannerOpen(false);
        const fromStockList = products.find((r) => r.product.id === product.id && r.quantity > 0);
        if (fromStockList) {
            addToCart(fromStockList);
            return;
        }
        const stockItem = product.stockItems?.find((si) => si.quantity > 0 && si.location);
        if (stockItem?.location) {
            addToCart({
                id: stockItem.id,
                product: { id: product.id, name: product.name, code: product.code, unit: product.unit },
                location: stockItem.location,
                quantity: stockItem.quantity
            });
        }
    }, [addToCart, products]);
    const total = cart.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0);
    const completeSale = async () => {
        if (!registerId || cart.length === 0)
            return;
        const sale = await createSale.mutateAsync({
            cashRegisterId: registerId,
            paymentMethod,
            lines: cart.map((c) => ({ productId: c.productId, locationId: c.locationId, quantity: c.quantity, unitPrice: c.unitPrice }))
        });
        setLastSale(sale);
        setCart([]);
    };
    return (_jsxs("div", { style: { padding: '28px 32px', maxWidth: 1400 }, children: [_jsx(PageHeader, { title: "POS \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B", subtitle: "\u0422\u0435\u0440\u043C\u0438\u043D\u0430\u043B \u0437\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0431\u0438" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '60% 40%', gap: 14, marginTop: 14 }, children: [_jsxs("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, children: [_jsx("div", { style: { fontSize: 15, fontWeight: 600, color: '#0f172a' }, children: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442\u0438" }), _jsxs("button", { type: "button", onClick: () => setScannerOpen(true), style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '8px 16px',
                                            background: '#7c3aed',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
                                        }, children: [_jsx(Scan, { size: 15 }), "\u0421\u043A\u0430\u043D\u0438\u0440\u0430\u0439"] })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }, children: products.map((row) => (_jsxs("button", { type: "button", onClick: () => addToCart(row), style: { textAlign: 'left', border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', padding: 10, cursor: 'pointer' }, children: [_jsx("div", { style: { fontWeight: 700 }, children: row.product.name }), _jsx("div", { style: { fontSize: 12, color: '#6b7280' }, children: row.product.code }), _jsxs("div", { style: { marginTop: 4, fontSize: 12 }, children: ["\u041D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442: ", row.quantity, " ", row.product.unit] })] }, row.id))) })] }), _jsxs("div", { style: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }, children: [_jsx("div", { style: { fontWeight: 800, marginBottom: 10 }, children: "\u0422\u0435\u043A\u0443\u0449\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0431\u0430" }), cart.map((c, idx) => (_jsxs("div", { style: { borderBottom: '1px solid #f3f4f6', padding: '8px 0' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("strong", { children: c.name }), _jsx("button", { type: "button", onClick: () => setCart((p) => p.filter((_, i) => i !== idx)), style: { border: 'none', background: 'transparent', color: '#dc2626' }, children: "\u2715" })] }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }, children: [_jsx("button", { type: "button", onClick: () => setCart((p) => p.map((x, i) => (i === idx ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))), children: "-" }), _jsx("span", { children: c.quantity }), _jsx("button", { type: "button", onClick: () => setCart((p) => p.map((x, i) => (i === idx ? { ...x, quantity: Math.min(x.available, x.quantity + 1) } : x))), children: "+" }), _jsx("input", { type: "number", value: c.unitPrice, onChange: (e) => setCart((p) => p.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) } : x))), style: { width: 90 } }), _jsxs("span", { children: [(c.quantity * c.unitPrice).toFixed(2), " \u043B\u0432."] })] })] }, `${c.productId}-${c.locationId}`))), _jsxs("div", { style: { marginTop: 14, fontSize: 28, fontWeight: 900 }, children: ["\u041E\u0431\u0449\u043E: ", total.toFixed(2), " \u043B\u0432."] }), _jsxs("div", { style: { marginTop: 12, display: 'grid', gap: 8 }, children: [_jsxs("select", { value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), style: { padding: 8 }, children: [_jsx("option", { value: "CASH", children: "\u041A\u0435\u0448" }), _jsx("option", { value: "CARD", children: "\u041A\u0430\u0440\u0442\u0430" }), _jsx("option", { value: "MIXED", children: "\u0421\u043C\u0435\u0441\u0435\u043D\u043E" })] }), _jsxs("select", { value: registerId, onChange: (e) => setRegisterId(e.target.value), style: { padding: 8 }, children: [_jsx("option", { value: "", children: "\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043A\u0430\u0441\u0430" }), (registers.data ?? []).map((r) => (_jsxs("option", { value: r.id, children: [r.code, " \u2014 ", r.name] }, r.id)))] }), _jsx(Button, { variant: "success", onClick: completeSale, disabled: createSale.isPending || !cart.length || !registerId, children: "\u0417\u0430\u0432\u044A\u0440\u0448\u0438 \u043F\u0440\u043E\u0434\u0430\u0436\u0431\u0430" })] }), lastSale ? (_jsxs("div", { style: { marginTop: 12, padding: 10, borderRadius: 10, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534' }, children: ["\u2705 \u041F\u0440\u043E\u0434\u0430\u0436\u0431\u0430 ", lastSale.saleNo, " \u2014 ", lastSale.totalAmount?.toFixed?.(2) ?? lastSale.totalAmount, " \u043B\u0432.", _jsx("div", { style: { marginTop: 8 }, children: _jsx(Button, { onClick: () => setLastSale(null), children: "\u041D\u043E\u0432\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0431\u0430" }) })] })) : null] })] }), scannerOpen && _jsx(BarcodeScanner, { title: "POS \u0421\u043A\u0435\u043D\u0435\u0440", onProductFound: handleProductScanned, onClose: () => setScannerOpen(false) })] }));
}
