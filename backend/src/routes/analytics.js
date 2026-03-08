const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { verifyToken } = require('../middleware/auth');

// Middleware : seul le propriétaire
const verifierProprietaire = (req, res, next) => {
    if (req.user && req.user.role === 'proprietaire') {
        next();
    } else {
        res.status(403).json({ error: 'Accès refusé. Seul le propriétaire peut voir les statistiques.' });
    }
};

router.use(verifyToken, verifierProprietaire);

// --- 1. Évolution du Chiffre d'Affaires (CA) des 7 derniers jours ---
router.get('/ca-evolution', async (req, res) => {
    try {
        // Obtenir la date d'il y a 7 jours
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 7);
        const dateLimitStr = dateLimit.toISOString().split('T')[0] + ' 00:00:00';

        // Grouper les revenus par jour
        const sql = db.isPostgres
            ? `SELECT DATE(date) as jour, SUM(montant) as total FROM transactions WHERE type = 'revenu' AND date >= $1 GROUP BY DATE(date) ORDER BY jour ASC`
            : `SELECT strftime('%Y-%m-%d', date) as jour, SUM(montant) as total FROM transactions WHERE type = 'revenu' AND date >= ? GROUP BY strftime('%Y-%m-%d', date) ORDER BY jour ASC`;

        const evolution = await db.query(sql, [dateLimitStr]);

        // Formater pour avoir 7 jours consécutifs, même s'il n'y a pas de vente
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const jourStr = d.toISOString().split('T')[0];

            const existingData = evolution.find(e => {
                const eJour = db.isPostgres ? e.jour.toISOString().split('T')[0] : e.jour;
                return eJour === jourStr;
            });

            result.push({
                date: jourStr,
                // Formatage "Lun 12" pour l'affichage Frontend
                label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
                ca: existingData ? existingData.total : 0
            });
        }

        res.json(result);
    } catch (err) {
        console.error("Erreur Analytics CA:", err);
        res.status(500).json({ error: 'Erreur lors du calcul de l\'évolution du CA.' });
    }
});

// --- 2. Top 5 Produits (Basé sur les sorties de stock historiques) ---
router.get('/top-produits', async (req, res) => {
    try {
        // Chercher toutes les diminutions de stock (nouvelle_valeur < ancienne_valeur)
        const sql = `
            SELECT 
                h.product_id, 
                p.nom_produit, 
                SUM(h.ancienne_valeur - h.nouvelle_valeur) as quantite_sortie,
                p.unite
            FROM history h
            JOIN products p ON h.product_id = p.id
            WHERE h.nouvelle_valeur < h.ancienne_valeur
            GROUP BY h.product_id, p.nom_produit, p.unite
            ORDER BY quantite_sortie DESC
            LIMIT 5
        `;

        const topProduits = await db.query(sql);
        res.json(topProduits);
    } catch (err) {
        console.error("Erreur Analytics Top Produits:", err);
        res.status(500).json({ error: 'Erreur lors du calcul du Top Produits.' });
    }
});

// --- 3. Marge Brute Globale (Revenus - Achats Matières Premières) ---
router.get('/marge', async (req, res) => {
    try {
        const sqlRevenus = `SELECT SUM(montant) as total FROM transactions WHERE type = 'revenu'`;
        // Les catégories 601, 602, 604 de SYSCOHADA correspondent aux achats vendus
        const sqlCouts = `SELECT SUM(montant) as total FROM transactions WHERE type = 'charge' AND (categorie_syscohada LIKE '601%' OR categorie_syscohada LIKE '602%' OR categorie_syscohada LIKE '604%')`;

        const [revenusRow, coutsRow] = await Promise.all([
            db.query(sqlRevenus),
            db.query(sqlCouts)
        ]);

        const revenus = revenusRow[0]?.total || 0;
        const coutsAchat = coutsRow[0]?.total || 0;

        let margePourcentage = 0;
        if (revenus > 0) {
            margePourcentage = ((revenus - coutsAchat) / revenus) * 100;
        }

        res.json({
            chiffreAffaires: revenus,
            coutsAchatMatiere: coutsAchat,
            margeBruteValeur: revenus - coutsAchat,
            margeBrutePourcentage: Math.round(margePourcentage * 100) / 100 // Garde 2 décimales
        });
    } catch (err) {
        console.error("Erreur Analytics Marge:", err);
        res.status(500).json({ error: 'Erreur lors du calcul de la Marge Brute.' });
    }
});

module.exports = router;
