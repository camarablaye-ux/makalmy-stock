const express = require('express');
const db = require('../database/connection');
const { verifyToken, isProprietaire } = require('../middleware/auth');
const { sendStockAlertEmail } = require('../utils/mailService');
const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const rows = await db.query("SELECT * FROM products ORDER BY nom_produit");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', verifyToken, isProprietaire, async (req, res) => {
    try {
        const { nom_produit, categorie, quantite_stock, seuil_minimum, seuil_maximum, unite, prix_unitaire, date_peremption } = req.body;
        const resolvedUnite = unite || 'pièces';
        const resolvedCategorie = categorie || 'Général';
        const sql = `INSERT INTO products(nom_produit, categorie, quantite_stock, seuil_minimum, seuil_maximum, unite, prix_unitaire, date_peremption) VALUES (?,?,?,?,?,?,?,?)`;

        const result = await db.execute(sql, [nom_produit, resolvedCategorie, quantite_stock, seuil_minimum, seuil_maximum, resolvedUnite, prix_unitaire || 0, date_peremption || null]);
        res.status(201).json({ id: result.lastID });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.patch('/:id/quantite', verifyToken, async (req, res) => {
    try {
        const { quantite_stock, ancienne_quantite } = req.body;
        const sql = `UPDATE products SET quantite_stock = ? WHERE id = ?`;
        const result = await db.execute(sql, [quantite_stock, req.params.id]);

        const historySql = `INSERT INTO history(product_id, ancienne_valeur, nouvelle_valeur, utilisateur) VALUES(?,?,?,?)`;
        await db.execute(historySql, [req.params.id, ancienne_quantite, quantite_stock, req.user.username]);

        // Vérification pour déclencher l'alerte email
        try {
            const productQuery = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
            if (productQuery.length > 0) {
                const product = productQuery[0];

                // Si le nouveau stock est sous le seuil ET qu'il était au-dessus avant
                if (parseFloat(quantite_stock) <= parseFloat(product.seuil_minimum) &&
                    parseFloat(ancienne_quantite) > parseFloat(product.seuil_minimum)) {

                    const emailTo = process.env.ALERT_EMAIL_TO;
                    // On n'attend pas ("await") l'envoi de l'email pour ne pas ralentir le frontend
                    sendStockAlertEmail(emailTo, product).catch(e => console.error("Échec asynchrone email:", e));
                }
            }
        } catch (e) {
            console.error("Erreur lors de la vérification de l'alerte produit:", e);
        }

        res.json({ message: "Quantité mise à jour", changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', verifyToken, isProprietaire, async (req, res) => {
    try {
        const result = await db.execute(`DELETE FROM products WHERE id = ?`, [req.params.id]);
        res.json({ message: "Produit supprimé", changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const rows = await db.query("SELECT * FROM history WHERE product_id = ? ORDER BY date DESC", [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;