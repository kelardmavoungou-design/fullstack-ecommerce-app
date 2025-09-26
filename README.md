# SOMBAGO - Marketplace E-commerce

Une plateforme e-commerce complète avec système de livraison intégré, dashboard d'administration avancé, et notifications temps réel.

## 🚀 Fonctionnalités

### 👥 Utilisateurs
- **Acheteurs** : Navigation, achats, suivi de commandes
- **Vendeurs** : Gestion de boutiques, produits, commandes
- **Livreurs** : Collecte et livraison avec suivi GPS
- **Administrateurs** : Gestion complète de la plateforme

### 📦 Gestion des Livraisons
- **Assignation automatique** des livreurs aux commandes
- **Collecte multi-produits** avec progression temps réel
- **Suivi GPS** en temps réel
- **Validation QR code** à la livraison
- **Dashboard admin** pour gestion des missions

### 🔔 Notifications Temps Réel
- **WebSocket** pour communications instantanées
- **Notifications admin** quand livreurs collectent des produits
- **Alertes** pour changements de statut de livraison
- **Mises à jour live** du dashboard

### 💳 Paiements
- **MTN Mobile Money** et **Airtel Money**
- **Transferts directs** vendeur ↔ acheteur
- **Retraits sécurisés** vers comptes bancaires
- **Commission système** automatisé

### 📊 Dashboard Admin
- **Statistiques temps réel** de la plateforme
- **Gestion des utilisateurs** et boutiques
- **Validation des campagnes** publicitaires
- **Résolution des litiges**
- **Assignation des livraisons** aux livreurs

## 🛠️ Technologies

### Backend
- **Node.js** avec Express.js
- **Prisma ORM** avec MySQL
- **Socket.io** pour WebSocket
- **JWT** pour authentification
- **Multer** pour upload de fichiers

### Frontend
- **React** avec TypeScript
- **Vite** pour le build
- **Tailwind CSS** pour le styling
- **React Router** pour la navigation
- **Leaflet** pour les cartes

### Base de Données
- **MySQL** avec Prisma
- **Redis** pour le cache (optionnel)

## 📁 Structure du Projet

```
efg/
├── backend/                 # API Node.js
│   ├── controllers/         # Logique métier
│   ├── routes/             # Routes API
│   ├── services/           # Services métier
│   ├── middleware/         # Middleware Express
│   ├── prisma/             # Schéma base de données
│   └── uploads/            # Fichiers uploadés
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── services/      # Services API
│   │   └── utils/         # Utilitaires
│   └── build/             # Build de production
└── base de données/       # Scripts SQL
```

## 🚀 Installation

### Prérequis
- Node.js 18+
- MySQL 8.0+
- Git

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement
npm run prisma:generate
npm run prisma:migrate
npm start
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Configurer les variables d'environnement
npm run dev
```

## 🔧 Configuration

### Variables d'Environnement Backend
```env
DATABASE_URL="mysql://user:password@localhost:3306/sombago"
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:5173"
MTN_API_KEY="your-mtn-api-key"
MTN_API_SECRET="your-mtn-api-secret"
```

### Variables d'Environnement Frontend
```env
VITE_API_URL="http://localhost:4000"
VITE_FRONTEND_URL="http://localhost:5173"
```

## 📊 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/verify-otp` - Vérification OTP

### Administration
- `GET /api/admin/dashboard` - Statistiques dashboard
- `GET /api/admin/deliveries` - Liste des livraisons
- `PUT /api/admin/deliveries/:id/assign` - Assigner une livraison
- `GET /api/admin/delivery-personnel` - Liste des livreurs

### Livraisons
- `GET /api/delivery/assigned` - Livraisons assignées
- `PUT /api/delivery/status` - Mettre à jour statut

## 🎯 Utilisation

### Pour les Admins
1. Se connecter avec un compte superadmin
2. Accéder au dashboard admin
3. Onglet "Livraisons" pour gérer les missions
4. Recevoir des notifications temps réel des collectes

### Pour les Livreurs
1. Se connecter avec un compte delivery
2. Voir les livraisons assignées
3. Collecter les produits dans l'ordre
4. Scanner le QR code à la livraison

### Pour les Vendeurs
1. Créer une boutique
2. Ajouter des produits
3. Gérer les commandes
4. Recevoir les paiements automatiquement

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📧 Contact

**Kelard Mavoungou** - kelardmavoungou@gmail.com

Lien du projet: [https://github.com/kelardmavoungou/sombago](https://github.com/kelardmavoungou/sombago)