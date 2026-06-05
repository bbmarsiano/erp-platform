import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [email, setEmail] = useState('admin@dflowerp.com');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard', { replace: true });
        }
        catch (err) {
            setError(err?.response?.data?.error ?? 'Invalid credentials');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5'
        }, children: _jsxs("div", { style: {
                background: 'white',
                padding: '40px',
                borderRadius: '12px',
                width: '380px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
            }, children: [_jsx("h2", { style: { margin: '0 0 8px', fontSize: '22px' }, children: "Login to DFlowERP" }), _jsx("p", { style: { margin: '0 0 24px', color: '#666', fontSize: '14px' }, children: "Enter your credentials to continue" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }, children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, style: {
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    } })] }), _jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }, children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, style: {
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    } })] }), error && _jsx("p", { style: { color: '#dc2626', fontSize: '13px', margin: '0 0 12px' }, children: error }), _jsx("button", { type: "submit", disabled: loading, style: {
                                width: '100%',
                                padding: '11px',
                                background: loading ? '#666' : '#111',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }, children: loading ? 'Signing in...' : 'Sign in' })] })] }) }));
}
