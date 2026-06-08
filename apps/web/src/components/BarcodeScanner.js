import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Scan, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useBarcodeScannerInput, useCameraScanner } from '../hooks/useBarcodeScanner';
import { api } from '../lib/api';
export function BarcodeScanner({ onProductFound, onClose, title = 'Баркод скенер' }) {
    const [mode, setMode] = useState('usb');
    const [cameraActive, setCameraActive] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [lastScan, setLastScan] = useState('');
    const [result, setResult] = useState(null);
    const handleScan = useCallback(async (barcode) => {
        if (scanning || barcode === lastScan)
            return;
        setLastScan(barcode);
        setScanning(true);
        setResult(null);
        try {
            const resp = await api.get(`/api/wms/products/by-barcode/${encodeURIComponent(barcode)}`);
            const product = resp.data.data;
            setResult({ ok: true, message: `Намерен: ${product.name}`, product });
            setTimeout(() => {
                onProductFound(product);
                setResult(null);
                setLastScan('');
            }, 800);
        }
        catch (err) {
            const msg = err?.response?.data?.error || 'Баркодът не е намерен в системата';
            setResult({ ok: false, message: msg });
            setTimeout(() => {
                setResult(null);
                setLastScan('');
            }, 2500);
        }
        finally {
            setScanning(false);
        }
    }, [scanning, lastScan, onProductFound]);
    useBarcodeScannerInput({ onScan: handleScan, active: mode === 'usb' });
    const { supported: cameraSupported } = useCameraScanner({
        onScan: handleScan,
        active: mode === 'camera' && cameraActive,
        elementId: 'barcode-camera-preview'
    });
    return (_jsx("div", { style: {
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
        }, children: _jsxs("div", { style: {
                background: 'white',
                borderRadius: 16,
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                overflow: 'hidden'
            }, children: [_jsxs("div", { style: {
                        padding: '18px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)'
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx(Scan, { size: 18, color: "white" }), _jsx("span", { style: { fontSize: 15, fontWeight: 700, color: 'white' }, children: title })] }), _jsx("button", { onClick: onClose, type: "button", style: {
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center'
                            }, children: _jsx(X, { size: 16, color: "white" }) })] }), _jsxs("div", { style: { padding: 20 }, children: [_jsx("div", { style: {
                                display: 'flex',
                                gap: 8,
                                marginBottom: 20,
                                background: '#f3f4f6',
                                borderRadius: 10,
                                padding: 4
                            }, children: [
                                { id: 'usb', label: 'USB/Bluetooth скенер', icon: _jsx(Scan, { size: 14 }) },
                                { id: 'camera', label: 'Камера', icon: _jsx(Camera, { size: 14 }) }
                            ].map((m) => (_jsxs("button", { type: "button", onClick: () => {
                                    setMode(m.id);
                                    setCameraActive(false);
                                }, style: {
                                    flex: 1,
                                    padding: '8px 12px',
                                    background: mode === m.id ? 'white' : 'transparent',
                                    border: 'none',
                                    borderRadius: 7,
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: mode === m.id ? 600 : 400,
                                    color: mode === m.id ? '#0f172a' : '#6b7280',
                                    boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.15s'
                                }, children: [m.icon, " ", m.label] }, m.id))) }), mode === 'usb' && (_jsxs("div", { children: [_jsxs("div", { style: {
                                        padding: '24px 20px',
                                        background: '#f8faff',
                                        border: '2px dashed #c7d2fe',
                                        borderRadius: 12,
                                        textAlign: 'center',
                                        marginBottom: 16
                                    }, children: [_jsx(Scan, { size: 32, color: "#7c3aed", style: { margin: '0 auto 10px' } }), _jsx("div", { style: { fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }, children: "\u0421\u043A\u0435\u043D\u0435\u0440\u044A\u0442 \u0435 \u0430\u043A\u0442\u0438\u0432\u0435\u043D" }), _jsx("div", { style: { fontSize: 12, color: '#9ca3af' }, children: "\u041D\u0430\u0441\u043E\u0447\u0435\u0442\u0435 \u0441\u043A\u0435\u043D\u0435\u0440\u0430 \u043A\u044A\u043C \u0431\u0430\u0440\u043A\u043E\u0434\u0430 \u0438\u043B\u0438 \u0432\u044A\u0432\u0435\u0434\u0435\u0442\u0435 \u0440\u044A\u0447\u043D\u043E" })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("input", { value: manualInput, onChange: (e) => setManualInput(e.target.value), onKeyDown: (e) => {
                                                if (e.key === 'Enter' && manualInput) {
                                                    handleScan(manualInput);
                                                    setManualInput('');
                                                }
                                            }, placeholder: "\u0420\u044A\u0447\u043D\u043E \u0432\u044A\u0432\u0435\u0436\u0434\u0430\u043D\u0435 \u043D\u0430 \u0431\u0430\u0440\u043A\u043E\u0434...", style: {
                                                flex: 1,
                                                padding: '9px 12px',
                                                border: '1.5px solid #e5e7eb',
                                                borderRadius: 8,
                                                fontSize: 13,
                                                fontFamily: 'inherit',
                                                outline: 'none'
                                            }, onFocus: (e) => {
                                                e.target.style.borderColor = '#7c3aed';
                                            }, onBlur: (e) => {
                                                e.target.style.borderColor = '#e5e7eb';
                                            } }), _jsx("button", { type: "button", onClick: () => {
                                                if (manualInput) {
                                                    handleScan(manualInput);
                                                    setManualInput('');
                                                }
                                            }, style: {
                                                padding: '9px 16px',
                                                background: '#7c3aed',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                fontSize: 13,
                                                fontWeight: 600
                                            }, children: "\u0422\u044A\u0440\u0441\u0438" })] })] })), mode === 'camera' && (_jsx("div", { children: !cameraActive ? (_jsxs("div", { style: { textAlign: 'center', padding: '24px 0' }, children: [_jsx(Camera, { size: 40, color: "#9ca3af", style: { margin: '0 auto 12px' } }), !cameraSupported ? (_jsx("div", { style: { color: '#dc2626', fontSize: 13 }, children: "\u041A\u0430\u043C\u0435\u0440\u0430\u0442\u0430 \u043D\u0435 \u0435 \u043F\u043E\u0434\u0434\u044A\u0440\u0436\u0430\u043D\u0430 \u043D\u0430 \u0442\u043E\u0432\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E" })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 14, color: '#6b7280', marginBottom: 16 }, children: "\u041A\u043B\u0438\u043A\u043D\u0435\u0442\u0435 \u0437\u0430 \u0434\u0430 \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u0430\u0442\u0435 \u043A\u0430\u043C\u0435\u0440\u0430\u0442\u0430" }), _jsx("button", { type: "button", onClick: () => setCameraActive(true), style: {
                                                    padding: '10px 24px',
                                                    background: '#7c3aed',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                    fontWeight: 600
                                                }, children: "\u0410\u043A\u0442\u0438\u0432\u0438\u0440\u0430\u0439 \u043A\u0430\u043C\u0435\u0440\u0430" })] }))] })) : (_jsxs("div", { children: [_jsx("div", { id: "barcode-camera-preview", style: {
                                            width: '100%',
                                            height: 240,
                                            borderRadius: 10,
                                            overflow: 'hidden',
                                            background: '#000',
                                            marginBottom: 10
                                        } }), _jsx("button", { type: "button", onClick: () => setCameraActive(false), style: {
                                            width: '100%',
                                            padding: '8px',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            border: 'none',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            fontWeight: 600
                                        }, children: "\u0421\u043F\u0440\u0438 \u043A\u0430\u043C\u0435\u0440\u0430\u0442\u0430" })] })) })), result && (_jsxs("div", { style: {
                                marginTop: 14,
                                padding: '12px 16px',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                background: result.ok ? '#f0fdf4' : '#fef2f2',
                                border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`
                            }, children: [result.ok ? _jsx(CheckCircle, { size: 18, color: "#16a34a" }) : _jsx(AlertCircle, { size: 18, color: "#dc2626" }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: result.ok ? '#15803d' : '#dc2626' }, children: result.message }), result.product && (_jsxs("div", { style: { fontSize: 12, color: '#6b7280' }, children: ["\u041D\u0430\u043B\u0438\u0447\u043D\u043E\u0441\u0442: ", result.product.totalStock, " ", result.product.unit] }))] })] })), scanning && (_jsx("div", { style: { textAlign: 'center', padding: 12, color: '#7c3aed', fontSize: 13 }, children: "\u0422\u044A\u0440\u0441\u0435\u043D\u0435..." }))] })] }) }));
}
