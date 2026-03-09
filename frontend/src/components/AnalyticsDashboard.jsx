import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Logo from './Logo';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AnalyticsDashboard = ({ theme, toggleTheme }) => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [caEvolution, setCaEvolution] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [marge, setMarge] = useState({ chiffreAffaires: 0, coutsAchatMatiere: 0, margeBruteValeur: 0, margeBrutePourcentage: 0 });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [caRes, topRes, margeRes] = await Promise.all([
                api.getAnalyticsCA(),
                api.getAnalyticsTopProducts(),
                api.getAnalyticsMarge()
            ]);
            setCaEvolution(caRes.data || []);
            setTopProducts(topRes.data || []);
            setMarge(margeRes.data || { chiffreAffaires: 0, coutsAchatMatiere: 0, margeBruteValeur: 0, margeBrutePourcentage: 0 });
        } catch (error) {
            console.error("Erreur Analytics:", error);
            toast.error("Impossible de charger les statistiques.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user.role !== 'proprietaire') {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate, fetchData]);

    // Formatters
    const formatFCFA = (value) => new Intl.NumberFormat('fr-FR').format(value) + ' F';

    // Theme colors
    const primaryColor = 'var(--text-primary)';
    const secondaryColor = 'var(--text-secondary)';
    const gridColor = 'var(--surface-border)';

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-secondary)' }}>Chargement des statistiques...</div>;
    }

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Marge
        const margeData = [
            ['Chiffre d\'Affaires (FCFA)', 'Achats Matières (FCFA)', 'Marge Brute (FCFA)', 'Marge Brute (%)'],
            [marge.chiffreAffaires, marge.coutsAchatMatiere, marge.margeBruteValeur, marge.margeBrutePourcentage]
        ];
        const wsMarge = XLSX.utils.aoa_to_sheet(margeData);
        XLSX.utils.book_append_sheet(wb, wsMarge, "Bilan & Marge");

        // Sheet 2: Top Produits
        const topData = [
            ['Nom Produit', 'Catégorie', 'Quantité Sortie', 'Unité'],
            ...topProducts.map(p => [p.nom_produit, p.categorie, p.quantite_sortie, p.unite])
        ];
        const wsTop = XLSX.utils.aoa_to_sheet(topData);
        XLSX.utils.book_append_sheet(wb, wsTop, "Top Ventes");

        XLSX.writeFile(wb, `Analytics_MakalmyStock_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Export Excel réussi ✓");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFont("helvetica");

        doc.setFontSize(22);
        doc.text("Rapport Analytique - Makalmy Stock", 14, 20);
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 28);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Bilan de Rentabilité", 14, 40);

        doc.autoTable({
            startY: 45,
            head: [['Métriques', 'Valeur', 'Pourcentage']],
            body: [
                ['Chiffre d\'Affaires Global', `${marge.chiffreAffaires.toLocaleString('fr-FR')} F`, '-'],
                ['Coût des Achats Matières', `${marge.coutsAchatMatiere.toLocaleString('fr-FR')} F`, '-'],
                ['Marge Brute (Profit)', `${marge.margeBruteValeur.toLocaleString('fr-FR')} F`, `${marge.margeBrutePourcentage}%`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] }
        });

        const finalY = doc.lastAutoTable.finalY || 45;
        doc.text("Top des Ventes (Consommation de Stock)", 14, finalY + 15);

        doc.autoTable({
            startY: finalY + 20,
            head: [['Nom Produit', 'Catégorie', 'Quantité Sortie']],
            body: topProducts.map(p => [p.nom_produit, p.categorie, `${p.quantite_sortie} ${p.unite}`]),
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] }
        });

        doc.save(`Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Export PDF réussi ✓");
    };

    return (
        <div>
            {/* ===== HEADER ===== */}
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="secondary" onClick={() => navigate('/')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>📦 Stock</button>
                        <button className="secondary" onClick={() => navigate('/finances')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>💰 Finances</button>
                        <button style={{ padding: '6px 14px', fontSize: '0.85rem', pointerEvents: 'none' }}>📈 Analytics</button>
                        <button className="secondary" onClick={() => navigate('/settings')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>⚙️ Réglages</button>
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <button onClick={toggleTheme} className="secondary" style={{ fontSize: '1rem', padding: '6px 10px', borderRadius: '50%' }}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button onClick={logOut} className="secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Quitter</button>
                </div>
            </header>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: primaryColor }}>Analyse Globale</h2>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={handleExportExcel} className="secondary" style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '0.9rem' }}>📊 Exporter Excel</button>
                    <button onClick={handleExportPDF} style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '0.9rem', background: 'var(--danger-color)', color: '#fff', border: 'none' }}>📄 Exporter PDF</button>
                </div>
            </div>

            {/* ===== TOP CARDS (Marge & CA) ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ background: 'var(--surface-color)' }}>
                    <div className="stat-content">
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Chiffre d'Affaires Global</h4>
                        <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: primaryColor }}>{formatFCFA(marge.chiffreAffaires)}</span>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'var(--surface-color)' }}>
                    <div className="stat-content">
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Achats Matières Premières</h4>
                        <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: secondaryColor }}>{formatFCFA(marge.coutsAchatMatiere)}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Coût des marchandises vendues</div>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'var(--surface-color)', borderLeft: '4px solid var(--text-primary)' }}>
                    <div className="stat-content">
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Marge Brute (Profit)</h4>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: primaryColor }}>{formatFCFA(marge.margeBruteValeur)}</span>
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: marge.margeBrutePourcentage > 0 ? primaryColor : secondaryColor }}>
                                {marge.margeBrutePourcentage}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== GRAPHIQUES ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* Graphique CA 7J */}
                <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem', color: primaryColor }}>Évolution du CA (7 Derniers Jours)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <LineChart data={caEvolution} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis dataKey="label" stroke={secondaryColor} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis
                                    stroke={secondaryColor}
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: gridColor, borderRadius: '8px', color: primaryColor }}
                                    formatter={(value) => [formatFCFA(value), "Revenus"]}
                                    labelStyle={{ color: secondaryColor }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ca"
                                    stroke={primaryColor}
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--bg-color)', stroke: primaryColor, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 5 Produits */}
                <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem', color: primaryColor }}>Top Produits Sortis</h3>
                    <p style={{ fontSize: '0.8rem', color: secondaryColor, marginBottom: '1.5rem', marginTop: 0 }}>Basé sur l'historique de consommation du stock</p>

                    {topProducts.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: secondaryColor, fontSize: '0.9rem' }}>
                            Aucune donnée de sortie de stock suffisante pour calculer le top.
                        </div>
                    ) : (
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                                    <XAxis type="number" stroke={secondaryColor} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        type="category"
                                        dataKey="nom_produit"
                                        stroke={primaryColor}
                                        tick={{ fontSize: 12, fill: primaryColor }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--bg-color)' }}
                                        contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: gridColor, borderRadius: '8px', color: primaryColor }}
                                        formatter={(value, name, props) => [`${value} ${props.payload.unite}`, "Sorties"]}
                                    />
                                    <Bar dataKey="quantite_sortie" fill={primaryColor} radius={[0, 4, 4, 0]}>
                                        {topProducts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--text-primary)' : 'var(--text-secondary)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AnalyticsDashboard;
