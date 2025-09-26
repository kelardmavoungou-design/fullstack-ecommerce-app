const nodemailer = require('nodemailer');
const twilio = require('twilio');
const emailSimulator = require('./emailSimulator');

// Détection automatique du mode email
const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return user && pass &&
         !user.includes('your_') &&
         !user.includes('example') &&
         !user.includes('here') &&
         !pass.includes('your_') &&
         !pass.includes('here') &&
         pass.length > 10; // Mot de passe d'au moins 10 caractères
};

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Twilio client configuration
const createTwilioClient = () => {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

// Send email confirmation link (avec simulation automatique)
const sendEmailConfirmation = async (email, confirmationToken, userId) => {
  // Utiliser le simulateur si les vrais credentials ne sont pas configurés
  if (!isEmailConfigured()) {
    console.log('\n🔧 MODE SIMULATION DÉTECTÉ - Email affiché dans les logs\n');
    return await emailSimulator.sendEmailConfirmation(email, confirmationToken, userId);
  }

  try {
    const transporter = createEmailTransporter();

    const confirmationUrl = `${process.env.BACKEND_URL}/api/auth/confirm-email?token=${confirmationToken}&userId=${userId}`;

    const subject = 'SOMBANGO - Confirmez votre adresse email';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #003333; margin: 0;">SOMBANGO</h1>
          <p style="color: #FF6600; margin: 5px 0;">Votre plateforme de vente en ligne</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Bienvenue sur SOMBANGO !</h2>
          <p style="color: #555; margin-bottom: 20px;">Merci de vous être inscrit. Pour finaliser votre inscription et accéder à votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" style="background-color: #FF6600; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Confirmer mon email</a>
          </div>
          <p style="color: #555; font-size: 14px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="color: #003333; font-size: 12px; word-break: break-all;">${confirmationUrl}</p>
          <p style="color: #555;">Ce lien expire dans 24 heures.</p>
        </div>
        <div style="text-align: center; color: #777; font-size: 12px; margin-top: 20px;">
          <p>Si vous n'avez pas créé de compte SOMBANGO, ignorez cet email.</p>
          <p>Cet e-mail a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p>© 2023 SOMBANGO. Tous droits réservés.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"SOMBANGO" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log('✅ Email de confirmation envoyé réellement: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur d\'envoi de l\'email de confirmation:', error);
    // Fallback vers le simulateur en cas d'erreur
    console.log('🔄 Basculement vers le mode simulation...');
    return await emailSimulator.sendEmailConfirmation(email, confirmationToken, userId);
  }
};

// Send OTP via email (legacy - kept for backward compatibility)
const sendOTPEmail = async (email, otp, type) => {
  // Utiliser le simulateur si les vrais credentials ne sont pas configurés
  if (!isEmailConfigured()) {
    console.log('\n🔧 MODE SIMULATION DÉTECTÉ - OTP affiché dans les logs\n');
    return await emailSimulator.sendOTPEmail(email, otp, type);
  }

  try {
    const transporter = createEmailTransporter();

    let subject, html;

    if (type === 'registration') {
      subject = 'SOMBANGO - Code de vérification';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #003333; margin: 0;">SOMBANGO</h1>
            <p style="color: #FF6600; margin: 5px 0;">Votre plateforme de vente en ligne</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Code de vérification</h2>
            <p style="color: #555; margin-bottom: 20px;">Merci de vous être inscrit sur SOMBANGO. Veuillez utiliser le code ci-dessous pour vérifier votre adresse e-mail :</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #003333; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</span>
            </div>
            <p style="color: #555;">Ce code expire dans 15 minutes.</p>
          </div>
          <div style="text-align: center; color: #777; font-size: 12px; margin-top: 20px;">
            <p>Cet e-mail a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2023 SOMBANGO. Tous droits réservés.</p>
          </div>
        </div>
      `;
    } else if (type === 'login') {
      subject = 'SOMBANGO - Code de connexion';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #003333; margin: 0;">SOMBANGO</h1>
            <p style="color: #FF6600; margin: 5px 0;">Votre plateforme de vente en ligne</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Code de connexion</h2>
            <p style="color: #555; margin-bottom: 20px;">Vous avez demandé un code de connexion pour votre compte SOMBANGO. Veuillez utiliser le code ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #003333; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</span>
            </div>
            <p style="color: #555;">Ce code expire dans 15 minutes.</p>
          </div>
          <div style="text-align: center; color: #777; font-size: 12px; margin-top: 20px;">
            <p>Cet e-mail a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2023 SOMBANGO. Tous droits réservés.</p>
          </div>
        </div>
      `;
    } else if (type === 'recovery') {
      subject = 'SOMBANGO - Réinitialisation de mot de passe';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #003333; margin: 0;">SOMBANGO</h1>
            <p style="color: #FF6600; margin: 5px 0;">Votre plateforme de vente en ligne</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Réinitialisation de mot de passe</h2>
            <p style="color: #555; margin-bottom: 20px;">Vous avez demandé une réinitialisation de mot de passe pour votre compte SOMBANGO. Veuillez utiliser le code ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #003333; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</span>
            </div>
            <p style="color: #555;">Ce code expire dans 15 minutes.</p>
          </div>
          <div style="text-align: center; color: #777; font-size: 12px; margin-top: 20px;">
            <p>Cet e-mail a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2023 SOMBANGO. Tous droits réservés.</p>
          </div>
        </div>
      `;
    }

    const info = await transporter.sendMail({
      from: `"SOMBANGO" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log('✅ Email OTP envoyé réellement: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur d\'envoi de l\'OTP par email:', error);
    // Fallback vers le simulateur en cas d'erreur
    console.log('🔄 Basculement vers le mode simulation...');
    return await emailSimulator.sendOTPEmail(email, otp, type);
  }
};

// Envoyer l'OTP par SMS
const sendOTPSMS = async (phoneNumber, otp, type) => {
  try {
    const client = createTwilioClient();
    
    let message;
    
    if (type === 'registration') {
      message = `SOMBANGO - Votre code de vérification est: ${otp}. Ce code expire dans 15 minutes. Merci de ne pas partager ce code.`;
    } else if (type === 'login') {
      message = `SOMBANGO - Votre code de connexion est: ${otp}. Ce code expire dans 15 minutes. Merci de ne pas partager ce code.`;
    } else if (type === 'recovery') {
      message = `SOMBANGO - Votre code de réinitialisation de mot de passe est: ${otp}. Ce code expire dans 15 minutes. Merci de ne pas partager ce code.`;
    }

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log('SMS envoyé: %s', sms.sid);
    return { success: true, messageId: sms.sid };
  } catch (error) {
    console.error('Erreur d\'envoi de l\'OTP par SMS:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email with link
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  // Utiliser le simulateur si les vrais credentials ne sont pas configurés
  if (!isEmailConfigured()) {
    console.log('\n🔧 MODE SIMULATION DÉTECTÉ - Email de réinitialisation affiché dans les logs\n');
    return await emailSimulator.sendPasswordResetEmail(email, resetToken, userName);
  }

  try {
    const transporter = createEmailTransporter();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const subject = 'SOMBANGO - Réinitialisation de votre mot de passe';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #003333; margin: 0;">SOMBANGO</h1>
          <p style="color: #FF6600; margin: 5px 0;">Votre plateforme de vente en ligne</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Réinitialisation de mot de passe</h2>
          <p style="color: #555; margin-bottom: 20px;">Bonjour ${userName},</p>
          <p style="color: #555; margin-bottom: 20px;">Vous avez demandé la réinitialisation de votre mot de passe SOMBANGO. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #FF6600; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color: #555; font-size: 14px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="color: #003333; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #555;">Ce lien expire dans 24 heures pour des raisons de sécurité.</p>
          <p style="color: #555; font-size: 14px;"><strong>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</strong></p>
        </div>
        <div style="text-align: center; color: #777; font-size: 12px; margin-top: 20px;">
          <p>Cet e-mail a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p>© 2023 SOMBANGO. Tous droits réservés.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"SOMBANGO" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log('✅ Email de réinitialisation de mot de passe envoyé réellement: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur d\'envoi de l\'email de réinitialisation:', error);
    console.error('Détails de l\'erreur:', error.message);
    console.error('Code d\'erreur:', error.code);
    // Temporarily disable fallback to see actual errors
    // return await emailSimulator.sendPasswordResetEmail(email, resetToken, userName);
    throw error; // Throw the error instead of falling back
  }
};

// Envoyer le code de livraison par SMS
const sendDeliveryCodeSMS = async (phoneNumber, deliveryCode, orderDetails) => {
  try {
    const client = createTwilioClient();

    const message = `SOMBANGO - Votre commande #${orderDetails.id} est prête pour la livraison. Votre code de validation est: ${deliveryCode}. Merci de le présenter au livreur.`;

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log('SMS de code de livraison envoyé: %s', sms.sid);
    return { success: true, messageId: sms.sid };
  } catch (error) {
    console.error('Erreur d\'envoi du code de livraison par SMS:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmailConfirmation,
  sendOTPEmail,
  sendOTPSMS,
  sendPasswordResetEmail,
  sendDeliveryCodeSMS
};