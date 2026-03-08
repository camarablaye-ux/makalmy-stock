import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Logo from './Logo';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginAction } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.login({ username, password });
            loginAction(data);
        } catch (err) {
            setError('Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Logo />
            </div>
            <p className="login-subtitle">Gestion intelligente de votre stock</p>
            <div className="login-divider" />
            <h2>Connexion</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '12px', fontSize: '1rem', opacity: 0.5, pointerEvents: 'none' }}>👤</span>
                    <input
                        type="text"
                        placeholder="Nom d'utilisateur"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); }}
                        style={{ paddingLeft: '40px' }}
                        autoComplete="username"
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '12px', fontSize: '1rem', opacity: 0.5, pointerEvents: 'none' }}>🔒</span>
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        style={{ paddingLeft: '40px' }}
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" disabled={loading || !username || !password} style={{ width: '100%' }}>
                    {loading ? <><span className="loading-spinner" /> Connexion...</> : 'Se connecter'}
                </button>
                {error && <div className="login-error">{error}</div>}
            </form>
        </div>
    );
};

export default Login;