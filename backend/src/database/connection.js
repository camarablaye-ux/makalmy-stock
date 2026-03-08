const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const isPostgres = !!process.env.DATABASE_URL;

let pool, sqliteDb;

if (isPostgres) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Render Postgres
    });
    console.log('Connecté à la base de données PostgreSQL (Render).');
} else {
    const dbPath = path.resolve(__dirname, 'database.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Erreur de connexion à la base de données SQLite', err.message);
        } else {
            console.log('Connecté à la base de données SQLite (Local).');
        }
    });
}

const db = {
    isPostgres,
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            if (isPostgres) {
                let i = 1;
                const pgSql = sql.replace(/\?/g, () => `$${i++}`); // Replace sqlite ? with pg $1, $2
                pool.query(pgSql, params)
                    .then(res => resolve(res.rows))
                    .catch(reject);
            } else {
                sqliteDb.all(sql, params, (err, rows) => {
                    if (err) reject(err); else resolve(rows);
                });
            }
        });
    },
    queryOne: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            if (isPostgres) {
                let i = 1;
                const pgSql = sql.replace(/\?/g, () => `$${i++}`);
                pool.query(pgSql, params)
                    .then(res => resolve(res.rows[0]))
                    .catch(reject);
            } else {
                sqliteDb.get(sql, params, (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            }
        });
    },
    execute: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            if (isPostgres) {
                let i = 1;
                let pgSql = sql.replace(/\?/g, () => `$${i++}`);
                // Postgres requires RETURNING id for inserts
                if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
                    pgSql += ' RETURNING id';
                }
                pool.query(pgSql, params)
                    .then(res => resolve({
                        lastID: (res.rows && res.rows.length > 0) ? res.rows[0].id : null,
                        changes: res.rowCount
                    }))
                    .catch(reject);
            } else {
                sqliteDb.run(sql, params, function (err) {
                    if (err) reject(err); else resolve({ lastID: this.lastID, changes: this.changes });
                });
            }
        });
    },
    executeRunReturnId: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            if (isPostgres) {
                let i = 1;
                let pgSql = sql.replace(/\?/g, () => `$${i++}`);
                if (!pgSql.toUpperCase().includes('RETURNING')) {
                    pgSql += ' RETURNING id';
                }
                pool.query(pgSql, params)
                    .then(res => resolve({ id: (res.rows && res.rows.length > 0) ? res.rows[0].id : null }))
                    .catch(reject);
            } else {
                sqliteDb.run(sql, params, function (err) {
                    if (err) reject(err); else resolve({ id: this.lastID });
                });
            }
        });
    }
};

module.exports = db;
