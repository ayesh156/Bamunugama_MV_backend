import { prisma } from '../config/prisma';
import { Prisma } from '../generated/prisma/client';
import { IGalleryItem, IGalleryInput, IAppError } from '../types';
import { HTTP_STATUS } from '../config/constants';

/**
 * Get all gallery items, newest first.
 */
export const getAllGalleryItems = async (): Promise<IGalleryItem[]> => {
  const items = await prisma.gallery.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => ({
    _id: item.id,
    title: item.title,
    imageUrl: item.imageUrl,
    description: item.description ?? '',
    category: item.category ?? 'General',
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
};

/**
 * Create a new gallery item.
 */
export const createGalleryItem = async (input: IGalleryInput): Promise<IGalleryItem> => {
  const item = await prisma.gallery.create({
    data: {
      title: input.title.trim(),
      imageUrl: input.imageUrl.trim(),
      description: input.description?.trim() ?? '',
      category: input.category ?? 'General',
    },
  });

  return {
    _id: item.id,
    title: item.title,
    imageUrl: item.imageUrl,
    description: item.description ?? '',
    category: item.category ?? 'General',
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

/**
 * Delete a gallery item by id.
 */
export const updateGalleryItem = async (id: string, input: IGalleryInput): Promise<IGalleryItem> => {
  try {
    const item = await prisma.gallery.update({
      where: { id },
      data: {
        title: input.title.trim(),
        imageUrl: input.imageUrl.trim(),
        description: input.description?.trim() ?? '',
        category: input.category ?? 'General',
      },
    });

    return {
      _id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      description: item.description ?? '',
      category: item.category ?? 'General',
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Gallery item not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    throw error;
  }
};

export const deleteGalleryItem = async (id: string): Promise<{ success: boolean; id: string }> => {
  try {
    const item = await prisma.gallery.delete({
      where: { id },
    });

    return { success: true, id };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Gallery item not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    throw error;
  }
};

/**
 * Validate gallery input.
 */
export const validateGalleryInput = (
  input: unknown
): { isValid: boolean; errors: string[]; data?: IGalleryInput } => {
  const errors: string[] = [];
  const data = input as Record<string, unknown>;

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid input data'] };
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }

  if (!data.imageUrl || typeof data.imageUrl !== 'string' || data.imageUrl.trim() === '') {
    errors.push('imageUrl is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      title: (data.title as string).trim(),
      imageUrl: (data.imageUrl as string).trim(),
      description: data.description as string | undefined,
      category: data.category as string | undefined,
    },
  };
};