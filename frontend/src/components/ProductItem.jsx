import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import HistoryModal from './HistoryModal';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG = {
    'peremption-proche': { icon: '🟠', label: 'Péremption Proche', badge: 'badge-peremption-proche' },
    'perime': { icon: '⚫', label: 'Périmé', badge: 'badge-perime' },
    'manque': { icon: '🔴', label: 'En Manque', badge: 'badge-manque' },
    'surplus': { icon: '🟣', label: 'En Surplus', badge: 'badge-surplus' },
    'normal': { icon: '🟢', label: 'Normal', badge: 'badge-normal' }
};

const ProductItem = ({ product, onUpdate }) => {
    const { user } = useAuth();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isEditingQuantity, setIsEditingQuantity] = useState(false);
    const [editValue, setEditValue] = useState(product.quantite_stock);
    const [qtyFlash, setQtyFlash] = useState(false);
    const flashTimeout = useRef(null);

    const getStatus = () => {
        if (product.date_peremption) {
            const daysUntilExpiry = Math.ceil((new Date(product.date_peremption) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) return 'peremption-proche';
            if (daysUntilExpiry < 0) return 'perime';
        }
        if (product.quantite_stock <= product.seuil_minimum) return 'manque';
        if (product.quantite_stock >= product.seuil_maximum) return 'surplus';
        return 'normal';
    };
    const status = getStatus();
    const statusInfo = STATUS_CONFIG[status];

    const triggerFlash = () => {
        setQtyFlash(true);
        if (flashTimeout.current) clearTimeout(flashTimeout.current);
        flashTimeout.current = setTimeout(() => setQtyFlash(false), 350);
    };

    const handleQuantityChange = async (amount) => {
        const newQuantity = product.quantite_stock + amount;
        if (newQuantity < 0) return;
        try {
            await api.updateQuantity(product.id, newQuantity, product.quantite_stock);
            triggerFlash();
            onUpdate();
            toast.success("Quantité mise à jour");
        } catch (error) {
            console.error("Erreur de mise à jour", error);
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Voulez-vous vraiment supprimer "${product.nom_produit}" ?`)) {
            try {
                await api.deleteProduct(product.id);
                onUpdate();
                toast.success("Produit supprimé");
            } catch (error) {
                console.error("Erreur de suppression", error);
                toast.error("Erreur lors de la suppression");
            }
        }
    };

    return (
        <div className={`product-item status-${status}`}>
            <div className="product-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{product.nom_produit}</h3>
                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', border: '1px solid var(--text-secondary)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {product.categorie}
                    </span>
                </div>
                <p>Seuils : {product.seuil_minimum} / {product.seuil_maximum}</p>
                {user?.role === 'proprietaire' && product.prix_unitaire > 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Prix : {product.prix_unitaire.toLocaleString('fr-FR')} FCFA
                    </p>
                )}
                {product.date_peremption && (
                    <p style={{ fontSize: '0.85rem', marginTop: '4px', color: status === 'perime' || status === 'peremption-proche' ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                        DLC : {new Date(product.date_peremption).toLocaleDateString()}
                    </p>
                )}
            </div>
            <div className="quantity-controls">
                <button onClick={() => handleQuantityChange(-1)} disabled={product.quantite_stock <= 0}>-</button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <input
                        type="number"
                        min="0"
                        value={isEditingQuantity ? editValue : product.quantite_stock}
                        onFocus={() => {
                            setIsEditingQuantity(true);
                            setEditValue(product.quantite_stock);
                        }}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={async () => {
                            setIsEditingQuantity(false);
                            const parsed = parseInt(editValue, 10);
                            if (!isNaN(parsed) && parsed !== product.quantite_stock && parsed >= 0) {
                                try {
                                    await api.updateQuantity(product.id, parsed, product.quantite_stock);
                                    triggerFlash();
                                    onUpdate();
                                    toast.success("Quantité mise à jour");
                                } catch (error) {
                                    toast.error("Erreur lors de la mise à jour");
                                }
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.target.blur();
                            }
                        }}
                        className={qtyFlash ? 'qty-flash' : ''}
                        style={{
                            width: '60px',
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            background: 'transparent',
                            border: '1px solid var(--surface-border)',
                            color: 'var(--text-primary)',
                            borderRadius: '4px',
                            padding: '2px',
                            marginBottom: '0'
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{product.unite}</span>
                </div>
                <button onClick={() => handleQuantityChange(1)}>+</button>
            </div>
            <div>
                <span className={`status-badge ${statusInfo.badge}`}>
                    {statusInfo.icon} {statusInfo.label}
                </span>
            </div>
            <div className="actions" style={{ display: 'flex', gap: '8px' }}>
                <button className="secondary" onClick={() => setIsHistoryOpen(true)}>Historique</button>
                {user.role === 'proprietaire' && (
                    <button className="danger" onClick={handleDelete}>Supprimer</button>
                )}
            </div>

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                product={product}
            />
        </div>
    );
};

export default ProductItem;