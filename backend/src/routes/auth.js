const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../database/connection');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await db.queryOne('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) {
            return res.status(400).send('Identifiants incorrects.');
        }

        const match = bcrypt.compareSync(password, user.password);

        if (match) {
            const token = jwt.sign(
                { username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );
            res.json({ token, role: user.role, username: user.username });
        } else {
            res.status(400).send('Identifiants incorrects.');
        }
    } catch (err) {
        console.error('Erreur lors de la requête:', err);
        res.status(500).send('Erreur serveur.');
    }
});

module.exports = router;