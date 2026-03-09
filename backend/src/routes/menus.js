const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const verifyToken = require('../middleware/authMiddleware');

// === GET ALL MENUS (WITH THEIR INGREDIENTS) ===
router.get('/', verifyToken, async (req, res) => {
    try {
        const menusQuery = await db.query('SELECT * FROM menus ORDER BY nom ASC');
        const menus = menusQuery.rows;

        // Fetch ingredients for each menu
        for (let i = 0; i < menus.length; i++) {
            const ingQuery = await db.query(`
                SELECT mi.product_id, mi.quantite_necessaire, p.nom_produit, p.unite
                FROM menu_ingredients mi
                JOIN products p ON mi.product_id = p.id
                WHERE mi.menu_id = $1
            `, [menus[i].id]);
            menus[i].ingredients = ingQuery.rows;
        }

        res.json(menus);
    } catch (err) {
        console.error("Erreur récupération menus:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// === CREATE A NEW MENU ===
// Body expected: { nom: 'Menu Burger', prix: 15.00, ingredients: [{ product_id: 1, quantite_necessaire: 1 }, ...] }
router.post('/', verifyToken, async (req, res) => {
    if (req.user.role !== 'proprietaire') return res.status(403).json({ error: 'Accès refusé' });

    const { nom, prix, ingredients } = req.body;
    if (!nom || !ingredients || ingredients.length === 0) {
        return res.status(400).json({ error: 'Nom et ingrédients requis' });
    }

    try {
        await db.query('BEGIN'); // Start transaction

        // 1. Create the Menu
        const menuResult = await db.query(
            "INSERT INTO menus (nom, prix) VALUES ($1, $2) RETURNING id",
            [nom, prix || 0]
        );
        const menuId = menuResult.rows[0].id;

        // 2. Add the ingredients links
        for (const ing of ingredients) {
            await db.query(
                "INSERT INTO menu_ingredients (menu_id, product_id, quantite_necessaire) VALUES ($1, $2, $3)",
                [menuId, ing.product_id, ing.quantite_necessaire]
            );
        }

        await db.query('COMMIT'); // Validated
        res.status(201).json({ id: menuId, message: 'Menu créé avec succès' });
    } catch (err) {
        await db.query('ROLLBACK'); // Cancel if failed
        console.error("Erreur création menu:", err);
        if (err.message && err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Un menu avec ce nom existe déjà' });
        }
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// === DELETE A MENU ===
router.delete('/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'proprietaire') return res.status(403).json({ error: 'Accès refusé' });
    try {
        // ON DELETE CASCADE will handle removing the menu_ingredients
        await db.query("DELETE FROM menus WHERE id = $1", [req.params.id]);
        res.json({ message: "Menu supprimé" });
    } catch (err) {
        console.error("Erreur suppression menu:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// === SELL A MENU (Trigger group decrement) ===
router.post('/:id/vendre', verifyToken, async (req, res) => {
    const defaultQtyToSell = req.body.quantite || 1; // Allows selling multiple menus at once
    try {
        // 1. Fetch menu details and ingredients
        const menuQuery = await db.query('SELECT nom, prix FROM menus WHERE id = $1', [req.params.id]);
        if (menuQuery.rows.length === 0) return res.status(404).json({ error: "Menu introuvable" });
        const menu = menuQuery.rows[0];

        const ingQuery = await db.query(`
            SELECT mi.product_id, mi.quantite_necessaire, p.nom_produit, p.quantite_stock 
            FROM menu_ingredients mi 
            JOIN products p ON mi.product_id = p.id 
            WHERE mi.menu_id = $1
        `, [req.params.id]);

        const ingredients = ingQuery.rows;

        // Option B selected by user: We allow stock to go negative (no strict pre-validation)

        await db.query('BEGIN'); // Start transaction

        // 2. Decrement all ingredients
        for (const ing of ingredients) {
            const totalToDeduct = ing.quantite_necessaire * defaultQtyToSell;
            const newStock = ing.quantite_stock - totalToDeduct;

            // Update Product
            await db.query('UPDATE products SET quantite_stock = $1 WHERE id = $2', [newStock, ing.product_id]);

            // Save History log
            await db.query(
                `INSERT INTO history (product_id, ancienne_valeur, nouvelle_valeur, utilisateur) VALUES ($1, $2, $3, $4)`,
                [ing.product_id, ing.quantite_stock, newStock, req.user.username]
            );
        }

        // 3. Increment Finances (Revenue for the sale)
        if (menu.prix > 0) {
            const totalRevenue = menu.prix * defaultQtyToSell;
            await db.query(
                `INSERT INTO transactions (type, montant, motif, categorie_syscohada, utilisateur) VALUES ($1, $2, $3, $4, $5)`,
                ['revenu', totalRevenue, `Vente : ${defaultQtyToSell}x Menu ${menu.nom}`, '701 - Ventes de produits finis', req.user.username]
            );
        }

        await db.query('COMMIT');
        res.json({ message: "Menu vendu avec succès. Stocks mis à jour.", revenus: menu.prix * defaultQtyToSell });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Erreur vente menu:", err);
        res.status(500).json({ error: "Erreur lors de la vente du menu" });
    }
});

module.exports = router;
