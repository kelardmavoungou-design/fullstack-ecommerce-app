// Server restart trigger
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// WebSocket service
const { initializeWebSocket } = require('./services/websocketService');

// Initialize Passport
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const adCampaignRoutes = require('./routes/adCampaignRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const productsRoutes = require('./routes/productsRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize WebSocket
initializeWebSocket(server);

 // Middleware de sécurité
app.use(helmet());

// Cookie parser middleware
app.use(cookieParser());

// Limitation de débit
 //const limiter = rateLimit({
  //windowMs: 15 * 60 * 1000, // 15 minutes
  //max: 100, // limiter chaque IP à 100 requêtes par windowMs
 // message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
//});
//app.use(limiter);

// Configuration CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // React dev server
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://localhost:4000'  // Backend itself
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Session middleware (requis pour Passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware d'analyse du corps de la requête
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Créer le dossier s'il n'existe pas
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, 'uploads', 'campaigns');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'campaign_' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter seulement les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Fichiers statiques avec headers CORS appropriés
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
app.use('/uploads/logos', express.static(path.join(__dirname, 'uploads/logos'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads/products'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
app.use('/uploads/campaigns', express.static(path.join(__dirname, 'uploads/campaigns'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SOMBANGO',
      version: '1.0.0',
      description: 'Documentation de l\'API pour la plateforme e-commerce SOMBANGO',
      contact: {
        name: 'Support API',
        email: 'support@sombango.com'
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Serveur de développement'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Points de terminaison d\'authentification utilisateur'
      },
      {
        name: 'Buyer',
        description: 'Points de terminaison de fonctionnalité acheteur'
      },
      {
        name: 'Seller Shops',
        description: 'Points de terminaison de gestion de boutique vendeur'
      },
      {
        name: 'Seller Products',
        description: 'Points de terminaison de gestion de produit vendeur'
      },
      {
        name: 'Seller Orders',
        description: 'Points de terminaison de gestion de commande vendeur'
      },
      {
        name: 'Seller Stats',
        description: 'Points de terminaison de statistiques vendeur'
      },
      {
        name: 'Seller Categories',
        description: 'Points de terminaison de gestion de catégorie vendeur'
      },
      {
        name: 'Seller Ads',
        description: 'Points de terminaison de gestion d\'annonce vendeur'
      },
      {
        name: 'Ads',
        description: 'Points de terminaison d\'annonce'
      },
      {
        name: 'Advertising',
        description: 'Points de terminaison de gestion des campagnes publicitaires'
      },
      {
        name: 'Admin Ads',
        description: 'Points de terminaison de gestion d\'annonce administrateur'
      },
      {
        name: 'Admin Dashboard',
        description: 'Points de terminaison du tableau de bord administrateur'
      },
      {
        name: 'Admin Users',
        description: 'Points de terminaison de gestion d\'utilisateur administrateur'
      },
      {
        name: 'Admin Shops',
        description: 'Points de terminaison de gestion de boutique administrateur'
      },
      {
        name: 'Admin Reports',
        description: 'Points de terminaison de gestion de rapport administrateur'
      },
      {
        name: 'Admin Platform Stats',
        description: 'Points de terminaison de statistiques de plateforme administrateur'
      },
      {
        name: 'Products',
        description: 'Points de terminaison de produit'
      },
      {
        name: 'Orders',
        description: 'Points de terminaison de commande'
      },
      {
        name: 'Wishlist',
        description: 'Points de terminaison de liste de souhaits'
      },
      {
        name: 'Reviews',
        description: 'Points de terminaison d\'avis'
      },
      {
        name: 'Payments',
        description: 'Points de terminaison de paiement'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Point de terminaison de vérification de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'L\'API SOMBANGO est en cours d\'exécution' });
});

// Test route for debugging
app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.status(200).json({ message: 'Test route working' });
});

// Routes API - Try mounting ad-campaigns routes last
console.log('Mounting routes...');
app.use('/api', publicRoutes);
console.log('Public routes mounted');
app.use('/api/auth', authRoutes);
console.log('Auth routes mounted');
app.use('/api', buyerRoutes);
console.log('Buyer routes mounted');
app.use('/api', sellerRoutes);
console.log('Seller routes mounted');
app.use('/api/products', productsRoutes);
console.log('Products routes mounted');
app.use('/api', adminRoutes);
console.log('Admin routes mounted');
app.use('/api', paymentRoutes);
console.log('Payment routes mounted');
app.use('/api/delivery', deliveryRoutes);
console.log('Delivery routes mounted');

// Mount ad-campaigns routes last to avoid conflicts
app.use('/api/ad-campaigns', adCampaignRoutes);
console.log('Ad campaign routes mounted');

// Test route to isolate the issue
app.get('/api/test-ad-serve', (req, res) => {
  console.log('Test ad serve route hit directly');
  res.json({
    ad: {
      id: 1,
      title: 'Test Ad from server.js',
      content: 'This is a test advertisement from server.js',
      image: null,
      target_url: 'http://localhost:5173'
    }
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur s\'est produite !' });
});

// Gestionnaire 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
  console.log(`Documentation API disponible à http://localhost:${PORT}/api-docs`);
  console.log(`WebSocket server actif sur le port ${PORT}`);
});

//adding
app.get('/', (req, res) => {
  res.send('<a href="/auth/google"Authenticate with Google</a>' );
});