import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Logo from './Logo';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const BulkEditProducts = ({ theme, toggleTheme }) => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [editedQuantities, setEditedQuantities] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Toutes');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const categories = ['Toutes', ...new Set(products.map(p => p.categorie).filter(Boolean))];

    const fetchProducts = useCallback(async () => {
        try {
            setError(null);
            const { data } = await api.getProducts();
            setProducts(data);

            // Initialize edit state with current stock values
            const initialEdits = {};
            data.forEach(p => {
                initialEdits[p.id] = p.quantite_stock;
            });
            setEditedQuantities(initialEdits);

        } catch (error) {
            console.error("Erreur de chargement des produits", error);
            setError("Impossible de charger les produits. Veuillez vérifier votre connexion.");
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleQuantityChange = (id, newQuantity) => {
        const parsed = parseInt(newQuantity, 10);
        if (isNaN(parsed) || parsed < 0) return;
        setEditedQuantities(prev => ({
            ...prev,
            [id]: parsed
        }));
    };

    const handleStepQuantity = (id, amount) => {
        setEditedQuantities(prev => {
            const current = prev[id] || 0;
            const next = current + amount;
            return {
                ...prev,
                [id]: next < 0 ? 0 : next
            };
        });
    };

    const handleSaveAll = async () => {
        const changesToSave = products.filter(p => editedQuantities[p.id] !== p.quantite_stock);

        if (changesToSave.length === 0) {
            toast.info("Aucune modification à sauvegarder.");
            return;
        }

        setIsSaving(true);
        try {
            // Update all changed products sequentially (or Promise.all for parallel)
            for (const product of changesToSave) {
                const newQty = editedQuantities[product.id];
                await api.updateQuantity(product.id, newQty, product.quantite_stock);
            }
            toast.success(`${changesToSave.length} produit(s) mis à jour !`);
            fetchProducts(); // Refresh list to get new baseline
        } catch (error) {
            console.error("Erreur lors de la sauvegarde globale", error);
            toast.error("Une erreur est survenue lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nom_produit.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'Toutes' || p.categorie === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            {/* Header matches ProductList */}
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="secondary" onClick={() => navigate('/')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>📦 Stock</button>
                        <button style={{ padding: '6px 14px', fontSize: '0.85rem', pointerEvents: 'none', background: 'var(--primary-color)', color: 'var(--bg-color)' }}>⚡ Inventaire Rapide</button>
                        {user.role === 'proprietaire' && <button className="secondary" onClick={() => navigate('/finances')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>💰 Finances</button>}
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

            {/* Title and Save Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Saisie Rapide (Inventaire Tournant)</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ajustez les quantités et validez tout en une seule fois.</p>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    style={{ padding: '12px 24px', fontSize: '1.05rem', background: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                >
                    {isSaving ? '⏳ Sauvegarde...' : '💾 Tout Sauvegarder'}
                </button>
            </div>

            {/* Controls (Sticky Search) */}
            <div className="controls-container">
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 2, marginBottom: 0 }}
                    />
                    <select
                        value={activeCategory}
                        onChange={(e) => setActiveCategory(e.target.value)}
                        style={{ flex: 1, marginBottom: 0 }}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div style={{ color: 'var(--danger-color)', padding: '1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>{error}</div>}

            {/* Bulk Edit List */}
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                {filteredProducts.map(product => {
                    const hasChanged = editedQuantities[product.id] !== product.quantite_stock;

                    return (
                        <div key={product.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: hasChanged ? 'var(--warning-bg)' : 'var(--surface-color)',
                            padding: '1rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${hasChanged ? 'var(--text-secondary)' : 'var(--surface-border)'}`,
                            transition: 'var(--transition)',
                            boxShadow: 'var(--shadow-sm)',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{product.nom_produit}</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {product.categorie} • {product.unite}
                                </span>
                            </div>

                            <div className="quantity-controls" style={{ background: hasChanged ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)', margin: 0, padding: '4px 8px' }}>
                                <button onClick={() => handleStepQuantity(product.id, -1)} disabled={editedQuantities[product.id] <= 0}>-</button>
                                <input
                                    type="number"
                                    min="0"
                                    value={editedQuantities[product.id] !== undefined ? editedQuantities[product.id] : ''}
                                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                    style={{
                                        width: '60px',
                                        textAlign: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: '700',
                                        background: 'var(--surface-color)',
                                        border: '1px solid var(--surface-border)',
                                        color: hasChanged ? 'var(--primary-color)' : 'var(--text-primary)',
                                        borderRadius: '4px',
                                        padding: '4px',
                                        marginBottom: '0'
                                    }}
                                />
                                <button onClick={() => handleStepQuantity(product.id, 1)}>+</button>
                            </div>
                        </div>
                    );
                })}

                {filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <div className="empty-state-title">Aucun produit trouvé</div>
                        <div className="empty-state-text">Modifiez votre recherche.</div>
                    </div>
                )}
            </div>

            {/* Bottom whitespace so floating elements don't hide the last item */}
            <div style={{ height: '80px' }}></div>
        </div>
    );
};

export default BulkEditProducts;
