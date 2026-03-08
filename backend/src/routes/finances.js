const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { verifyToken } = require('../middleware/auth');

// Middleware : seul le propriétaire
const verifierProprietaire = (req, res, next) => {
    if (req.user && req.user.role === 'proprietaire') {
        next();
    } else {
        res.status(403).json({ error: 'Accès refusé. Seul le propriétaire peut voir les finances.' });
    }
};

// --- RÉCUPÉRER TOUTES LES TRANSACTIONS (propriétaire uniquement) ---
router.get('/', verifyToken, verifierProprietaire, async (req, res) => {
    try {
        const transactions = await db.query('SELECT * FROM transactions ORDER BY date DESC');
        res.json(transactions);
    } catch (err) {
        console.error("Erreur GET /finances:", err);
        res.status(500).json({ error: 'Erreur lors de la récupération des transactions.' });
    }
});

// --- AJOUTER UNE TRANSACTION ---
// Ouvert à TOUS les utilisateurs authentifiés
// MAIS les employés ne peuvent enregistrer que des charges
router.post('/', verifyToken, async (req, res) => {
    const { type, montant, motif, categorie_syscohada } = req.body;

    if (!type || !montant || !motif) {
        return res.status(400).json({ error: 'Type, montant et motif sont requis.' });
    }

    // Restriction employé : charges uniquement
    if (req.user.role === 'employe' && type !== 'charge') {
        return res.status(403).json({ error: 'Les employés ne peuvent enregistrer que des charges.' });
    }

    if (type !== 'revenu' && type !== 'charge') {
        return res.status(400).json({ error: 'Le type doit être "revenu" ou "charge".' });
    }

    const categorie = categorie_syscohada || 'Non catégorisé';

    try {
        const sql = db.isPostgres
            ? 'INSERT INTO transactions (type, montant, motif, utilisateur, categorie_syscohada) VALUES ($1, $2, $3, $4, $5) RETURNING id'
            : 'INSERT INTO transactions (type, montant, motif, utilisateur, categorie_syscohada) VALUES (?, ?, ?, ?, ?)';
        const result = await db.executeRunReturnId(sql, [type, montant, motif, req.user.username, categorie]);
        res.status(201).json({ id: result.id, message: 'Transaction ajoutée.' });
    } catch (err) {
        console.error("Erreur POST /finances:", err);
        res.status(500).json({ error: "Erreur lors de l'ajout de la transaction." });
    }
});

// --- OBTENIR LE BILAN (propriétaire uniquement) ---
router.get('/bilan', verifyToken, verifierProprietaire, async (req, res) => {
    try {
        const transactions = await db.query('SELECT type, montant FROM transactions');

        let totalRevenus = 0;
        let totalCharges = 0;

        transactions.forEach(t => {
            if (t.type === 'revenu') totalRevenus += t.montant;
            if (t.type === 'charge') totalCharges += t.montant;
        });

        res.json({
            totalRevenus,
            totalCharges,
            beneficeNet: totalRevenus - totalCharges
        });
    } catch (err) {
        console.error("Erreur GET /finances/bilan:", err);
        res.status(500).json({ error: 'Erreur lors du calcul du bilan.' });
    }
});

// --- SUPPRIMER UNE TRANSACTION (propriétaire uniquement) ---
router.delete('/:id', verifyToken, verifierProprietaire, async (req, res) => {
    const { id } = req.params;
    try {
        const sql = db.isPostgres
            ? 'DELETE FROM transactions WHERE id = $1'
            : 'DELETE FROM transactions WHERE id = ?';
        await db.execute(sql, [id]);
        res.json({ message: 'Transaction supprimée avec succès.' });
    } catch (err) {
        console.error("Erreur DELETE /finances:", err);
        res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
});

module.exports = router;
