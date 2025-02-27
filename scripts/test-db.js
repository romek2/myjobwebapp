// test-db.js
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Testing database connection...');
  const prisma = new PrismaClient({ log: ['query', 'error', 'info', 'warn'] });
  
  try {
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        subscriptionStatus: 'FREE'
      }
    });
    
    console.log('Created test user:', testUser);
    
    // List all users
    const allUsers = await prisma.user.findMany();
    console.log('All users in database:', allUsers);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();