import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardStats = ({ products }) => {
    const { user } = useAuth();
    const totalProduits = products.length;
    const alertesRupture = products.filter(p => p.quantite_stock <= p.seuil_minimum).length;
    const alertesSurplus = products.filter(p => p.quantite_stock >= p.seuil_maximum).length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantite_stock * (p.prix_unitaire || 0)), 0);

    return (
        <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--surface-color)', border: '2px solid var(--surface-border)', color: 'var(--primary-color)' }}>
                    📦
                </div>
                <div className="stat-content">
                    <h4>Total Références</h4>
                    <span className="stat-value">{totalProduits}</span>
                </div>
            </div>
            {user?.role === 'proprietaire' && (
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'var(--surface-color)', border: '2px solid var(--surface-border)', color: 'var(--primary-color)' }}>
                        💵
                    </div>
                    <div className="stat-content">
                        <h4>Valeur du Stock</h4>
                        <span className="stat-value">{totalValue.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                </div>
            )}
            <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--surface-color)', border: '2px solid var(--surface-border)', color: 'var(--primary-color)' }}>
                    ⚠️
                </div>
                <div className="stat-content">
                    <h4>En Rupture</h4>
                    <span className="stat-value">{alertesRupture}</span>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--surface-color)', border: '2px solid var(--surface-border)', color: 'var(--primary-color)' }}>
                    📈
                </div>
                <div className="stat-content">
                    <h4>En Surplus</h4>
                    <span className="stat-value">{alertesSurplus}</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
