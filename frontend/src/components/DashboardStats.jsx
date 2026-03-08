import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Animated count-up hook
const useCountUp = (target, duration = 600) => {
    const [value, setValue] = useState(0);
    const frameRef = useRef(null);

    useEffect(() => {
        if (target === 0) { setValue(0); return; }
        const start = performance.now();
        const from = 0;

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(from + (target - from) * eased));

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target, duration]);

    return value;
};

const DashboardStats = ({ products }) => {
    const { user } = useAuth();
    const totalProduits = products.length;
    const alertesRupture = products.filter(p => p.quantite_stock <= p.seuil_minimum).length;
    const alertesSurplus = products.filter(p => p.quantite_stock >= p.seuil_maximum).length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantite_stock * (p.prix_unitaire || 0)), 0);

    const animTotal = useCountUp(totalProduits);
    const animRupture = useCountUp(alertesRupture);
    const animSurplus = useCountUp(alertesSurplus);
    const animValue = useCountUp(totalValue, 800);

    return (
        <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="stat-card stat-card-enter">
                <div className="stat-icon" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--primary-color)' }}>
                    📦
                </div>
                <div className="stat-content">
                    <h4>Total Références</h4>
                    <span className="stat-value">{animTotal}</span>
                </div>
            </div>
            {user?.role === 'proprietaire' && (
                <div className="stat-card stat-card-enter">
                    <div className="stat-icon" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--primary-color)' }}>
                        💵
                    </div>
                    <div className="stat-content">
                        <h4>Valeur du Stock</h4>
                        <span className="stat-value">{animValue.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                </div>
            )}
            <div className="stat-card stat-card-enter">
                <div className="stat-icon" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--primary-color)' }}>
                    ⚠️
                </div>
                <div className="stat-content">
                    <h4>En Rupture</h4>
                    <span className="stat-value">{animRupture}</span>
                </div>
            </div>
            <div className="stat-card stat-card-enter">
                <div className="stat-icon" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--primary-color)' }}>
                    📈
                </div>
                <div className="stat-content">
                    <h4>En Surplus</h4>
                    <span className="stat-value">{animSurplus}</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
