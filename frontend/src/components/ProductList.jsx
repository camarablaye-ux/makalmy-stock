import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import ProductItem from './ProductItem';
import AddProductModal from './AddProductModal';
import Logo from './Logo';
import DashboardStats from './DashboardStats';
import { toast } from 'react-hot-toast';

const ProductList = () => {
    const { user, logOut } = useAuth();
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
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: 'var(--surface-color)', borderBottom: '4px solid var(--surface-border)' }}>
                <Logo />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '0', border: '2px solid var(--primary-color)', background: 'var(--primary-color)', color: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.username}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.role}</span>
                        </div>
                    </div>
                    {user.role === 'proprietaire' && (
                        <button onClick={() => setIsAddModalOpen(true)}>+ Nouveau Produit</button>
                    )}
                    <button onClick={logOut} className="secondary">Déconnexion</button>
                </div>
            </header>

            <DashboardStats products={products} />

            <div className="controls-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface-color)', padding: '1rem', border: '2px solid var(--surface-border)' }}>
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Rechercher un produit par nom..."
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
                <div className="filters" style={{ margin: 0, display: 'flex', gap: '10px' }}>
                    <button onClick={() => setFilter('tout')} className={filter === 'tout' ? '' : 'secondary'}>Voir Tout</button>
                    <button onClick={() => setFilter('manque')} className={filter === 'manque' ? 'danger' : 'secondary'}>En Manque</button>
                    <button onClick={() => setFilter('surplus')} className={filter === 'surplus' ? 'warning' : 'secondary'}>En Surplus</button>
                    <button onClick={handleExportCSV} className="secondary" style={{ marginLeft: 'auto' }}>
                        {user.role === 'employe' ? '📋 Liste de Courses' : '📥 Exporter CSV'}
                    </button>
                </div>
            </div>

            {error && <div style={{ color: 'var(--danger-color)', padding: '1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>{error}</div>}

            <div className="product-list" style={{ marginTop: '2rem' }}>
                {sortedAndFilteredProducts.length === 0 && !error ? (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>Aucun produit trouvé.</p>
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