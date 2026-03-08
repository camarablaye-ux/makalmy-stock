import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Logo from './Logo';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CATEGORIES_FOURNISSEUR = ['Viandes & Poissons', 'Boulangerie', 'Boissons', 'Légumes & Fruits', 'Congelés', 'Emballages', 'Équipements', 'Services', 'Autre'];

const Settings = ({ theme, toggleTheme }) => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('fournisseurs');

    // Mot de passe
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Fournisseurs
    const [fournisseurs, setFournisseurs] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [fNom, setFNom] = useState('');
    const [fTelephone, setFTelephone] = useState('');
    const [fCategorie, setFCategorie] = useState('');
    const [fNotes, setFNotes] = useState('');

    // Employés
    const [employes, setEmployes] = useState([]);
    const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
    const [empUsername, setEmpUsername] = useState('');
    const [empPassword, setEmpPassword] = useState('');

    const fetchFournisseurs = useCallback(async () => {
        try {
            const res = await api.getFournisseurs();
            setFournisseurs(res.data);
        } catch { /* ignore if not authorized */ }
    }, []);

    const fetchEmployes = useCallback(async () => {
        if (user.role !== 'proprietaire') return;
        try {
            const res = await api.getEmployes();
            setEmployes(res.data);
        } catch { /* ignore */ }
    }, [user.role]);

    useEffect(() => { fetchFournisseurs(); fetchEmployes(); }, [fetchFournisseurs, fetchEmployes]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas."); return; }
        try {
            const res = await api.changePassword({ oldPassword, newPassword });
            toast.success(res.data.message);
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
            toast.error(err.response?.data?.error || "Erreur.");
        }
    };

    const handleAddFournisseur = async (e) => {
        e.preventDefault();
        try {
            await api.addFournisseur({ nom: fNom, telephone: fTelephone, categorie: fCategorie, notes: fNotes });
            toast.success("Fournisseur ajouté ✓");
            setIsAddOpen(false); setFNom(''); setFTelephone(''); setFCategorie(''); setFNotes('');
            fetchFournisseurs();
        } catch (err) { toast.error(err.response?.data?.error || "Erreur."); }
    };

    const handleDeleteFournisseur = async (id) => {
        if (!window.confirm("Supprimer ce fournisseur ?")) return;
        try { await api.deleteFournisseur(id); toast.success("Supprimé."); fetchFournisseurs(); }
        catch { toast.error("Erreur."); }
    };

    const handleCreateEmploye = async (e) => {
        e.preventDefault();
        try {
            const res = await api.createEmploye({ username: empUsername, password: empPassword });
            toast.success(res.data.message);
            setIsAddEmpOpen(false); setEmpUsername(''); setEmpPassword('');
            fetchEmployes();
        } catch (err) { toast.error(err.response?.data?.error || "Erreur."); }
    };

    const handleDeleteEmploye = async (id) => {
        if (!window.confirm("Supprimer cet employé ?")) return;
        try { await api.deleteEmploye(id); toast.success("Employé supprimé."); fetchEmployes(); }
        catch { toast.error("Erreur."); }
    };

    return (
        <div>
            {/* Header */}
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="secondary" onClick={() => navigate('/')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>📦 Stock</button>
                        {user.role === 'proprietaire' && <button className="secondary" onClick={() => navigate('/finances')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>💰 Finances</button>}
                        <button style={{ padding: '6px 14px', fontSize: '0.85rem', pointerEvents: 'none' }}>⚙️ Réglages</button>
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <button onClick={toggleTheme} className="secondary" style={{ fontSize: '1rem', padding: '6px 10px', borderRadius: '50%' }}>{theme === 'light' ? '🌙' : '☀️'}</button>
                    <button onClick={logOut} className="secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Quitter</button>
                </div>
            </header>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                {[
                    ...(user.role === 'proprietaire' ? [{ id: 'employes', label: '👥 Employés', color: '#f59e0b' }] : []),
                    { id: 'fournisseurs', label: '🤝 Fournisseurs', color: '#6366f1' },
                    { id: 'securite', label: '🔒 Sécurité', color: '#ef4444' },
                    ...(user.role === 'proprietaire' ? [{ id: 'rapport', label: '📋 Rapport mensuel', color: '#10b981' }] : [])
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{
                        padding: '10px 18px', fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'transparent',
                        borderBottom: activeSection === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
                        color: activeSection === tab.id ? tab.color : 'var(--text-secondary)',
                        fontWeight: activeSection === tab.id ? '600' : '400'
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* ===== EMPLOYÉS (propriétaire uniquement) ===== */}
            {activeSection === 'employes' && user.role === 'proprietaire' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Comptes employés</h3>
                        <button onClick={() => setIsAddEmpOpen(true)} style={{ padding: '7px 14px', fontSize: '0.85rem' }}>+ Nouvel employé</button>
                    </div>
                    <div style={{ background: 'var(--bg-color)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>💡 Info</strong> — Chaque employé a son propre identifiant. Quand il enregistre une charge, son nom est automatiquement inscrit sur la transaction. Vous pouvez vérifier qui a fait quoi dans l’onglet <strong>💳 Revenus & Charges</strong> (colonne "Qui?").
                    </div>
                    {employes.length === 0 ? (
                        <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun employé créé.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                            {employes.map(emp => (
                                <div key={emp.id} style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>👤 {emp.username}</div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Employé</span>
                                    </div>
                                    <button className="danger" onClick={() => handleDeleteEmploye(emp.id)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    {isAddEmpOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content" style={{ maxWidth: '380px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Créer un employé</h2>
                                    <button onClick={() => setIsAddEmpOpen(false)} className="secondary" style={{ padding: '4px 10px' }}>&times;</button>
                                </div>
                                <form onSubmit={handleCreateEmploye} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <input type="text" placeholder="Nom d'utilisateur (ex: mamadou)" value={empUsername} onChange={e => setEmpUsername(e.target.value)} required />
                                    <input type="password" placeholder="Mot de passe (min 6 caractères)" value={empPassword} onChange={e => setEmpPassword(e.target.value)} required minLength="6" />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                                        <button type="button" className="secondary" onClick={() => setIsAddEmpOpen(false)}>Annuler</button>
                                        <button type="submit">Créer le compte</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== FOURNISSEURS ===== */}
            {activeSection === 'fournisseurs' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Carnet de fournisseurs</h3>
                        {user.role === 'proprietaire' && <button onClick={() => setIsAddOpen(true)} style={{ padding: '7px 14px', fontSize: '0.85rem' }}>+ Fournisseur</button>}
                    </div>

                    {fournisseurs.length === 0 ? (
                        <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun fournisseur enregistré.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {fournisseurs.map(f => (
                                <div key={f.id} style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{f.nom}</div>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{f.categorie}</span>
                                        </div>
                                        {user.role === 'proprietaire' && <button className="danger" onClick={() => handleDeleteFournisseur(f.id)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>✕</button>}
                                    </div>
                                    {f.telephone && <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📞 {f.telephone}</div>}
                                    {f.notes && <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{f.notes}</div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Modale ajout fournisseur */}
                    {isAddOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content" style={{ maxWidth: '420px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Nouveau fournisseur</h2>
                                    <button onClick={() => setIsAddOpen(false)} className="secondary" style={{ padding: '4px 10px' }}>&times;</button>
                                </div>
                                <form onSubmit={handleAddFournisseur} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <input type="text" placeholder="Nom du fournisseur" value={fNom} onChange={e => setFNom(e.target.value)} required />
                                    <input type="tel" placeholder="Téléphone (ex: 77 123 45 67)" value={fTelephone} onChange={e => setFTelephone(e.target.value)} />
                                    <select value={fCategorie} onChange={e => setFCategorie(e.target.value)} required>
                                        <option value="">— Catégorie —</option>
                                        {CATEGORIES_FOURNISSEUR.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <textarea placeholder="Notes (optionnel)" value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                                        <button type="button" className="secondary" onClick={() => setIsAddOpen(false)}>Annuler</button>
                                        <button type="submit">Enregistrer</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== SÉCURITÉ ===== */}
            {activeSection === 'securite' && (
                <div style={{ maxWidth: '400px' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>🔒 Changer le mot de passe</h3>
                    <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mot de passe actuel</label>
                                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required placeholder="••••••" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nouveau mot de passe</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Minimum 6 caractères" minLength="6" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confirmer le nouveau</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirmez..." />
                            </div>
                            {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>⚠️ Les mots de passe ne correspondent pas.</div>
                            )}
                            <button type="submit" style={{ marginTop: '0.5rem' }}>Modifier le mot de passe</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== RAPPORT MENSUEL ===== */}
            {activeSection === 'rapport' && (
                <div>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>📋 Rapport mensuel automatique</h3>
                    <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                        <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Consultez un résumé automatique de vos finances du mois en cours. Pour un rapport détaillé, utilisez l'export CSV depuis l'onglet <strong>💰 Finances</strong>.
                        </p>
                        <RapportMensuel />
                    </div>
                </div>
            )}
        </div>
    );
};

// Sous-composant : Rapport mensuel
const RapportMensuel = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const [transRes, bilanRes, investRes] = await Promise.all([
                    api.getFinances(),
                    api.getFinanceBilan(),
                    api.getInvestResume()
                ]);

                const now = new Date();
                const moisCourant = now.getMonth();
                const anneeCourante = now.getFullYear();

                const transactionsMois = transRes.data.filter(t => {
                    const d = new Date(t.date);
                    return d.getMonth() === moisCourant && d.getFullYear() === anneeCourante;
                });

                const revenusMois = transactionsMois.filter(t => t.type === 'revenu').reduce((sum, t) => sum + t.montant, 0);
                const chargesMois = transactionsMois.filter(t => t.type === 'charge').reduce((sum, t) => sum + t.montant, 0);

                // Charges par catégorie
                const chargesParCat = {};
                transactionsMois.filter(t => t.type === 'charge').forEach(t => {
                    const cat = t.categorie_syscohada || 'Non catégorisé';
                    chargesParCat[cat] = (chargesParCat[cat] || 0) + t.montant;
                });

                setData({
                    mois: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                    nbTransactions: transactionsMois.length,
                    revenusMois,
                    chargesMois,
                    amortMensuel: investRes.data.amortissementMensuel,
                    resultat: revenusMois - chargesMois - investRes.data.amortissementMensuel,
                    chargesParCat,
                    bilanGlobal: bilanRes.data
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>;
    if (!data) return <p style={{ color: 'var(--text-secondary)' }}>Erreur de chargement.</p>;

    return (
        <div>
            <h4 style={{ margin: '0 0 1rem', textTransform: 'capitalize' }}>📅 {data.mois}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Revenus du mois</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981' }}>{data.revenusMois.toLocaleString('fr-FR')} F</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Charges du mois</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ef4444' }}>{data.chargesMois.toLocaleString('fr-FR')} F</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Amortissements</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#6366f1' }}>{data.amortMensuel.toLocaleString('fr-FR')} F</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.8rem', borderRadius: 'var(--radius-md)', background: data.resultat >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${data.resultat >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Résultat net</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{data.resultat >= 0 ? '+' : ''}{data.resultat.toLocaleString('fr-FR')} F</div>
                </div>
            </div>

            {/* Détail des charges par catégorie */}
            {Object.keys(data.chargesParCat).length > 0 && (
                <div>
                    <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Détail des charges</h4>
                    {Object.entries(data.chargesParCat).sort((a, b) => b[1] - a[1]).map(([cat, montant]) => (
                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--surface-border)', fontSize: '0.85rem' }}>
                            <span>{cat}</span>
                            <span style={{ fontWeight: '600', color: '#ef4444' }}>{montant.toLocaleString('fr-FR')} F</span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                📊 {data.nbTransactions} opération(s) enregistrée(s) ce mois.
            </div>
        </div>
    );
};

export default Settings;
