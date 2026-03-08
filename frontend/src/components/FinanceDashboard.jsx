import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Logo from './Logo';
import FinanceCharts from './FinanceCharts';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// --- SYSCOHADA Révisé : Catégories adaptées à la restauration rapide ---
const CATEGORIES_SYSCOHADA = {
    revenu: [
        { code: '701', label: 'Ventes de marchandises', description: 'Chiffre d\'affaires du jour, ventes de menus, boissons, etc.', exemples: 'Vente du jour, Recette caisse' },
        { code: '706', label: 'Prestations de services', description: 'Revenus liés à un service rendu (livraison, traiteur, événementiel).', exemples: 'Service traiteur, Livraison payante' },
        { code: '707', label: 'Produits accessoires', description: 'Revenus non liés à l\'activité principale.', exemples: 'Location de salle, Publicité' },
        { code: '75', label: 'Autres produits', description: 'Tout autre revenu exceptionnel.', exemples: 'Remboursement, Subvention' }
    ],
    charge: [
        { code: '601', label: 'Achats matières premières', description: 'Nourriture et ingrédients pour la production.', exemples: 'Viande, Pain, Légumes, Huile' },
        { code: '602', label: 'Achats fournitures', description: 'Fournitures non alimentaires.', exemples: 'Emballages, Gobelets, Serviettes' },
        { code: '604', label: 'Achats boissons', description: 'Boissons achetées pour la revente.', exemples: 'Coca-Cola, Jus, Eau' },
        { code: '613', label: 'Loyer', description: 'Loyer du local et charges locatives.', exemples: 'Loyer mensuel' },
        { code: '6051', label: 'Eau & Électricité', description: 'Factures d\'eau et d\'électricité.', exemples: 'Facture SENELEC' },
        { code: '6052', label: 'Gaz', description: 'Gaz de cuisine et combustibles.', exemples: 'Bouteille de gaz' },
        { code: '616', label: 'Assurances', description: 'Primes d\'assurance professionnelle.', exemples: 'Assurance local' },
        { code: '624', label: 'Entretien & Réparations', description: 'Maintenance et réparations.', exemples: 'Réparation frigo' },
        { code: '626', label: 'Télécommunications', description: 'Téléphone, Internet.', exemples: 'Forfait Orange, WiFi' },
        { code: '641', label: 'Impôts & Taxes', description: 'Obligations fiscales.', exemples: 'Patente, Taxe municipale' },
        { code: '661', label: 'Salaires', description: 'Rémunérations des employés.', exemples: 'Salaire cuisinier' },
        { code: '681', label: 'Amortissements', description: 'Usure comptable des équipements.', exemples: 'Amortissement four' },
        { code: '65', label: 'Autres charges', description: 'Toute autre dépense.', exemples: 'Frais divers' }
    ]
};

const NATURES_INVESTISSEMENT = [
    'Équipement de cuisine', 'Mobilier & Agencement', 'Véhicule de livraison',
    'Matériel informatique', 'Aménagement du local', 'Installation frigorifique',
    'Signalétique & Enseigne', 'Autre'
];

