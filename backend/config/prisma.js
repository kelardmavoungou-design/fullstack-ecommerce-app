const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Test the connection
prisma.$connect()
  .then(() => {
    console.log('Connected to MySQL database with Prisma');
  })
  .catch((error) => {
    console.error('Error connecting to MySQL database with Prisma:', error);
  });

module.exports = prisma;