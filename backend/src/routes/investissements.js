const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { verifyToken } = require('../middleware/auth');

const verifierProprietaire = (req, res, next) => {
    if (req.user && req.user.role === 'proprietaire') {
        next();
    } else {
        res.status(403).json({ error: 'Accès refusé.' });
    }
};

// Natures d'investissement pour un restaurant
const NATURES_INVESTISSEMENT = [
    'Équipement de cuisine',
    'Mobilier',
    'Véhicule de livraison',
    'Matériel informatique',
    'Aménagement du local',
    'Installation frigorifique',
    'Signalétique & Enseigne',
    'Autre'
];

// --- RÉCUPÉRER TOUS LES INVESTISSEMENTS ---
router.get('/', verifyToken, verifierProprietaire, async (req, res) => {
    try {
        const investissements = await db.query('SELECT * FROM investissements ORDER BY date_achat DESC');

        // Calculer la valeur nette comptable (VNC) pour chaque investissement
        const now = new Date();
        const enriched = investissements.map(inv => {
            const dateAchat = new Date(inv.date_achat);
            const moisEcoules = Math.max(0,
                (now.getFullYear() - dateAchat.getFullYear()) * 12 +
                (now.getMonth() - dateAchat.getMonth())
            );
            const amortissementCumule = Math.min(inv.montant, moisEcoules * inv.amortissement_mensuel);
            const valeurNetteComptable = Math.max(0, inv.montant - amortissementCumule);
            const pourcentageAmorti = Math.min(100, (amortissementCumule / inv.montant) * 100);

            return {
                ...inv,
                mois_ecoules: moisEcoules,
                amortissement_cumule: Math.round(amortissementCumule),
                valeur_nette_comptable: Math.round(valeurNetteComptable),
                pourcentage_amorti: Math.round(pourcentageAmorti),
                est_totalement_amorti: valeurNetteComptable <= 0
            };
        });

        res.json(enriched);
    } catch (err) {
        console.error("Erreur GET /investissements:", err);
        res.status(500).json({ error: 'Erreur lors de la récupération.' });
    }
});

// --- RÉSUMÉ D'AMORTISSEMENT pour le bilan ---
router.get('/resume', verifyToken, verifierProprietaire, async (req, res) => {
    try {
        const investissements = await db.query('SELECT * FROM investissements WHERE actif = 1');

        let totalInvesti = 0;
        let amortissementMensuelTotal = 0;
        let valeurNetteTotal = 0;

        const now = new Date();
        investissements.forEach(inv => {
            totalInvesti += inv.montant;
            const dateFin = new Date(inv.date_fin);
            // Only count amortization if not fully depreciated
            if (now < dateFin) {
                amortissementMensuelTotal += inv.amortissement_mensuel;
            }
            const dateAchat = new Date(inv.date_achat);
            const moisEcoules = Math.max(0,
                (now.getFullYear() - dateAchat.getFullYear()) * 12 +
                (now.getMonth() - dateAchat.getMonth())
            );
            const amortCumule = Math.min(inv.montant, moisEcoules * inv.amortissement_mensuel);
            valeurNetteTotal += Math.max(0, inv.montant - amortCumule);
        });

        res.json({
            totalInvesti: Math.round(totalInvesti),
            amortissementMensuel: Math.round(amortissementMensuelTotal),
            valeurNette: Math.round(valeurNetteTotal),
            nombreInvestissements: investissements.length
        });
    } catch (err) {
        console.error("Erreur GET /investissements/resume:", err);
        res.status(500).json({ error: 'Erreur.' });
    }
});

// --- AJOUTER UN INVESTISSEMENT ---
router.post('/', verifyToken, verifierProprietaire, async (req, res) => {
    const { nom, nature, montant, duree_mois, date_achat } = req.body;

    if (!nom || !nature || !montant || !duree_mois || !date_achat) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const amortissementMensuel = Math.round((montant / duree_mois) * 100) / 100;

    // Calculer la date de fin
    const achat = new Date(date_achat);
    achat.setMonth(achat.getMonth() + parseInt(duree_mois));
    const dateFin = achat.toISOString().split('T')[0];

    try {
        const sql = db.isPostgres
            ? 'INSERT INTO investissements (nom, nature, montant, duree_mois, amortissement_mensuel, date_achat, date_fin) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id'
            : 'INSERT INTO investissements (nom, nature, montant, duree_mois, amortissement_mensuel, date_achat, date_fin) VALUES (?, ?, ?, ?, ?, ?, ?)';

        const result = await db.executeRunReturnId(sql, [nom, nature, montant, duree_mois, amortissementMensuel, date_achat, dateFin]);
        res.status(201).json({
            id: result.id,
            amortissement_mensuel: amortissementMensuel,
            message: `Investissement ajouté. Amortissement de ${amortissementMensuel.toLocaleString()} FCFA/mois sur ${duree_mois} mois.`
        });
    } catch (err) {
        console.error("Erreur POST /investissements:", err);
        res.status(500).json({ error: "Erreur lors de l'ajout." });
    }
});

// --- SUPPRIMER UN INVESTISSEMENT ---
router.delete('/:id', verifyToken, verifierProprietaire, async (req, res) => {
    const { id } = req.params;
    try {
        const sql = db.isPostgres
            ? 'DELETE FROM investissements WHERE id = $1'
            : 'DELETE FROM investissements WHERE id = ?';
        await db.execute(sql, [id]);
        res.json({ message: 'Investissement supprimé.' });
    } catch (err) {
        console.error("Erreur DELETE /investissements:", err);
        res.status(500).json({ error: 'Erreur.' });
    }
});

module.exports = router;
