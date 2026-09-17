import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { IContactMessage, IContactMessageInput, IAppError } from '../types';
import { HTTP_STATUS } from '../config/constants';

/**
 * Save a new contact message (public submission).
 */
export const createContactMessage = async (input: IContactMessageInput): Promise<IContactMessage> => {
  const message = await prisma.contactMessage.create({
    data: {
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() ?? '',
      subject: input.subject?.trim() || 'General Inquiry',
      message: input.message.trim(),
    },
  });

  return {
    _id: message.id,
    fullName: message.fullName,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString(),
  };
};

/**
 * Get all contact messages, newest first.
 */
export const getAllContactMessages = async (): Promise<IContactMessage[]> => {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return messages.map((m) => ({
    _id: m.id,
    fullName: m.fullName,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  }));
};

/**
 * Mark a contact message as read.
 */
export const markMessageAsRead = async (id: string, isRead = true): Promise<IContactMessage> => {
  try {
    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead },
    });

    return {
      _id: message.id,
      fullName: message.fullName,
      email: message.email,
      phone: message.phone,
      subject: message.subject,
      message: message.message,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Message not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }
    throw error;
  }
};

/**
 * Delete a contact message by id.
 */
export const deleteContactMessage = async (id: string): Promise<{ success: boolean; id: string }> => {
  try {
    await prisma.contactMessage.delete({ where: { id } });
    return { success: true, id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Message not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }
    throw error;
  }
};

/**
 * Validate contact message input.
 */
export const validateContactMessageInput = (
  input: unknown
): { isValid: boolean; errors: string[]; data?: IContactMessageInput } => {
  const errors: string[] = [];
  const data = input as Record<string, unknown>;

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid input data'] };
  }

  if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim() === '') {
    errors.push('fullName is required and must be a non-empty string');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('email is required and must be a non-empty string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email as string).trim())) {
    errors.push('email must be a valid email address');
  }

  if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') {
    errors.push('message is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      fullName: (data.fullName as string).trim(),
      email: (data.email as string).trim(),
      phone: data.phone as string | undefined,
      subject: data.subject as string | undefined,
      message: (data.message as string).trim(),
    },
  };
};
