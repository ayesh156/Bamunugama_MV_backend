import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is not defined in the environment variables');
}

// 🔑 .env එකේ ඇති DATABASE_URL එකෙන් config එක dynamically extract කරගැනීම
const parsedUrl = new URL(process.env.DATABASE_URL);

// 🔌 MariaDB Connection Pool - VPS Resource Management
const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname,
  port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: parsedUrl.pathname.replace(/^\//, '').split('?')[0], // query params (?allowPublicKeyRetrieval=...) ඉවත් කර database name එක පමණක් ලබා ගනී
  connectionLimit: 5,   // Pool එකට max connections 5ක් (Contabo VPS RAM/CPU stability සඳහා)
  connectTimeout: 5000, // 5s connection timeout (deadlocks වැළැක්වීමට)
  idleTimeout: 60,      // 60s idle timeout
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ MariaDB Driver Adapter connected successfully (Max pool: 5)');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export default prisma;