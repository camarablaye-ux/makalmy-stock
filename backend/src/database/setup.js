require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./connection');

const setup = async () => {
    try {
        console.log("Démarrage de l'initialisation de la base de données...");
        const idType = db.isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

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

        await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id ${idType},
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )`);

        // Date calculations
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const products = [
            { name: 'Steaks Hachés 150g', category: 'Viandes', qty: 120, min: 50, max: 200, unite: 'pièces', price: 1.20, expiry: nextWeek },
            { name: 'Pains Burger (Buns)', category: 'Boulangerie', qty: 150, min: 100, max: 300, unite: 'pièces', price: 0.35, expiry: nextWeek },
            { name: 'Frites Surgelées', category: 'Congelés', qty: 50, min: 20, max: 100, unite: 'kg', price: 2.50, expiry: nextMonth },
            { name: 'Coca-Cola 33cl', category: 'Boissons', qty: 250, min: 100, max: 500, unite: 'boîtes', price: 0.45, expiry: null },
            { name: 'Sauce Burger', category: 'Sauces', qty: 5, min: 2, max: 10, unite: 'L', price: 4.50, expiry: nextMonth },
            { name: 'Tomates Fraîches', category: 'Légumes', qty: 8, min: 5, max: 15, unite: 'kg', price: 2.80, expiry: nextWeek },
            { name: 'Gobelets Carton', category: 'Emballages', qty: 500, min: 200, max: 1000, unite: 'pièces', price: 0.05, expiry: null }
        ];

        const insertProductSql = `INSERT ${db.isPostgres ? '' : 'OR IGNORE'} INTO products (nom_produit, categorie, quantite_stock, seuil_minimum, seuil_maximum, unite, prix_unitaire, date_peremption) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ${db.isPostgres ? 'ON CONFLICT(nom_produit) DO NOTHING' : ''}`;

        for (const p of products) {
            await db.execute(insertProductSql, [p.name, p.category, p.qty, p.min, p.max, p.unite, p.price, p.expiry]);
        }

        const users = [
            { username: 'proprietaire', password: 'motdepasse_prop', role: 'proprietaire' },
            { username: 'employe', password: 'motdepasse_emp', role: 'employe' }
        ];

        const insertUserSql = `INSERT ${db.isPostgres ? '' : 'OR IGNORE'} INTO users (username, password, role) VALUES (?, ?, ?) ${db.isPostgres ? 'ON CONFLICT(username) DO NOTHING' : ''}`;

        for (const u of users) {
            const hashedPassword = bcrypt.hashSync(u.password, 10);
            await db.execute(insertUserSql, [u.username, hashedPassword, u.role]);
        }

        console.log('Base de données initialisée avec succès.');
        process.exit(0);
    } catch (err) {
        console.error('Erreur lors de la configuration de la base de données:', err);
        process.exit(1);
    }
};

setup();
