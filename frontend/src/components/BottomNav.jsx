import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNav = ({ toggleTheme, theme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    if (!user) return null;

    const tabs = [
        { path: '/', icon: '📦', label: 'Stock' },
        ...(user.role === 'proprietaire'
            ? [
                { path: '/finances', icon: '💰', label: 'Finances' },
                { path: '/analytics', icon: '📈', label: 'Analytics' }
            ]
            : [{ path: '/saisie', icon: '💳', label: 'Saisie' }]
        ),
        { path: '/settings', icon: '⚙️', label: 'Réglages' },
        { path: '#theme', icon: theme === 'light' ? '🌙' : '☀️', label: theme === 'light' ? 'Sombre' : 'Clair' }
    ];

    return (
        <nav className="bottom-nav">
            {tabs.map(tab => (
                <button
                    key={tab.path}
                    className={`bottom-nav-item ${location.pathname === tab.path ? 'active' : ''}`}
                    onClick={() => {
                        if (tab.path === '#theme') {
                            toggleTheme();
                        } else {
                            navigate(tab.path);
                        }
                    }}
                >
                    <span className="bottom-nav-icon">{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
        </nav>
    );
};

export default BottomNav;
