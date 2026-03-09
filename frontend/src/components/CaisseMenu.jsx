import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import Logo from './Logo';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CaisseMenu = ({ theme, toggleTheme }) => {
    const { logOut } = useAuth();
    const navigate = useNavigate();

    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);

    // Track how many items are currently in the cart
    const [cart, setCart] = useState({});

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const res = await api.getMenus();
            setMenus(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur de chargement des menus");
        } finally {
            setLoading(false);
        }
    };

    const handleIncrement = (menuId) => {
        setCart(prev => ({
            ...prev,
            [menuId]: (prev[menuId] || 0) + 1
        }));
    };

    const handleDecrement = (menuId) => {
        setCart(prev => {
            const current = prev[menuId] || 0;
            if (current <= 1) {
                const newCart = { ...prev };
                delete newCart[menuId];
                return newCart;
            }
            return {
                ...prev,
                [menuId]: current - 1
            };
        });
    };

    const handleSell = async () => {
        const itemIds = Object.keys(cart);
        if (itemIds.length === 0) return;

        try {
            // Process sequentially for safety, though Promise.all could be used
            for (const menuId of itemIds) {
                const qty = cart[menuId];
                await api.sellMenu(menuId, qty);
            }
            toast.success("Vente validée. Stocks mis à jour.", { icon: '🍔' });
            setCart({});
        } catch (error) {
            console.error(error);
            toast.error("Erreur durant la vente. Vérifiez les stocks.");
        }
    };

    const totalCartItems = Object.values(cart).reduce((a, b) => a + b, 0);
    const totalPrice = Object.entries(cart).reduce((total, [menuId, qty]) => {
        const menu = menus.find(m => m.id === parseInt(menuId));
        return total + ((menu?.prix || 0) * qty);
    }, 0);

    return (
        <div>
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="secondary" onClick={() => navigate('/saisie')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>💳 Saisie Standard</button>
                        <button style={{ padding: '6px 14px', fontSize: '0.85rem', pointerEvents: 'none', background: 'var(--primary-color)', color: 'var(--bg-color)' }}>🍔 Caisse (Menus)</button>
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <button onClick={toggleTheme} className="secondary" style={{ fontSize: '1rem', padding: '6px 10px', borderRadius: '50%' }}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button onClick={logOut} className="secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Quitter</button>
                </div>
            </header>

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Caisse Rapide</h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Touchez un menu pour l'ajouter au panier. La validation déduira les ingrédients associés.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</div>
            ) : menus.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🍽️</div>
                    <div className="empty-state-title">Aucun menu disponible</div>
                    <div className="empty-state-text">Demandez au propriétaire de configurer des menus dans son espace.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', paddingBottom: '120px' }}>
                    {menus.map(menu => {
                        const qtyInCart = cart[menu.id] || 0;
                        return (
                            <div
                                key={menu.id}
                                onClick={() => handleIncrement(menu.id)}
                                style={{
                                    background: qtyInCart > 0 ? 'var(--surface-border)' : 'var(--surface-color)',
                                    border: qtyInCart > 0 ? '2px solid var(--primary-color)' : '2px solid var(--surface-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    width: 'calc(50% - 0.5rem)',
                                    minWidth: '150px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    boxShadow: qtyInCart > 0 ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                                }}
                            >
                                {qtyInCart > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '-10px',
                                        background: 'var(--primary-color)',
                                        color: 'var(--bg-color)',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}>
                                        {qtyInCart}
                                    </div>
                                )}
                                <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍔</span>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{menu.nom}</h3>
                                {menu.prix > 0 && <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{menu.prix.toLocaleString('fr-FR')} FCFA</span>}

                                {qtyInCart > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }} onClick={e => e.stopPropagation()}>
                                        <button className="danger" onClick={() => handleDecrement(menu.id)} style={{ padding: '4px 12px', fontSize: '1.2rem' }}>-</button>
                                        <button onClick={() => handleIncrement(menu.id)} style={{ padding: '4px 12px', fontSize: '1.2rem' }}>+</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Sticky Bottom Cart Bar */}
            {totalCartItems > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '70px', // Above mobile bottom nav
                    left: 0,
                    right: 0,
                    background: 'var(--surface-color)',
                    borderTop: '1px solid var(--surface-border)',
                    padding: '1rem',
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 100
                }}>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{totalCartItems} Menu(s)</div>
                        {totalPrice > 0 && <div style={{ color: 'var(--text-secondary)' }}>Total: {totalPrice.toLocaleString('fr-FR')} FCFA</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="secondary" onClick={() => setCart({})}>Vider</button>
                        <button onClick={handleSell} style={{ background: '#10b981', borderColor: '#10b981', color: '#fff', fontSize: '1.1rem', padding: '0.8rem 1.5rem' }}>
                            Encaisser
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaisseMenu;
