import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Logo from './Logo';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCategoryIcon } from '../utils/categoryIcons';

const MenuManagement = ({ theme, toggleTheme }) => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();

    const [menus, setMenus] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [isCreating, setIsCreating] = useState(false);
    const [nomMenu, setNomMenu] = useState('');
    const [prixMenu, setPrixMenu] = useState('');
    const [selectedIngredients, setSelectedIngredients] = useState([]); // [{product_id, quantite, nom, unite}]

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [menusRes, productsRes] = await Promise.all([
                api.getMenus(),
                api.getProducts()
            ]);
            setMenus(menusRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error("Erreur chargement menus:", error);
            toast.error("Impossible de charger les menus");
        } finally {
            setLoading(false);
        }
    };

    const handleAddIngredient = (productId) => {
        if (!productId) return;
        const product = products.find(p => p.id === parseInt(productId));
        if (!product) return;

        // Check if already added
        if (selectedIngredients.some(ing => ing.product_id === product.id)) {
            toast.error("Cet ingrédient est déjà dans la recette");
            return;
        }

        setSelectedIngredients(prev => [...prev, {
            product_id: product.id,
            nom: product.nom_produit,
            unite: product.unite,
            quantite: 1
        }]);
    };

    const handleRemoveIngredient = (productId) => {
        setSelectedIngredients(prev => prev.filter(ing => ing.product_id !== productId));
    };

    const handleIngredientQtyChange = (productId, qty) => {
        setSelectedIngredients(prev => prev.map(ing =>
            ing.product_id === productId ? { ...ing, quantite: parseFloat(qty) || 0 } : ing
        ));
    };

    const handleCreateMenu = async (e) => {
        e.preventDefault();

        if (!nomMenu.trim()) return toast.error("Le nom du menu est requis");
        if (selectedIngredients.length === 0) return toast.error("Ajoutez au moins un ingrédient");

        // Ensure no zero quantities
        if (selectedIngredients.some(ing => ing.quantite <= 0)) {
            return toast.error("Toutes les quantités doivent être supérieures à 0");
        }

        try {
            const payload = {
                nom: nomMenu,
                prix: parseFloat(prixMenu) || 0,
                ingredients: selectedIngredients.map(ing => ({
                    product_id: ing.product_id,
                    quantite_necessaire: ing.quantite
                }))
            };

            await api.createMenu(payload);
            toast.success("Menu créé avec succès !");
            setIsCreating(false);
            setNomMenu('');
            setPrixMenu('');
            setSelectedIngredients([]);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Erreur lors de la création");
        }
    };

    const handleDeleteMenu = async (id, nom) => {
        if (!window.confirm(`Supprimer définitivement le menu "${nom}" ?`)) return;
        try {
            await api.deleteMenu(id);
            toast.success("Menu supprimé");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    if (user?.role !== 'proprietaire') return <div style={{ padding: '2rem' }}>Accès Refusé</div>;

    return (
        <div>
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="secondary" onClick={() => navigate('/')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>📦 Stock</button>
                        <button className="secondary" onClick={() => navigate('/inventaire')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>⚡ Rapide</button>
                        <button style={{ padding: '6px 14px', fontSize: '0.85rem', pointerEvents: 'none', background: 'var(--primary-color)', color: 'var(--bg-color)' }}>🍔 Menus (Admin)</button>
                        <button className="secondary" onClick={() => navigate('/finances')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>💰 Finances</button>
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
                <div>
                    <h2 style={{ margin: 0 }}>Gestion des Menus & Recettes</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Créez des menus pour déduire plusieurs ingrédients en un seul clic lors de la vente.
                    </p>
                </div>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)}>+ Créer un Menu</button>
                )}
            </div>

            {isCreating && (
                <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>Nouvelle Recette</h3>
                    <form onSubmit={handleCreateMenu}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 2, minWidth: '200px' }}>
                                <label>Nom du Menu *</label>
                                <input type="text" value={nomMenu} onChange={e => setNomMenu(e.target.value)} placeholder="Ex: Menu Burger" required />
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label>Prix de vente (Optionnel)</label>
                                <input type="number" step="0.01" value={prixMenu} onChange={e => setPrixMenu(e.target.value)} placeholder="0.00" />
                            </div>
                        </div>

                        <h4>Ingrédients de la recette</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <select onChange={(e) => { handleAddIngredient(e.target.value); e.target.value = ""; }} style={{ flex: 1 }}>
                                <option value="">+ Ajouter un ingrédient du stock...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{getCategoryIcon(p.categorie)} {p.nom_produit} (Stock: {p.quantite_stock})</option>
                                ))}
                            </select>
                        </div>

                        {selectedIngredients.length > 0 && (
                            <div style={{ background: 'var(--bg-color)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem' }}>
                                {selectedIngredients.map(ing => (
                                    <div key={ing.product_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--surface-border)' }}>
                                        <span>{ing.nom}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={ing.quantite}
                                                onChange={e => handleIngredientQtyChange(ing.product_id, e.target.value)}
                                                style={{ width: '80px', marginBottom: 0, padding: '4px' }}
                                                required
                                            />
                                            <span style={{ width: '50px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ing.unite}</span>
                                            <button type="button" className="danger" style={{ padding: '4px 8px' }} onClick={() => handleRemoveIngredient(ing.product_id)}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="secondary" onClick={() => setIsCreating(false)}>Annuler</button>
                            <button type="submit">Sauvegarder le Menu</button>
                        </div>
                    </form>
                </div>
            )}

            {!loading && menus.length === 0 && !isCreating && (
                <div className="empty-state">
                    <div className="empty-state-icon">🍔</div>
                    <div className="empty-state-title">Aucun menu configuré</div>
                    <div className="empty-state-text">Créez votre premier menu pour faciliter la caisse.</div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {menus.map(menu => (
                    <div key={menu.id} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0' }}>{menu.nom}</h3>
                                {menu.prix > 0 && <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{menu.prix.toLocaleString('fr-FR')} FCFA</span>}
                            </div>
                            <button className="danger" onClick={() => handleDeleteMenu(menu.id, menu.nom)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Supprimer</button>
                        </div>

                        <div style={{ fontSize: '0.9rem' }}>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Recette :</strong>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)' }}>
                                {menu.ingredients?.map(ing => (
                                    <li key={ing.product_id} style={{ padding: '2px 0' }}>
                                        {ing.quantite_necessaire} {ing.unite} de {ing.nom_produit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ height: '80px' }}></div>
        </div>
    );
};

export default MenuManagement;
