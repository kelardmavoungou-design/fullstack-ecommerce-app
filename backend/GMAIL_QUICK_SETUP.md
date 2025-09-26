# ⚡ CONFIGURATION RAPIDE GMAIL POUR SOMBANGO

## 🎯 Objectif
Envoyer réellement les emails de confirmation à `kelardmavoungou@gmail.com`

## 📋 Étapes à suivre (3 minutes)

### 1. Activer l'authentification 2 facteurs
1. Allez sur https://myaccount.google.com/security
2. Cliquez sur "Vérification en 2 étapes"
3. Activez-la avec votre téléphone

### 2. Générer le mot de passe d'application
1. Toujours dans "Vérification en 2 étapes"
2. Descendez et cliquez sur **"Mots de passe d'application"**
3. Sélectionnez **"Autre (nom personnalisé)"**
4. Tapez **"SOMBANGO"**
5. Copiez le mot de passe de 16 caractères (sans espaces)

### 3. Configurer votre .env
Remplacez dans `backend/.env` :
```env
EMAIL_USER=kelardmavoungou@gmail.com
EMAIL_PASS=COLLEZ_VOTRE_MOT_DE_PASSE_ICI
```

### 4. Redémarrer le serveur
```bash
cd backend
npm start
```

## ✅ Test rapide
```bash
cd backend
node test-email-send.js
```

## 📧 Résultat attendu
Vous recevrez un email de confirmation à `kelardmavoungou@gmail.com` avec :
- Logo SOMBANGO
- Bouton "Confirmer mon email"
- Lien sécurisé de confirmation

## 🔍 Dépannage
- **Erreur "BadCredentials"** : Vérifiez le mot de passe d'application
- **Email dans spam** : Vérifiez le dossier spam Gmail
- **Pas d'email** : Attendez 2-3 minutes

## 🚀 Prêt à tester !
Une fois configuré, vos utilisateurs recevront réellement leurs emails de confirmation !