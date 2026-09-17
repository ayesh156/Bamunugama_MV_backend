import { prisma } from '../config/prisma';
import { Prisma } from '../generated/prisma/client';
import { IVideoItem, IVideoInput, IAppError } from '../types';
import { HTTP_STATUS } from '../config/constants';

/**
 * Get all video items, newest first.
 */
export const getAllVideos = async (): Promise<IVideoItem[]> => {
  const items = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => ({
    _id: item.id,
    title: item.title,
    videoUrl: item.videoUrl,
    description: item.description ?? '',
    thumbnailUrl: item.thumbnailUrl ?? '',
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
};

/**
 * Create a new video item.
 */
export const createVideo = async (input: IVideoInput): Promise<IVideoItem> => {
  const item = await prisma.video.create({
    data: {
      title: input.title.trim(),
      videoUrl: input.videoUrl.trim(),
      description: input.description?.trim() ?? '',
      thumbnailUrl: input.thumbnailUrl?.trim() ?? '',
    },
  });

  return {
    _id: item.id,
    title: item.title,
    videoUrl: item.videoUrl,
    description: item.description ?? '',
    thumbnailUrl: item.thumbnailUrl ?? '',
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

/**
 * Delete a video item by id.
 */
export const updateVideo = async (id: string, input: IVideoInput): Promise<IVideoItem> => {
  try {
    const item = await prisma.video.update({
      where: { id },
      data: {
        title: input.title.trim(),
        videoUrl: input.videoUrl.trim(),
        description: input.description?.trim() ?? '',
        thumbnailUrl: input.thumbnailUrl?.trim() ?? '',
      },
    });

    return {
      _id: item.id,
      title: item.title,
      videoUrl: item.videoUrl,
      description: item.description ?? '',
      thumbnailUrl: item.thumbnailUrl ?? '',
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Video not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    throw error;
  }
};

export const deleteVideoItem = async (id: string): Promise<{ success: boolean; id: string }> => {
  try {
    const item = await prisma.video.delete({
      where: { id },
    });

    return { success: true, id };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Video not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    throw error;
  }
};

/**
 * Validate video input.
 */
export const validateVideoInput = (
  input: unknown
): { isValid: boolean; errors: string[]; data?: IVideoInput } => {
  const errors: string[] = [];
  const data = input as Record<string, unknown>;

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid input data'] };
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }

  if (!data.videoUrl || typeof data.videoUrl !== 'string' || data.videoUrl.trim() === '') {
    errors.push('videoUrl is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      title: (data.title as string).trim(),
      videoUrl: (data.videoUrl as string).trim(),
      description: data.description as string | undefined,
      thumbnailUrl: data.thumbnailUrl as string | undefined,
    },
  };
};