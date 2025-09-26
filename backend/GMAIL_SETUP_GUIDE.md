# 📧 CONFIGURATION GMAIL POUR SOMBANGO - GUIDE COMPLET

## 🎯 Objectif
Envoyer réellement des emails de confirmation depuis `kelardmavoungou@gmail.com`

## 📋 PRÉREQUIS

### **1. Compte Gmail valide**
- ✅ Vous devez avoir accès à `kelardmavoungou@gmail.com`
- ✅ Le compte doit être actif et vérifié

### **2. Authentification à 2 facteurs activée**
- ✅ Nécessaire pour créer un mot de passe d'application
- ✅ Plus sécurisé pour votre compte

---

## 🚀 CONFIGURATION ÉTAPE PAR ÉTAPE

### **ÉTAPE 1 : Activer l'authentification à 2 facteurs**

1. **Allez sur** : https://myaccount.google.com/security
2. **Connectez-vous** avec `kelardmavoungou@gmail.com`
3. **Cliquez sur** "Vérification en 2 étapes"
4. **Suivez les instructions** pour l'activer :
   - Choisissez votre méthode (SMS, application, etc.)
   - Vérifiez avec le code reçu
   - Confirmez l'activation

### **ÉTAPE 2 : Générer le mot de passe d'application**

1. **Toujours dans** "Vérification en 2 étapes"
2. **Faites défiler** vers le bas
3. **Cliquez sur** "Mots de passe d'application"
4. **Sélectionnez** :
   - **Application** : "Autre (nom personnalisé)"
   - **Nom** : Tapez "SOMBANGO"
5. **Cliquez sur** "Générer"
6. **IMPORTANT** : Copiez immédiatement le mot de passe de 16 caractères
   ```
   Exemple : abcd 1234 efgh 5678
   À coller sans espaces : abcd1234efgh5678
   ```

### **ÉTAPE 3 : Configurer votre projet**

1. **Ouvrez** `backend/.env`
2. **Remplacez** la ligne EMAIL_PASS :
   ```env
   EMAIL_PASS=COLLEZ_VOTRE_MOT_DE_PASSE_ICI
   ```
   **Exemple** :
   ```env
   EMAIL_PASS=abcd1234efgh5678
   ```

### **ÉTAPE 4 : Redémarrer le serveur**

```bash
cd backend
npm start
```

---

## 🧪 TEST DE LA CONFIGURATION

### **Test rapide :**
```bash
cd backend
node test-email-send.js
```

### **Test complet :**
1. **Allez sur** `http://localhost:3000`
2. **Cliquez sur** "S'inscrire"
3. **Remplissez le formulaire** avec n'importe quel email
4. **Vérifiez** `kelardmavoungou@gmail.com` - vous recevrez l'email !

---

## 📧 RÉSULTAT ATTENDU

### **Email reçu dans votre boîte Gmail :**

```
📧 De: SOMBANGO <kelardmavoungou@gmail.com>
📌 Sujet: SOMBANGO - Confirmez votre adresse email

💌 Contenu:
Bienvenue sur SOMBANGO !

Pour finaliser votre inscription, cliquez sur le bouton ci-dessous :

[Confirmer mon email] (bouton orange)

Lien direct: http://localhost:3000/confirm-email?token=...&userId=...

Ce lien expire dans 24 heures.
```

---

## 🔧 DÉPANNAGE

### **Erreur "BadCredentials"**
```
Cause: Mot de passe d'application incorrect
Solution:
1. Retournez sur https://myaccount.google.com/security
2. Supprimez l'ancien mot de passe d'application
3. Créez-en un nouveau
4. Mettez à jour backend/.env
5. Redémarrez le serveur
```

### **Email dans les spams**
```
Solution:
1. Vérifiez le dossier "Spam" ou "Courrier indésirable"
2. Marquez l'email comme "Non spam"
3. Ajoutez noreply@sombango.com aux contacts
```

### **Erreur "Less secure app blocked"**
```
Cause: Gmail bloque les applications moins sécurisées
Solution:
1. Assurez-vous d'utiliser un mot de passe d'application
2. Vérifiez que l'authentification 2 facteurs est activée
3. Essayez avec SendGrid si le problème persiste
```

---

## 📊 LIMITES GMAIL

| Fonctionnalité | Limite Gmail |
|---------------|--------------|
| Emails/jour | 500 |
| Destinataires différents | 500/jour |
| Pièces jointes | 25MB |
| Taille email | 25MB |

**Pour plus de volume** : Utilisez SendGrid ou Mailgun

---

## 🎯 PROCHAINES ÉTAPES

### **Une fois Gmail configuré :**

1. ✅ **Testez l'inscription** avec différents emails
2. ✅ **Vérifiez la réception** des emails de confirmation
3. ✅ **Testez le clic** sur les liens de confirmation
4. ✅ **Vérifiez la redirection** vers la page de connexion

### **Pour la production :**
1. **Configurez un domaine personnalisé** (ex: confirmation@sombango.com)
2. **Utilisez SendGrid** pour plus de volume
3. **Ajoutez des templates** d'email avancés
4. **Configurez le suivi** des ouvertures/clicks

---

## 🚀 VOUS ÊTES PRÊT !

**Une fois ces étapes suivies, votre système SOMBANGO enverra réellement des emails de confirmation !**

### **Test final :**
1. **Inscrivez-vous** avec `test@example.com`
2. **Recevez l'email** dans `kelardmavoungou@gmail.com`
3. **Cliquez sur le lien** de confirmation
4. **Votre compte** est automatiquement vérifié !

**🎉 Félicitations ! Votre système d'authentification est maintenant complet !**