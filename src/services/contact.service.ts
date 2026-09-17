import { prisma } from '../config/prisma';
import { Prisma } from '../generated/prisma/client';
import { IContactCard, IContactCardInput, IAppError } from '../types';
import { HTTP_STATUS } from '../config/constants';

const VALID_ICONS = ['MapPin', 'GraduationCap', 'Shield', 'Calendar', 'Award', 'Phone', 'Mail'];

/**
 * Get all contact cards, ordered by `order` then `createdAt`.
 */
export const getAllContactCards = async (): Promise<IContactCard[]> => {
  const cards = await prisma.contactCard.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return cards.map((card) => ({
    _id: card.id,
    title: card.title,
    value: card.value,
    icon: card.icon,
    order: card.order,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  }));
};

/**
 * Create a new contact info card.
 */
export const createContactCard = async (input: IContactCardInput): Promise<IContactCard> => {
  const icon = input.icon && VALID_ICONS.includes(input.icon) ? input.icon : 'MapPin';
  const card = await prisma.contactCard.create({
    data: {
      title: input.title.trim(),
      value: input.value.trim(),
      icon,
      order: input.order ?? 0,
    },
  });

  return {
    _id: card.id,
    title: card.title,
    value: card.value,
    icon: card.icon,
    order: card.order,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
};

/**
 * Update an existing contact info card.
 */
export const updateContactCard = async (id: string, input: IContactCardInput): Promise<IContactCard> => {
  try {
    const icon = input.icon && VALID_ICONS.includes(input.icon) ? input.icon : 'MapPin';
    const card = await prisma.contactCard.update({
      where: { id },
      data: {
        title: input.title.trim(),
        value: input.value.trim(),
        icon,
        order: input.order ?? 0,
      },
    });

    return {
      _id: card.id,
      title: card.title,
      value: card.value,
      icon: card.icon,
      order: card.order,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Contact card not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }
    throw error;
  }
};

/**
 * Delete a contact info card by id.
 */
export const deleteContactCard = async (id: string): Promise<{ success: boolean; id: string }> => {
  try {
    await prisma.contactCard.delete({ where: { id } });
    return { success: true, id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Contact card not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }
    throw error;
  }
};

/**
 * Validate contact card input.
 */
export const validateContactCardInput = (
  input: unknown
): { isValid: boolean; errors: string[]; data?: IContactCardInput } => {
  const errors: string[] = [];
  const data = input as Record<string, unknown>;

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid input data'] };
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }

  if (!data.value || typeof data.value !== 'string' || data.value.trim() === '') {
    errors.push('value is required and must be a non-empty string');
  }

  if (data.icon !== undefined && data.icon !== null && data.icon !== '') {
    if (typeof data.icon !== 'string' || !VALID_ICONS.includes(data.icon)) {
      errors.push(`icon must be one of: ${VALID_ICONS.join(', ')}`);
    }
  }

  if (data.order !== undefined && data.order !== null) {
    const orderNumber = Number(data.order);
    if (!Number.isFinite(orderNumber) || orderNumber < 0) {
      errors.push('order must be a non-negative number');
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      title: (data.title as string).trim(),
      value: (data.value as string).trim(),
      icon: (data.icon as string | undefined) ?? 'MapPin',
      order: data.order !== undefined && data.order !== null ? Number(data.order) : 0,
    },
  };
};