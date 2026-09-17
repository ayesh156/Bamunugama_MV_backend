import { prisma } from './prisma';

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();

    console.log('✅ MySQL database connected successfully');

    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      console.log('Prisma connection closed due to SIGINT');
      process.exit(0);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to connect to MySQL database:', message);
    process.exit(1);
  }
};