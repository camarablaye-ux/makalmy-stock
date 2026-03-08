const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../database/connection');
const { verifyToken, isProprietaire } = require('../middleware/auth');
const router = express.Router();

// --- INSCRIPTION (premier compte = propriétaire, ensuite = employé) ---
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
    if (password.length < 6) return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères.' });

    try {
        const existing = await db.queryOne('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) return res.status(400).json({ error: "Ce nom d'utilisateur existe déjà." });

        // Le premier utilisateur est automatiquement propriétaire
        const allUsers = await db.query('SELECT id FROM users');
        const role = allUsers.length === 0 ? 'proprietaire' : 'employe';

        const hashed = bcrypt.hashSync(password, 10);
        await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashed, role]);

        // Connexion automatique après inscription
        const token = jwt.sign({ username, role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(201).json({ token, role, username, message: `Compte "${role}" créé avec succès.` });
    } catch (err) {
        console.error('Erreur register:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.queryOne('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return res.status(400).send('Identifiants incorrects.');

        const match = bcrypt.compareSync(password, user.password);
        if (match) {
            const token = jwt.sign(
                { username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            res.json({ token, role: user.role, username: user.username });
        } else {
            res.status(400).send('Identifiants incorrects.');
        }
    } catch (err) {
        console.error('Erreur login:', err);
        res.status(500).send('Erreur serveur.');
    }
});

// --- CHANGEMENT DE MOT DE PASSE ---
router.post('/change-password', verifyToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Les deux mots de passe sont requis.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });

    try {
        const user = await db.queryOne('SELECT * FROM users WHERE username = ?', [req.user.username]);
        if (!user || !bcrypt.compareSync(oldPassword, user.password)) {
            return res.status(400).json({ error: 'Ancien mot de passe incorrect.' });
        }
        const hashed = bcrypt.hashSync(newPassword, 10);
        const sql = db.isPostgres
            ? 'UPDATE users SET password = $1 WHERE username = $2'
            : 'UPDATE users SET password = ? WHERE username = ?';
        await db.execute(sql, [hashed, req.user.username]);
        res.json({ message: 'Mot de passe modifié avec succès.' });
    } catch (err) {
        console.error('Erreur changement MDP:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// --- LISTER LES EMPLOYÉS (propriétaire uniquement) ---
router.get('/employes', verifyToken, isProprietaire, async (req, res) => {
    try {
        const employes = await db.query("SELECT id, username, role FROM users WHERE role = 'employe' ORDER BY username ASC");
        res.json(employes);
    } catch (err) {
        console.error('Erreur GET employes:', err);
        res.status(500).json({ error: 'Erreur.' });
    }
});

// --- CRÉER UN EMPLOYÉ (propriétaire uniquement) ---
router.post('/employes', verifyToken, isProprietaire, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
    if (password.length < 6) return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères.' });

    try {
        // Vérifier si l'utilisateur existe déjà
        const existing = await db.queryOne('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) return res.status(400).json({ error: "Ce nom d'utilisateur existe déjà." });

        const hashed = bcrypt.hashSync(password, 10);
        const sql = db.isPostgres
            ? "INSERT INTO users (username, password, role) VALUES ($1, $2, 'employe') RETURNING id"
            : "INSERT INTO users (username, password, role) VALUES (?, ?, 'employe')";
        const result = await db.executeRunReturnId(sql, [username, hashed]);
        res.status(201).json({ id: result.id, message: `Employé "${username}" créé avec succès.` });
    } catch (err) {
        console.error('Erreur création employé:', err);
        res.status(500).json({ error: "Erreur lors de la création." });
    }
});

// --- SUPPRIMER UN EMPLOYÉ (propriétaire uniquement) ---
router.delete('/employes/:id', verifyToken, isProprietaire, async (req, res) => {
    const { id } = req.params;
    try {
        // Empêcher la suppression du propriétaire
        const user = await db.queryOne('SELECT role FROM users WHERE id = ?', [id]);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        if (user.role === 'proprietaire') return res.status(403).json({ error: 'Impossible de supprimer le propriétaire.' });

        const sql = db.isPostgres ? 'DELETE FROM users WHERE id = $1' : 'DELETE FROM users WHERE id = ?';
        await db.execute(sql, [id]);
        res.json({ message: 'Employé supprimé.' });
    } catch (err) {
        console.error('Erreur suppression employé:', err);
        res.status(500).json({ error: 'Erreur.' });
    }
});

module.exports = router;