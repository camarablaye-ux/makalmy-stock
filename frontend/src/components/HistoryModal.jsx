import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

const HistoryModal = ({ isOpen, onClose, product }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && product) {
            fetchHistory();
        }
    }, [isOpen, product]);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.getProductHistory(product.id);
            setHistory(data);
        } catch (err) {
            setError("Erreur lors du chargement de l'historique.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Historique - {product.nom_produit}</h2>
                    <button onClick={onClose} className="secondary" style={{ padding: '5px 10px' }}>&times;</button>
                </div>

                {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
                {loading && <p>Chargement en cours...</p>}

                {!loading && history.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucun mouvement enregistré pour ce produit.</p>
                )}

                {!loading && history.length > 0 && (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '8px' }}>Date</th>
                                    <th style={{ padding: '8px' }}>Utilisateur</th>
                                    <th style={{ padding: '8px' }}>Ancien</th>
                                    <th style={{ padding: '8px' }}>Nouveau</th>
                                    <th style={{ padding: '8px' }}>Mouvement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(entry => {
                                    const diff = entry.nouvelle_valeur - entry.ancienne_valeur;
                                    const diffColor = diff > 0 ? 'var(--success-color)' : 'var(--danger-color)';
                                    return (
                                        <tr key={entry.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '10px 8px' }}>{new Date(entry.date).toLocaleString()}</td>
                                            <td style={{ padding: '10px 8px' }}>{entry.utilisateur}</td>
                                            <td style={{ padding: '10px 8px' }}>{entry.ancienne_valeur} {product.unite}</td>
                                            <td style={{ padding: '10px 8px' }}>{entry.nouvelle_valeur} {product.unite}</td>
                                            <td style={{ padding: '10px 8px', color: diffColor, fontWeight: 'bold' }}>
                                                {diff > 0 ? `+${diff}` : diff} {product.unite}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button onClick={onClose} className="secondary">Fermer</button>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
