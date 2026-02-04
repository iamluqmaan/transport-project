
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Connecting to database...');
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users.`);
    
    const companyCount = await prisma.transportCompany.count();
    console.log(`Found ${companyCount} transport companies.`);

    const routeCount = await prisma.route.count();
    console.log(`Found ${routeCount} routes.`);

  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
