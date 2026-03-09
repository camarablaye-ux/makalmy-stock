import nodemailer from 'nodemailer';

// Configuration du transporteur d'emails
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Envoie un email d'alerte de stock critique au propriétaire
 * @param {string} emailTo - Adresse email du propriétaire
 * @param {Object} product - L'objet produit concerné
 */
export const sendStockAlertEmail = async (emailTo, product) => {
    if (!process.env.SMTP_USER || !emailTo) {
        console.warn("\n⚠️ --- ALERTE STOCK (Mode Console) ---");
        console.warn(`Produit concerné : ${product.nom_produit} (Stock: ${product.quantite_stock}/${product.seuil_minimum})`);
        console.warn("L'email HTML suivant aurait été envoyé si le SMTP était configuré :");
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Alerte de Stock Faible</h2>
                </div>
                
                <div style="padding: 20px; background-color: #f9fafb;">
                    <p style="font-size: 16px; color: #374151;">Bonjour,</p>
                    <p style="font-size: 16px; color: #374151;">
                        Le produit suivant a atteint un niveau de stock critique et nécessite un réapprovisionnement de toute urgence :
                    </p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #111827;">Détails du produit :</h3>
                        <ul style="list-style-type: none; padding-left: 0; color: #4b5563;">
                            <li style="margin-bottom: 10px;"><strong>📦 Nom :</strong> <span style="color: #ef4444; font-weight: bold;">${product.nom_produit}</span></li>
                            <li style="margin-bottom: 10px;"><strong>🏷️ Catégorie :</strong> ${product.categorie || 'Non classée'}</li>
                            <li style="margin-bottom: 10px;"><strong>📉 Stock Actuel :</strong> <span style="color: #ef4444; font-size: 1.2em; font-weight: bold;">${product.quantite_stock} ${product.unite}</span></li>
                            <li style="margin-bottom: 0;"><strong>⚠️ Seuil d'Alerte :</strong> ${product.seuil_minimum} ${product.unite}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        console.log(htmlContent);
        console.warn("----------------------------------\n");
        return;
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: `"Makalmy Stock" <${process.env.SMTP_USER}>`,
        to: emailTo,
        subject: `⚠️ ALERTE RUPTURE : ${product.nom_produit}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Alerte de Stock Faible</h2>
                </div>
                
                <div style="padding: 20px; background-color: #f9fafb;">
                    <p style="font-size: 16px; color: #374151;">Bonjour,</p>
                    <p style="font-size: 16px; color: #374151;">
                        Le produit suivant a atteint un niveau de stock critique et nécessite un réapprovisionnement de toute urgence :
                    </p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #111827;">Détails du produit :</h3>
                        <ul style="list-style-type: none; padding-left: 0; color: #4b5563;">
                            <li style="margin-bottom: 10px;"><strong>📦 Nom :</strong> <span style="color: #ef4444; font-weight: bold;">${product.nom_produit}</span></li>
                            <li style="margin-bottom: 10px;"><strong>🏷️ Catégorie :</strong> ${product.categorie || 'Non classée'}</li>
                            <li style="margin-bottom: 10px;"><strong>📉 Stock Actuel :</strong> <span style="color: #ef4444; font-size: 1.2em; font-weight: bold;">${product.quantite_stock} ${product.unite}</span></li>
                            <li style="margin-bottom: 0;"><strong>⚠️ Seuil d'Alerte :</strong> ${product.seuil_minimum} ${product.unite}</li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 14px; margin-top: 30px; color: #6b7280; text-align: center;">
                        Ceci est un message automatique généré par votre application Makalmy Stock.<br>
                        Veuillez ne pas y répondre directement.
                    </p>
                </div>
                
                <div style="background-color: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} Makalmy Stock. Tous droits réservés.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`L'email d'alerte pour ${product.nom_produit} a été envoyé avec succès !`);

        // Ethereal specific preview link
        if (nodemailer.getTestMessageUrl(info)) {
            console.log("Visualiser l'email de test ici : %s", nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email d'alerte :", error);
        throw error;
    }
};
