import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Logo from './Logo';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const { loginAction } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (isRegister) {
            if (password !== confirmPassword) {
                setError('Les mots de passe ne correspondent pas.');
                setLoading(false);
                return;
            }
            try {
                const { data } = await api.register({ username, password });
                setSuccess(data.message);
                loginAction(data);
            } catch (err) {
                setError(err.response?.data?.error || "Erreur lors de l'inscription.");
                setLoading(false);
            }
        } else {
            try {
                const { data } = await api.login({ username, password });
                loginAction(data);
            } catch (err) {
                setError('Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.');
                setLoading(false);
            }
        }
    };

    return (
        <div className="login-container">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Logo />
            </div>
            <p className="login-subtitle">Gestion intelligente de votre stock</p>
            <div className="login-divider" />
            <h2>{isRegister ? 'Créer un compte' : 'Connexion'}</h2>
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
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                    />
                </div>
                {isRegister && (
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '12px', fontSize: '1rem', opacity: 0.5, pointerEvents: 'none' }}>🔒</span>
                        <input
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                            style={{ paddingLeft: '40px' }}
                            autoComplete="new-password"
                        />
                    </div>
                )}
                <button type="submit" disabled={loading || !username || !password} style={{ width: '100%' }}>
                    {loading ? <><span className="loading-spinner" /> {isRegister ? 'Création...' : 'Connexion...'}</> : (isRegister ? 'Créer le compte' : 'Se connecter')}
                </button>
                {error && <div className="login-error">{error}</div>}
                {success && <div style={{ marginTop: '0.8rem', padding: '8px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: '0.85rem', textAlign: 'center' }}>{success}</div>}
            </form>
            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isRegister ? (
                    <>Déjà un compte ? <button onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}>Se connecter</button></>
                ) : (
                    <>Pas de compte ? <button onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}>Créer un compte</button></>
                )}
            </div>
            {isRegister && (
                <div style={{ marginTop: '0.8rem', padding: '8px 12px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    💡 Le 1er compte créé est automatiquement <strong>Propriétaire</strong>. Les suivants sont des comptes <strong>Employé</strong>.
                </div>
            )}
        </div>
    );
};

export default Login;
