require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const financeRoutes = require('./routes/finances');
const investRoutes = require('./routes/investissements');
const fournisseurRoutes = require('./routes/fournisseurs');
const db = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — autoriser le frontend en production et en local
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
        callback(null, true); // permissif pour le moment
    },
    credentials: true
}));

app.use(express.json());

// Health check (utilisé par Render pour vérifier que le service est actif)
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Makalmy Stock API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/investissements', investRoutes);
app.use('/api/fournisseurs', fournisseurRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Une erreur inattendue est survenue.' });
});

// Auto-migration : créer les tables au démarrage si elles n'existent pas
const initDatabase = async () => {
    try {
        const idType = db.isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

        await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id ${idType},
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS products (
            id ${idType},
            nom_produit TEXT UNIQUE NOT NULL,
            categorie TEXT DEFAULT 'Général',
            quantite_stock INTEGER NOT NULL,
            seuil_minimum INTEGER NOT NULL,
            seuil_maximum INTEGER NOT NULL,
            unite TEXT DEFAULT 'pièces',
            prix_unitaire REAL DEFAULT 0,
            date_peremption DATE DEFAULT NULL
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS history (
            id ${idType},
            product_id INTEGER,
            ancienne_valeur INTEGER,
            nouvelle_valeur INTEGER,
            utilisateur TEXT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS transactions (
            id ${idType},
            type TEXT NOT NULL CHECK(type IN ('revenu', 'charge')),
            montant REAL NOT NULL,
            motif TEXT NOT NULL,
            categorie_syscohada TEXT DEFAULT 'Non catégorisé',
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            utilisateur TEXT
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS investissements (
            id ${idType},
            nom TEXT NOT NULL,
            nature TEXT NOT NULL,
            montant REAL NOT NULL,
            duree_mois INTEGER NOT NULL,
            amortissement_mensuel REAL NOT NULL,
            date_achat DATE NOT NULL,
            date_fin DATE NOT NULL,
            actif INTEGER DEFAULT 1
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS fournisseurs (
            id ${idType},
            nom TEXT NOT NULL,
            telephone TEXT DEFAULT '',
            categorie TEXT DEFAULT 'Général',
            notes TEXT DEFAULT '',
            date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log('✅ Tables de la base de données vérifiées/créées.');
    } catch (err) {
        console.error('❌ Erreur d\'initialisation de la base de données:', err);
    }
};

// Démarrer le serveur
const startServer = async () => {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Serveur backend démarré sur http://0.0.0.0:${PORT}`);
    });
};

startServer();