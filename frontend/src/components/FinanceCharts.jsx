import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

// Palette de couleurs modernes
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#e11d48', '#7c3aed', '#0ea5e9'];

const FinanceCharts = ({ transactions }) => {
    // --- Répartition des charges par catégorie SYSCOHADA (Doughnut) ---
    const chargesData = useMemo(() => {
        const charges = transactions.filter(t => t.type === 'charge');
        const byCategory = {};
        charges.forEach(t => {
            const cat = t.categorie_syscohada || 'Non catégorisé';
            // Simplify label: take only the label part after " - "
            const label = cat.includes(' - ') ? cat.split(' - ')[1] : cat;
            byCategory[label] = (byCategory[label] || 0) + t.montant;
        });
        const labels = Object.keys(byCategory);
        const values = Object.values(byCategory);
        return {
            labels,
            datasets: [{
                data: values,
                backgroundColor: COLORS.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 8
            }]
        };
    }, [transactions]);

    // --- Revenus vs Charges par jour (Bar Chart) ---
    const dailyData = useMemo(() => {
        const byDay = {};
        transactions.forEach(t => {
            const day = new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            if (!byDay[day]) byDay[day] = { revenus: 0, charges: 0 };
            if (t.type === 'revenu') byDay[day].revenus += t.montant;
            else byDay[day].charges += t.montant;
        });

        // Get last 14 days
        const days = Object.keys(byDay).slice(0, 14).reverse();
        return {
            labels: days,
            datasets: [
                {
                    label: 'Revenus',
                    data: days.map(d => byDay[d]?.revenus || 0),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderRadius: 4,
                    barPercentage: 0.6
                },
                {
                    label: 'Charges',
                    data: days.map(d => byDay[d]?.charges || 0),
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderRadius: 4,
                    barPercentage: 0.6
                }
            ]
        };
    }, [transactions]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } } }
        }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { padding: 10, usePointStyle: true, font: { size: 11 } } }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 }, callback: v => v.toLocaleString('fr-FR') } }
        }
    };

    if (transactions.length === 0) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Camembert des charges */}
            <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📊 Répartition des charges</h4>
                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {chargesData.labels.length > 0 ? (
                        <Doughnut data={chargesData} options={chartOptions} />
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Aucune charge enregistrée</p>
                    )}
                </div>
            </div>

            {/* Barres Revenus vs Charges */}
            <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📈 Revenus vs Charges (par jour)</h4>
                <div style={{ height: '250px' }}>
                    {dailyData.labels.length > 0 ? (
                        <Bar data={dailyData} options={barOptions} />
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '4rem' }}>Pas encore de données</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceCharts;
