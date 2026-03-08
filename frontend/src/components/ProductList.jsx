import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import ProductItem from './ProductItem';
import AddProductModal from './AddProductModal';
import Logo from './Logo';
import DashboardStats from './DashboardStats';
import { toast } from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

const ProductList = ({ theme, toggleTheme }) => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState('tout');
    const [activeCategory, setActiveCategory] = useState('Toutes');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Dynamic extraction of unique categories from products
    const categories = ['Toutes', ...new Set(products.map(p => p.categorie).filter(Boolean))];

    const fetchProducts = useCallback(async () => {
        try {
            setError(null);
            const { data } = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Erreur de chargement des produits", error);
            setError("Impossible de charger les produits. Veuillez vérifier votre connexion.");
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleUpdate = () => {
        fetchProducts();
    };

    const handleProductAdded = () => {
        toast.success("Produit ajouté avec succès");
        fetchProducts();
    };

    const handleExportCSV = () => {
        if (products.length === 0) {
            toast.error("Rien à exporter");
            return;
        }

        let exportProducts = products;
        let headers = ['Nom', 'Catégorie', 'Quantité', 'Unité', 'Prix Unitaire (FCFA)', 'Seuil Min', 'Seuil Max', 'Péremption', 'Valeur Totale (FCFA)'];

        if (user.role === 'employe') {
            exportProducts = products.filter(p => p.quantite_stock <= p.seuil_minimum);
            headers = ['Nom', 'Catégorie', 'Quantité Actuelle', 'Unité', 'Seuil Minimum', 'Péremption'];
            if (exportProducts.length === 0) {
                toast.error("Aucun produit en manque, liste de courses vide !");
                return;
            }
        }

        const csvContent = [
            headers.join(';'),
            ...exportProducts.map(p => {
                const premp = p.date_peremption ? new Date(p.date_peremption).toLocaleDateString() : 'N/A';

                if (user.role === 'employe') {
                    return `"${p.nom_produit}";"${p.categorie}";${p.quantite_stock};"${p.unite}";${p.seuil_minimum};"${premp}"`;
                }

                const totalVal = (p.quantite_stock * (p.prix_unitaire || 0));
                return `"${p.nom_produit}";"${p.categorie}";${p.quantite_stock};"${p.unite}";${p.prix_unitaire || 0};${p.seuil_minimum};${p.seuil_maximum};"${premp}";${totalVal}`;
            })
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const fileName = user.role === 'employe'
            ? `Liste_Courses_${new Date().toISOString().split('T')[0]}.csv`
            : `Inventaire_StockAlert_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Export réussi");
    };

    const sortedAndFilteredProducts = products
        .filter(p => {
            const matchesSearch = p.nom_produit.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'Toutes' || p.categorie === activeCategory;

            let matchesFilter = true;
            if (filter === 'manque') matchesFilter = p.quantite_stock <= p.seuil_minimum;
            if (filter === 'surplus') matchesFilter = p.quantite_stock >= p.seuil_maximum;

            return matchesSearch && matchesCategory && matchesFilter;
        })
        .sort((a, b) => {
            // Priority 1: Expired or Near Expiry (<= 3 days)
            const getExpiryScore = (p) => {
                if (!p.date_peremption) return 0;
                const days = Math.ceil((new Date(p.date_peremption) - new Date()) / (1000 * 60 * 60 * 24));
                if (days < 0) return 3; // Expired
                if (days <= 3) return 2; // Near Expiry
                return 0;
            };

            const scoreA = getExpiryScore(a);
            const scoreB = getExpiryScore(b);
            if (scoreA !== scoreB) return scoreB - scoreA;

            // Priority 2: Out of stock / Low stock
            const isMissingA = a.quantite_stock <= a.seuil_minimum ? 1 : 0;
            const isMissingB = b.quantite_stock <= b.seuil_minimum ? 1 : 0;
            if (isMissingA !== isMissingB) return isMissingB - isMissingA;

            // Priority 3: Alphabetical
            return a.nom_produit.localeCompare(b.nom_produit);
        });

    return (
        <div>
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{ padding: '6px 14px', fontSize: '0.85rem', pointerEvents: 'none' }}>📦 Stock</button>
                        {user.role === 'proprietaire' && (
                            <>
                                <button className="secondary" onClick={() => navigate('/inventaire')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>⚡ Inventaire Rapide</button>
                                <button className="secondary" onClick={() => navigate('/finances')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>💰 Finances</button>
                            </>
                        )}
                        {user.role === 'employe' && <button className="secondary" onClick={() => navigate('/saisie')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>💳 Saisie Achats</button>}
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


            <DashboardStats products={products} />

            <div className="controls-container">
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Rechercher un produit..."
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
                <div className="filters">
                    <button className={`filter-pill ${filter === 'tout' ? 'active' : ''}`} onClick={() => setFilter('tout')}>Voir Tout</button>
                    <button className={`filter-pill ${filter === 'manque' ? 'active' : ''}`} onClick={() => setFilter('manque')}>⚠️ En Manque</button>
                    <button className={`filter-pill ${filter === 'surplus' ? 'active' : ''}`} onClick={() => setFilter('surplus')}>📦 En Surplus</button>
                    <button onClick={handleExportCSV} className="secondary" style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '20px' }}>
                        {user.role === 'employe' ? '📋 Liste de Courses' : '📥 Exporter CSV'}
                    </button>
                </div>
            </div>

            {user.role === 'proprietaire' && (
                <button
                    className="fab-button"
                    onClick={() => setIsAddModalOpen(true)}
                    title="Ajouter un produit"
                >
                    +
                </button>
            )}

            {error && <div style={{ color: 'var(--danger-color)', padding: '1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>{error}</div>}

            <div className="product-list" style={{ marginTop: '2rem' }}>
                {sortedAndFilteredProducts.length === 0 && !error ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <div className="empty-state-title">Aucun produit trouvé</div>
                        <div className="empty-state-text">
                            {searchQuery || activeCategory !== 'Toutes' || filter !== 'tout'
                                ? 'Essayez de modifier vos filtres de recherche.'
                                : 'Commencez par ajouter votre premier produit en cliquant sur "+ Produit".'}
                        </div>
                    </div>
                ) : (
                    sortedAndFilteredProducts.map(product => (
                        <ProductItem key={product.id} product={product} onUpdate={handleUpdate} />
                    ))
                )}
            </div>

            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleProductAdded}
            />
        </div>
    );
};

export default ProductList;