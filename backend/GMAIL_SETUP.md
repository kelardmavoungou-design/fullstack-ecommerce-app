# Configuration Gmail SMTP pour SOMBANGO

## Instructions pour configurer Gmail SMTP

### 1. Activer l'authentification à 2 facteurs sur votre compte Gmail
1. Allez sur https://myaccount.google.com/security
2. Dans la section "Connexion à Google", cliquez sur "Vérification en 2 étapes"
3. Suivez les instructions pour activer la vérification en 2 étapes

### 2. Générer un mot de passe d'application
1. Toujours dans "Vérification en 2 étapes", faites défiler vers le bas
2. Cliquez sur "Mots de passe d'application"
3. Sélectionnez "Autre (nom personnalisé)" et entrez "SOMBANGO"
4. Copiez le mot de passe généré (16 caractères sans espaces)

### 3. Configurer les variables d'environnement
Modifiez le fichier `backend/.env` avec vos vraies informations Gmail :

```env
# Email Configuration (Gmail SMTP for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email_gmail@gmail.com
EMAIL_PASS=votre_mot_de_passe_application_gmail
```

**Remplacez :**
- `votre_email_gmail@gmail.com` par votre adresse Gmail réelle
- `votre_mot_de_passe_application_gmail` par le mot de passe d'application généré

### 4. Redémarrer le serveur
Après avoir configuré les variables d'environnement :
```bash
cd backend
npm start
```

### 5. Tester l'envoi d'email
Testez l'inscription d'un nouvel utilisateur pour vérifier que les emails OTP sont envoyés.

## ⚠️ Important
- **Ne partagez jamais votre mot de passe d'application**
- **Le mot de passe d'application est différent de votre mot de passe Gmail normal**
- **Conservez ce mot de passe en lieu sûr**

## 🔧 Configuration alternative (OAuth2)
Si vous préférez utiliser OAuth2 au lieu des mots de passe d'application, consultez la documentation Nodemailer pour Gmail OAuth2.

## 📧 Dépannage
- **Erreur "Application bloquée"** : Activez l'accès des applications moins sécurisées ou utilisez un mot de passe d'application
- **Erreur "Authentification échouée"** : Vérifiez que le mot de passe d'application est correct
- **Emails dans les spams** : Vérifiez le dossier spam de Gmail