const FinanceDashboard = ({ theme, toggleTheme }) => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('transactions');

    // Filtres
    const [filterType, setFilterType] = useState('tous');
    const [filterSearch, setFilterSearch] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Données financières
    const [transactions, setTransactions] = useState([]);
    const [bilan, setBilan] = useState({ totalRevenus: 0, totalCharges: 0, beneficeNet: 0 });

    // Données investissements
    const [investissements, setInvestissements] = useState([]);
    const [investResume, setInvestResume] = useState({ totalInvesti: 0, amortissementMensuel: 0, valeurNette: 0, nombreInvestissements: 0 });

    const [loading, setLoading] = useState(true);

    // Formulaires
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isInvestFormOpen, setIsInvestFormOpen] = useState(false);

    // Champs transaction
    const [type, setType] = useState('charge');
    const [selectedCategorie, setSelectedCategorie] = useState('');
    const [montant, setMontant] = useState('');
    const [motif, setMotif] = useState('');

    // Champs investissement
    const [invNom, setInvNom] = useState('');
    const [invNature, setInvNature] = useState('');
    const [invMontant, setInvMontant] = useState('');
    const [invDuree, setInvDuree] = useState('');
    const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);

    const categoriesForType = CATEGORIES_SYSCOHADA[type] || [];
    const selectedCatInfo = categoriesForType.find(c => c.code === selectedCategorie);

    // Calcul aperçu amortissement
    const amortPreview = invMontant && invDuree ? Math.round(parseFloat(invMontant) / parseInt(invDuree)) : 0;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [transRes, bilanRes, investRes, resumeRes] = await Promise.all([
                api.getFinances(),
                api.getFinanceBilan(),
                api.getInvestissements(),
                api.getInvestResume()
            ]);
            setTransactions(transRes.data);
            setBilan(bilanRes.data);
            setInvestissements(investRes.data);
            setInvestResume(resumeRes.data);
        } catch (error) {
            console.error("Erreur de chargement", error);
            toast.error("Impossible de charger les données.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user.role !== 'proprietaire') { navigate('/'); return; }
        fetchData();
    }, [user, navigate, fetchData]);

    useEffect(() => { setSelectedCategorie(''); }, [type]);

    // --- Handlers ---
    const handleAddTransaction = async (e) => {
        e.preventDefault();
        if (!selectedCategorie) { toast.error("Choisissez une catégorie."); return; }
        try {
            await api.addFinance({ type, montant: parseFloat(montant), motif, categorie_syscohada: `${selectedCatInfo.code} - ${selectedCatInfo.label}` });
            toast.success("Transaction enregistrée ✓");
            setIsFormOpen(false); setMontant(''); setMotif(''); setSelectedCategorie('');
            fetchData();
        } catch (err) { toast.error(err.response?.data?.error || "Erreur."); }
    };

    const handleAddInvestissement = async (e) => {
        e.preventDefault();
        try {
            const res = await api.addInvestissement({ nom: invNom, nature: invNature, montant: parseFloat(invMontant), duree_mois: parseInt(invDuree), date_achat: invDate });
            toast.success(res.data.message);
            setIsInvestFormOpen(false); setInvNom(''); setInvNature(''); setInvMontant(''); setInvDuree('');
            fetchData();
        } catch (err) { toast.error(err.response?.data?.error || "Erreur."); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer cette entrée ?")) return;
        try { await api.deleteFinance(id); toast.success("Supprimé."); fetchData(); }
        catch { toast.error("Erreur."); }
    };

    const handleDeleteInvest = async (id) => {
        if (!window.confirm("Supprimer cet investissement ?")) return;
        try { await api.deleteInvestissement(id); toast.success("Supprimé."); fetchData(); }
        catch { toast.error("Erreur."); }
    };

    // Filtrage des transactions (doit être avant le return conditionnel pour respecter l'ordre des hooks React)
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (filterType !== 'tous' && t.type !== filterType) return false;
            if (filterSearch && !t.motif.toLowerCase().includes(filterSearch.toLowerCase()) && !(t.categorie_syscohada || '').toLowerCase().includes(filterSearch.toLowerCase())) return false;
            if (filterDateFrom && new Date(t.date) < new Date(filterDateFrom)) return false;
            if (filterDateTo && new Date(t.date) > new Date(filterDateTo + 'T23:59:59')) return false;
            return true;
        });
    }, [transactions, filterType, filterSearch, filterDateFrom, filterDateTo]);

    if (loading) return <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-secondary)' }}>Chargement...</div>;

    // Résultat net ajusté = Bénéfice - Amortissements mensuels
    const resultatAjuste = bilan.beneficeNet - investResume.amortissementMensuel;

    // Export CSV
    const handleExportCSV = () => {
        const header = 'Date,Type,Catégorie SYSCOHADA,Motif,Montant (FCFA)';
        const rows = filteredTransactions.map(t => {
            const date = new Date(t.date).toLocaleDateString('fr-FR');
            return `${date},${t.type},"${t.categorie_syscohada || ''}","${t.motif}",${t.type === 'charge' ? '-' : ''}${t.montant}`;
        });
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finances_makalmy_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export CSV téléchargé ✓');
    };

    return (
        <div>
            {/* ===== HEADER ===== */}
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="secondary" onClick={() => navigate('/')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>📦 Stock</button>
                        <button style={{ padding: '6px 14px', fontSize: '0.85rem', pointerEvents: 'none' }}>💰 Finances</button>
                        {user?.role === 'proprietaire' && (
                            <button className="secondary" onClick={() => navigate('/analytics')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>📈 Analytics</button>
                        )}
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

            {/* ===== CARTES BILAN (4 cartes) ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>⬆️</div>
                    <div className="stat-content">
                        <h4>Revenus</h4>
                        <span className="stat-value" style={{ color: '#10b981', fontSize: '1.2rem' }}>{bilan.totalRevenus.toLocaleString('fr-FR')} F</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>⬇️</div>
                    <div className="stat-content">
                        <h4>Charges</h4>
                        <span className="stat-value" style={{ color: '#ef4444', fontSize: '1.2rem' }}>{bilan.totalCharges.toLocaleString('fr-FR')} F</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🏗️</div>
                    <div className="stat-content">
                        <h4>Amort. / mois</h4>
                        <span className="stat-value" style={{ color: '#6366f1', fontSize: '1.2rem' }}>{investResume.amortissementMensuel.toLocaleString('fr-FR')} F</span>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeft: `4px solid ${resultatAjuste >= 0 ? '#10b981' : '#ef4444'}` }}>
                    <div className="stat-icon" style={{ backgroundColor: 'transparent', color: 'var(--primary-color)' }}>⚖️</div>
                    <div className="stat-content">
                        <h4>Résultat Net</h4>
                        <span className="stat-value" style={{ fontSize: '1.2rem' }}>{resultatAjuste >= 0 ? '+' : ''}{resultatAjuste.toLocaleString('fr-FR')} F</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>après amortissements</span>
                    </div>
                </div>
            </div>

            {/* ===== ONGLETS ===== */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', overflowX: 'auto' }}>
                {[{ id: 'transactions', label: '💳 Revenus & Charges', color: 'var(--primary-color)' }, { id: 'graphiques', label: '📊 Graphiques', color: '#f59e0b' }, { id: 'investissements', label: `🏗️ Investissements (${investissements.length})`, color: '#6366f1' }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 18px', fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'transparent', borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent', color: activeTab === tab.id ? tab.color : 'var(--text-secondary)', fontWeight: activeTab === tab.id ? '600' : '400', whiteSpace: 'nowrap' }}>{tab.label}</button>
                ))}
            </div>

            {/* ===== TAB : GRAPHIQUES ===== */}
            {activeTab === 'graphiques' && <FinanceCharts transactions={transactions} />}

            {/* ===== TAB : TRANSACTIONS ===== */}
            {activeTab === 'transactions' && (
                <div>
                    {/* Barre d'actions + filtres */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="text" placeholder="🔍 Rechercher..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} style={{ flex: 1, minWidth: '140px', padding: '7px 12px', fontSize: '0.85rem' }} />
                        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '7px 10px', fontSize: '0.85rem', minWidth: '100px' }}>
                            <option value="tous">Tous</option>
                            <option value="revenu">Revenus</option>
                            <option value="charge">Charges</option>
                        </select>
                        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ padding: '7px 10px', fontSize: '0.85rem' }} title="Date début" />
                        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ padding: '7px 10px', fontSize: '0.85rem' }} title="Date fin" />
                        <button onClick={handleExportCSV} className="secondary" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>📥 CSV</button>
                        <button onClick={() => setIsFormOpen(true)} style={{ padding: '7px 14px', fontSize: '0.85rem' }}>+ Transaction</button>
                    </div>
                    <div style={{ background: 'var(--surface-color)', padding: '1.2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                        {filteredTransactions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">💳</div>
                                <div className="empty-state-title">Aucune transaction</div>
                                <div className="empty-state-text">Enregistrez vos revenus et charges pour suivre votre trésorerie.</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <th style={{ padding: '10px 8px' }}>Date</th>
                                            <th style={{ padding: '10px 8px' }}>Type</th>
                                            <th style={{ padding: '10px 8px' }}>Catégorie</th>
                                            <th style={{ padding: '10px 8px' }}>Motif</th>
                                            <th style={{ padding: '10px 8px' }}>Qui?</th>
                                            <th style={{ padding: '10px 8px' }}>Montant</th>
                                            <th style={{ padding: '10px 8px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                                <td style={{ padding: '10px 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                                                <td style={{ padding: '10px 8px' }}>
                                                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', background: t.type === 'revenu' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: t.type === 'revenu' ? '#10b981' : '#ef4444' }}>
                                                        {t.type === 'revenu' ? '↑' : '↓'} {t.type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.categorie_syscohada || '—'}</td>
                                                <td style={{ padding: '10px 8px', fontWeight: '500', fontSize: '0.9rem' }}>{t.motif}</td>
                                                <td style={{ padding: '10px 8px', fontSize: '0.8rem' }}>
                                                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: '500' }}>👤 {t.utilisateur || 'système'}</span>
                                                </td>
                                                <td style={{ padding: '10px 8px', fontWeight: '600', color: t.type === 'revenu' ? '#10b981' : '#ef4444', fontSize: '0.9rem' }}>
                                                    {t.type === 'revenu' ? '+' : '-'}{t.montant.toLocaleString('fr-FR')} F
                                                </td>
                                                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                                    <button className="danger" onClick={() => handleDelete(t.id)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== TAB : INVESTISSEMENTS ===== */}
            {activeTab === 'investissements' && (
                <div>
                    {/* Résumé Investissements */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Capital Investi</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#6366f1' }}>{investResume.totalInvesti.toLocaleString('fr-FR')} F</div>
                        </div>
                        <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Valeur Nette Comptable</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{investResume.valeurNette.toLocaleString('fr-FR')} F</div>
                        </div>
                        <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Charge mensuelle auto</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ef4444' }}>{investResume.amortissementMensuel.toLocaleString('fr-FR')} F/mois</div>
                        </div>
                    </div>

                    {/* Guide */}
                    <div style={{ background: 'var(--bg-color)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>📖 Comment ça marche ?</strong> Quand vous achetez un équipement (frigo, four...), son coût est réparti automatiquement en charges mensuelles sur sa durée d'utilisation. C'est l'<strong>amortissement linéaire</strong> (SYSCOHADA classe 681). Cela reflète l'usure réelle de vos actifs dans votre résultat net.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button onClick={() => setIsInvestFormOpen(true)} style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#6366f1', borderColor: '#6366f1' }}>+ Nouvel investissement</button>
                    </div>

                    {/* Liste investissements */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {investissements.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🏗️</div>
                                <div className="empty-state-title">Aucun investissement</div>
                                <div className="empty-state-text">Enregistrez vos équipements pour un suivi automatique des amortissements.</div>
                            </div>
                        ) : investissements.map(inv => (
                            <div key={inv.id} style={{ background: 'var(--surface-color)', padding: '1rem 1.2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{inv.nom}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inv.nature} · Acheté le {new Date(inv.date_achat).toLocaleDateString('fr-FR')}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '700', color: '#6366f1' }}>{inv.montant.toLocaleString('fr-FR')} F</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inv.duree_mois} mois · {inv.amortissement_mensuel.toLocaleString('fr-FR')} F/mois</div>
                                    </div>
                                </div>
                                {/* Barre de progression */}
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        <span>Amorti : {inv.pourcentage_amorti}%</span>
                                        <span>VNC : {inv.valeur_nette_comptable.toLocaleString('fr-FR')} F</span>
                                    </div>
                                    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-border)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${inv.pourcentage_amorti}%`, borderRadius: '3px', background: inv.est_totalement_amorti ? '#10b981' : '#6366f1', transition: 'width 0.5s ease' }}></div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {inv.est_totalement_amorti ? (
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: '600' }}>✓ Totalement amorti</span>
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fin prévue : {new Date(inv.date_fin).toLocaleDateString('fr-FR')}</span>
                                    )}
                                    <button className="danger" onClick={() => handleDeleteInvest(inv.id)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== MODALE : TRANSACTION ===== */}
            {isFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Nouvelle transaction</h2>
                            <button onClick={() => setIsFormOpen(false)} className="secondary" style={{ padding: '4px 10px' }}>&times;</button>
                        </div>
                        <div style={{ background: 'var(--bg-color)', padding: '0.8rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--surface-border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>📖 SYSCOHADA</strong> — Classez vos opérations par catégorie comptable pour un suivi professionnel de vos finances.
                        </div>
                        <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setType('charge')} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: type === 'charge' ? '2px solid #ef4444' : '1px solid var(--surface-border)', background: type === 'charge' ? 'rgba(239,68,68,0.1)' : 'var(--surface-color)', color: type === 'charge' ? '#ef4444' : 'var(--text-secondary)', fontWeight: type === 'charge' ? '700' : '400' }}>⬇️ Charge</button>
                                <button type="button" onClick={() => setType('revenu')} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: type === 'revenu' ? '2px solid #10b981' : '1px solid var(--surface-border)', background: type === 'revenu' ? 'rgba(16,185,129,0.1)' : 'var(--surface-color)', color: type === 'revenu' ? '#10b981' : 'var(--text-secondary)', fontWeight: type === 'revenu' ? '700' : '400' }}>⬆️ Revenu</button>
                            </div>
                            <select value={selectedCategorie} onChange={(e) => setSelectedCategorie(e.target.value)} required>
                                <option value="">— Catégorie SYSCOHADA —</option>
                                {categoriesForType.map(cat => <option key={cat.code} value={cat.code}>{cat.code} – {cat.label}</option>)}
                            </select>
                            {selectedCatInfo && (
                                <div style={{ background: type === 'charge' ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)', padding: '0.6rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', border: `1px solid ${type === 'charge' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                    <strong>{selectedCatInfo.label}</strong> — <span style={{ color: 'var(--text-secondary)' }}>{selectedCatInfo.description}</span><br />
                                    <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Ex : {selectedCatInfo.exemples}</span>
                                </div>
                            )}
                            <input type="text" placeholder={selectedCatInfo ? `Ex: ${selectedCatInfo.exemples.split(',')[0]}` : 'Motif...'} value={motif} onChange={(e) => setMotif(e.target.value)} required />
                            <input type="number" placeholder="Montant (FCFA)" min="0" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} required />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                                <button type="button" className="secondary" onClick={() => setIsFormOpen(false)}>Annuler</button>
                                <button type="submit" style={{ background: type === 'revenu' ? '#10b981' : '#ef4444', borderColor: type === 'revenu' ? '#10b981' : '#ef4444' }}>Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== MODALE : INVESTISSEMENT ===== */}
            {isInvestFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Nouvel investissement</h2>
                            <button onClick={() => setIsInvestFormOpen(false)} className="secondary" style={{ padding: '4px 10px' }}>&times;</button>
                        </div>
                        <div style={{ background: 'var(--bg-color)', padding: '0.8rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--surface-border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>🏗️ Immobilisations (Classe 2)</strong> — Un investissement est un achat durable (équipement, véhicule, aménagement). Son coût est réparti sur sa durée de vie en <strong>amortissement mensuel</strong>, impactant automatiquement vos charges.
                        </div>
                        <form onSubmit={handleAddInvestissement} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <input type="text" placeholder="Nom de l'investissement (ex: Four à pizza)" value={invNom} onChange={(e) => setInvNom(e.target.value)} required />
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nature de l'investissement</label>
                                <select value={invNature} onChange={(e) => setInvNature(e.target.value)} required>
                                    <option value="">— Choisir —</option>
                                    {NATURES_INVESTISSEMENT.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Montant (FCFA)</label>
                                    <input type="number" placeholder="Ex: 500000" min="0" value={invMontant} onChange={(e) => setInvMontant(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Durée de vie (mois)</label>
                                    <input type="number" placeholder="Ex: 60" min="1" value={invDuree} onChange={(e) => setInvDuree(e.target.value)} required />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date d'achat</label>
                                <input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} required />
                            </div>

                            {/* Aperçu amortissement */}
                            {amortPreview > 0 && (
                                <div style={{ background: 'rgba(99,102,241,0.05)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.85rem' }}>
                                    <strong style={{ color: '#6366f1' }}>Aperçu de l'amortissement :</strong><br />
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {amortPreview.toLocaleString('fr-FR')} FCFA / mois pendant {invDuree} mois<br />
                                        sera ajouté automatiquement à vos charges mensuelles.
                                    </span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                                <button type="button" className="secondary" onClick={() => setIsInvestFormOpen(false)}>Annuler</button>
                                <button type="submit" style={{ background: '#6366f1', borderColor: '#6366f1' }}>Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceDashboard;
