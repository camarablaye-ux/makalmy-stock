const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { verifyToken, isProprietaire } = require('../middleware/auth');

// --- RÉCUPÉRER TOUS LES FOURNISSEURS ---
router.get('/', verifyToken, async (req, res) => {
    try {
        const fournisseurs = await db.query('SELECT * FROM fournisseurs ORDER BY nom ASC');
        res.json(fournisseurs);
    } catch (err) {
        console.error("Erreur GET /fournisseurs:", err);
        res.status(500).json({ error: 'Erreur.' });
    }
});

// --- AJOUTER UN FOURNISSEUR ---
router.post('/', verifyToken, isProprietaire, async (req, res) => {
    const { nom, telephone, categorie, notes } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom est requis.' });

    try {
        const sql = db.isPostgres
            ? 'INSERT INTO fournisseurs (nom, telephone, categorie, notes) VALUES ($1, $2, $3, $4) RETURNING id'
            : 'INSERT INTO fournisseurs (nom, telephone, categorie, notes) VALUES (?, ?, ?, ?)';
        const result = await db.executeRunReturnId(sql, [nom, telephone || '', categorie || 'Général', notes || '']);
        res.status(201).json({ id: result.id, message: 'Fournisseur ajouté.' });
    } catch (err) {
        console.error("Erreur POST /fournisseurs:", err);
        res.status(500).json({ error: "Erreur lors de l'ajout." });
    }
});

// --- SUPPRIMER UN FOURNISSEUR ---
router.delete('/:id', verifyToken, isProprietaire, async (req, res) => {
    const { id } = req.params;
    try {
        const sql = db.isPostgres ? 'DELETE FROM fournisseurs WHERE id = $1' : 'DELETE FROM fournisseurs WHERE id = ?';
        await db.execute(sql, [id]);
        res.json({ message: 'Fournisseur supprimé.' });
    } catch (err) {
        console.error("Erreur DELETE /fournisseurs:", err);
        res.status(500).json({ error: 'Erreur.' });
    }
});

module.exports = router;
