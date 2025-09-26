module.exports = {
  apps: [{
    name: 'sombango-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Configuration pour les variables d'environnement
    env_file: '.env',
    // Redémarrage automatique en cas de plantage
    restart_delay: 4000,
    // Configuration des clusters (pour plusieurs cœurs CPU)
    exec_mode: 'fork',
    // Configuration des logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};