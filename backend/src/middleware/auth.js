const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).send('Un token est requis.');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send('Token invalide.');
    }
    return next();
};

const isProprietaire = (req, res, next) => {
    if (req.user && req.user.role === 'proprietaire') {
        next();
    } else {
        res.status(403).send('Accès refusé. Rôle propriétaire requis.');
    }
};

module.exports = { verifyToken, isProprietaire };