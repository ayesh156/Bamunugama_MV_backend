/**
 * Idempotent Admin Seeder
 * Creates the default admin account if it doesn't already exist.
 * Safe to run multiple times — will never overwrite an existing admin.
 *
 * Usage: npm run seed:admin
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

const DEFAULT_ADMIN = {
  fullName: 'Super Admin',
  username: 'admin',
  email: 'admin@school.com',
  password: 'admin123',
  role: 'super_admin' as const,
  isActive: true,
};

async function seedAdmin(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Connected to MySQL database');

    const existing = await prisma.admin.findFirst({
      where: { email: DEFAULT_ADMIN.email },
    });

    if (existing) {
      console.log(`ℹ️  Admin already exists: ${DEFAULT_ADMIN.email} — skipping creation.`);
    } else {
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, BCRYPT_ROUNDS);

      await prisma.admin.create({
        data: {
          fullName: DEFAULT_ADMIN.fullName,
          username: DEFAULT_ADMIN.username,
          email: DEFAULT_ADMIN.email,
          password: hashedPassword,
          role: DEFAULT_ADMIN.role,
          isActive: DEFAULT_ADMIN.isActive,
        },
      });

      console.log('✅ Default admin created successfully.');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Email:    ', DEFAULT_ADMIN.email);
      console.log('  Password: ', DEFAULT_ADMIN.password);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    await prisma.$disconnect();
    console.log('🔌 Disconnected from MySQL database.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedAdmin();