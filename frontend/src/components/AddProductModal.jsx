import React, { useState } from 'react';
import * as api from '../services/api';

const AddProductModal = ({ isOpen, onClose, onAdd }) => {
    const [nom_produit, setNomProduit] = useState('');
    const [categorie, setCategorie] = useState('Général');
    const [quantite_stock, setQuantiteStock] = useState('');
    const [unite, setUnite] = useState('pièces');
    const [prix_unitaire, setPrixUnitaire] = useState('');
    const [seuil_minimum, setSeuilMinimum] = useState('');
    const [seuil_maximum, setSeuilMaximum] = useState('');
    const [date_peremption, setDatePeremption] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.addProduct({
                nom_produit,
                categorie,
                quantite_stock: parseInt(quantite_stock, 10),
                seuil_minimum: parseInt(seuil_minimum, 10),
                seuil_maximum: parseInt(seuil_maximum, 10),
                unite,
                prix_unitaire: parseFloat(prix_unitaire) || 0,
                date_peremption: date_peremption || null
            });
            onAdd();
            onClose();
            // Reset form
            setNomProduit('');
            setCategorie('Général');
            setQuantiteStock('');
            setUnite('pièces');
            setPrixUnitaire('');
            setSeuilMinimum('');
            setSeuilMaximum('');
            setDatePeremption('');
        } catch (err) {
            setError(err.response?.data?.error || "Erreur lors de l'ajout du produit.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Nouveau Produit</h2>
                    <button onClick={onClose} className="secondary" style={{ padding: '5px 10px' }}>&times;</button>
                </div>
                {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                        <input
                            type="text"
                            placeholder="Nom du produit"
                            value={nom_produit}
                            onChange={(e) => setNomProduit(e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                        />
                        <select
                            value={categorie}
                            onChange={(e) => setCategorie(e.target.value)}
                        >
                            <option value="Général">Général</option>
                            <option value="Viandes">Viandes</option>
                            <option value="Boulangerie">Boulangerie</option>
                            <option value="Congelés">Congelés</option>
                            <option value="Légumes">Légumes</option>
                            <option value="Boissons">Boissons</option>
                            <option value="Sauces">Sauces</option>
                            <option value="Emballages">Emballages</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                        <input
                            type="number"
                            placeholder="Quantité initiale"
                            value={quantite_stock}
                            onChange={(e) => setQuantiteStock(e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                        />
                        <select
                            value={unite}
                            onChange={(e) => setUnite(e.target.value)}
                        >
                            <option value="pièces">Pièces</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="L">Litres</option>
                            <option value="boîtes">Boîtes</option>
                            <option value="paquets">Paquets</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                        <input
                            type="number"
                            placeholder="Seuil Minimum"
                            value={seuil_minimum}
                            onChange={(e) => setSeuilMinimum(e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                        />
                        <input
                            type="number"
                            placeholder="Seuil Maximum"
                            value={seuil_maximum}
                            onChange={(e) => setSeuilMaximum(e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input
                            type="number"
                            placeholder="Prix unitaire (FCFA)"
                            step="0.01"
                            value={prix_unitaire}
                            onChange={(e) => setPrixUnitaire(e.target.value)}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', marginLeft: '4px' }}>Date de péremption (Optionnel)</span>
                            <input
                                type="date"
                                value={date_peremption}
                                onChange={(e) => setDatePeremption(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="secondary">Annuler</button>
                        <button type="submit">Ajouter</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProductModal;
