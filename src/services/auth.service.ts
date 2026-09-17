import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/passwordUtil';
import { generateAccessToken } from '../utils/tokenUtil';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IRegisterBody, ILoginBody, IAdminPayload, IAppError, AdminRole } from '../types';

export const registerAdmin = async (adminData: IRegisterBody) => {
  try {
    const { fullName, username, email, password } = adminData;

    const existingEmail = await prisma.admin.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const existingUsername = await prisma.admin.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.USERNAME_ALREADY_EXISTS);
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await prisma.admin.create({
      data: {
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin' as AdminRole,
        isActive: true,
      },
    });

    const adminPayload: IAdminPayload = {
      id: newAdmin.id,
      email: newAdmin.email,
      username: newAdmin.username,
      role: newAdmin.role as AdminRole,
      fullName: newAdmin.fullName,
    };

    const accessToken = generateAccessToken(adminPayload);

    return {
      admin: {
        id: newAdmin.id,
        fullName: newAdmin.fullName,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
      },
      accessToken,
    };
  } catch (error) {
    if ((error as IAppError).statusCode) throw error;

    // Prisma unique constraint violation (P2002) -> 409 Conflict
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || [];
      const field = target[0] || 'field';
      const err: IAppError = new Error(`${field} already exists`);
      err.statusCode = HTTP_STATUS.CONFLICT;
      throw err;
    }

    throw error;
  }
};

export const loginAdmin = async (loginData: ILoginBody) => {
  try {
    const { email, username, password } = loginData;

    // Build OR conditions only for provided identifiers (never include empty objects)
    const whereConditions: Record<string, string>[] = [];
    if (email) whereConditions.push({ email: email.toLowerCase() });
    else if (username) whereConditions.push({ username: username.toLowerCase() });

    const admin = await prisma.admin.findFirst({
      where: {
        OR: whereConditions,
      },
    });

    if (!admin) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    if (!admin.isActive) {
      const error: IAppError = new Error('Admin account is inactive');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const adminPayload: IAdminPayload = {
      id: updatedAdmin.id,
      email: updatedAdmin.email,
      username: updatedAdmin.username,
      role: updatedAdmin.role as AdminRole,
      fullName: updatedAdmin.fullName,
    };

    const accessToken = generateAccessToken(adminPayload);

    return {
      admin: {
        id: updatedAdmin.id,
        fullName: updatedAdmin.fullName,
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        isActive: updatedAdmin.isActive,
        lastLogin: updatedAdmin.lastLogin,
      },
      accessToken,
    };
  } catch (error) {
    if ((error as IAppError).statusCode) throw error;
    throw error;
  }
};

export const logoutAdmin = async (adminId: string) => {
  try {
    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { lastLogin: new Date() },
    });

    if (!admin) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.ADMIN_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return { success: true };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error(RESPONSE_MESSAGES.ADMIN_NOT_FOUND);
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    if ((error as IAppError).statusCode) throw error;
    throw error;
  }
};

export const getAdminProfile = async (adminId: string) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.ADMIN_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return {
      id: admin.id,
      fullName: admin.fullName,
      username: admin.username,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  } catch (error) {
    throw error;
  }
};
