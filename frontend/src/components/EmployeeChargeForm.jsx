import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Logo from './Logo';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Catégories de charges simplifiées pour les employés
const CATEGORIES_CHARGES = [
    { code: '601', label: 'Achats matières premières', exemples: 'Viande, Pain, Légumes, Huile' },
    { code: '602', label: 'Achats fournitures', exemples: 'Emballages, Gobelets, Serviettes' },
    { code: '604', label: 'Achats boissons', exemples: 'Coca-Cola, Jus, Eau' },
    { code: '6051', label: 'Eau & Électricité', exemples: 'Facture SENELEC' },
    { code: '6052', label: 'Gaz', exemples: 'Bouteille de gaz' },
    { code: '624', label: 'Entretien & Réparations', exemples: 'Réparation frigo' },
    { code: '65', label: 'Autres charges', exemples: 'Frais divers' }
];

const EmployeeChargeForm = ({ theme, toggleTheme }) => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();
    const [selectedCategorie, setSelectedCategorie] = useState('');
    const [montant, setMontant] = useState('');
    const [motif, setMotif] = useState('');
    const [recentCharges, setRecentCharges] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const selectedCatInfo = CATEGORIES_CHARGES.find(c => c.code === selectedCategorie);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCategorie) { toast.error("Choisissez une catégorie."); return; }
        setSubmitting(true);
        try {
            await api.addFinance({
                type: 'charge',
                montant: parseFloat(montant),
                motif,
                categorie_syscohada: `${selectedCatInfo.code} - ${selectedCatInfo.label}`
            });
            toast.success("Charge enregistrée ✓");
            // Ajouter aux charges récentes localement
            setRecentCharges(prev => [{ motif, montant: parseFloat(montant), categorie: selectedCatInfo.label, date: new Date() }, ...prev.slice(0, 9)]);
            setMontant(''); setMotif(''); setSelectedCategorie('');
        } catch (err) {
            toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* Header employé simplifié */}
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="secondary" onClick={() => navigate('/')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>📦 Stock</button>
                        <button style={{ padding: '6px 14px', fontSize: '0.85rem', pointerEvents: 'none' }}>💳 Saisie Achats</button>
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>👤 {user.username}</span>
                    <button onClick={toggleTheme} className="secondary" style={{ fontSize: '1rem', padding: '6px 10px', borderRadius: '50%' }}>{theme === 'light' ? '🌙' : '☀️'}</button>
                    <button onClick={logOut} className="secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Quitter</button>
                </div>
            </header>

            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>📝 Enregistrer un achat / une charge</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Utilisez ce formulaire pour enregistrer vos dépenses. Elles seront automatiquement liées à votre compte <strong>{user.username}</strong>.
                </p>

                {/* Formulaire */}
                <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Catégorie de la dépense</label>
                            <select value={selectedCategorie} onChange={(e) => setSelectedCategorie(e.target.value)} required>
                                <option value="">— Choisir une catégorie —</option>
                                {CATEGORIES_CHARGES.map(cat => <option key={cat.code} value={cat.code}>{cat.label}</option>)}
                            </select>
                        </div>

                        {selectedCatInfo && (
                            <div style={{ background: 'rgba(239,68,68,0.05)', padding: '0.6rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', border: '1px solid rgba(239,68,68,0.1)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Exemples : </span><em>{selectedCatInfo.exemples}</em>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</label>
                            <input type="text" placeholder={selectedCatInfo ? `Ex: ${selectedCatInfo.exemples.split(',')[0].trim()}` : 'Décrivez la dépense...'} value={motif} onChange={(e) => setMotif(e.target.value)} required />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Montant (FCFA)</label>
                            <input type="number" placeholder="Ex: 15000" min="1" value={montant} onChange={(e) => setMontant(e.target.value)} required />
                        </div>

                        <button type="submit" disabled={submitting} style={{ marginTop: '0.5rem', background: '#ef4444', borderColor: '#ef4444', opacity: submitting ? 0.6 : 1 }}>
                            {submitting ? 'Enregistrement...' : '⬇️ Enregistrer la charge'}
                        </button>
                    </form>
                </div>

                {/* Historique des saisies récentes de la session */}
                {recentCharges.length > 0 && (
                    <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
                        <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📋 Mes saisies récentes (cette session)</h4>
                        {recentCharges.map((c, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < recentCharges.length - 1 ? '1px solid var(--surface-border)' : 'none', fontSize: '0.85rem' }}>
                                <div>
                                    <div style={{ fontWeight: '500' }}>{c.motif}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.categorie} · {c.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div style={{ fontWeight: '600', color: '#ef4444' }}>-{c.montant.toLocaleString('fr-FR')} F</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeChargeForm;
