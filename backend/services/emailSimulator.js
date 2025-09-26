// 📧 SIMULATEUR D'EMAIL POUR TESTS SOMBANGO
// Affiche les emails dans la console au lieu de les envoyer

const sendEmailConfirmation = async (email, confirmationToken, userId) => {
  const confirmationUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/confirm-email?token=${confirmationToken}&userId=${userId}`;

  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL DE CONFIRMATION SIMULÉ');
  console.log('='.repeat(80));
  console.log(`📨 Destinataire: ${email}`);
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`🏢 Expéditeur: SOMBANGO <noreply@sombango.com>`);
  console.log(`📌 Sujet: SOMBANGO - Confirmez votre adresse email`);
  console.log('');
  console.log('💌 CONTENU DE L\'EMAIL:');
  console.log('-'.repeat(40));
  console.log(`Bonjour,

Bienvenue sur SOMBANGO !

Pour finaliser votre inscription, cliquez sur le bouton ci-dessous :

🔗 LIEN DE CONFIRMATION:
${confirmationUrl}

Ou copiez-collez ce lien dans votre navigateur.

⚠️ Ce lien expire dans 24 heures.

Cordialement,
L'équipe SOMBANGO`);
  console.log('');
  console.log('🎯 POUR TESTER:');
  console.log(`1. Copiez ce lien: ${confirmationUrl}`);
  console.log('2. Collez-le dans votre navigateur');
  console.log('3. Votre compte sera automatiquement vérifié');
  console.log('='.repeat(80) + '\n');

  return { success: true, messageId: `simulated_${Date.now()}` };
};

// Fonction de compatibilité pour l'ancien système OTP
const sendOTPEmail = async (email, otp, type) => {
  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL OTP SIMULÉ (MODE TEST)');
  console.log('='.repeat(80));
  console.log(`📨 Destinataire: ${email}`);
  console.log(`🔢 Code OTP: ${otp}`);
  console.log(`📝 Type: ${type}`);
  console.log('');
  console.log('💡 EN MODE SIMULATION:');
  console.log('- Les emails ne sont pas réellement envoyés');
  console.log('- Utilisez le code ci-dessus pour les tests');
  console.log('- Configurez SendGrid pour les vrais emails');
  console.log('='.repeat(80) + '\n');

  return { success: true, messageId: `simulated_otp_${Date.now()}` };
};

// Simuler l'envoi d'email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  console.log('\n' + '='.repeat(80));
  console.log('🔐 EMAIL DE RÉINITIALISATION DE MOT DE PASSE SIMULÉ');
  console.log('='.repeat(80));
  console.log(`📨 Destinataire: ${email}`);
  console.log(`👤 Utilisateur: ${userName}`);
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`🏢 Expéditeur: SOMBANGO <noreply@sombango.com>`);
  console.log(`📌 Sujet: SOMBANGO - Réinitialisation de votre mot de passe`);
  console.log('');
  console.log('💌 CONTENU DE L\'EMAIL:');
  console.log('-'.repeat(40));
  console.log(`Bonjour ${userName},

Vous avez demandé la réinitialisation de votre mot de passe SOMBANGO.

🔗 LIEN DE RÉINITIALISATION:
${resetUrl}

Ou cliquez sur le bouton ci-dessous :

[Bouton: Réinitialiser mon mot de passe]

⚠️ Ce lien expire dans 24 heures pour des raisons de sécurité.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe SOMBANGO`);
  console.log('');
  console.log('🎯 POUR TESTER LA RÉINITIALISATION:');
  console.log(`1. Copiez ce lien: ${resetUrl}`);
  console.log('2. Collez-le dans votre navigateur');
  console.log('3. Vous serez redirigé vers la page de nouveau mot de passe');
  console.log('='.repeat(80) + '\n');

  return { success: true, messageId: `simulated_reset_${Date.now()}` };
};

module.exports = {
  sendEmailConfirmation,
  sendOTPEmail,
  sendPasswordResetEmail
};