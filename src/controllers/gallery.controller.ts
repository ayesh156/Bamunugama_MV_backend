import { Request, Response, NextFunction } from 'express';
import {
  getAllGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  validateGalleryInput,
} from '../services/gallery.service';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IAuthRequest } from '../types';

export const getGallery = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const items = await getAllGalleryItems();

    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.GALLERY_FETCHED, data: items, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const createGallery = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const validation = validateGalleryInput(req.body);

    if (!validation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError({ message: RESPONSE_MESSAGES.VALIDATION_ERROR, errors: validation.errors, statusCode: HTTP_STATUS.BAD_REQUEST })
      );
      return;
    }

    const item = await createGalleryItem(validation.data!);
    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess({ message: RESPONSE_MESSAGES.GALLERY_CREATED, data: item, statusCode: HTTP_STATUS.CREATED })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const updateGallery = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const validation = validateGalleryInput(req.body);

    if (!validation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError({ message: RESPONSE_MESSAGES.VALIDATION_ERROR, errors: validation.errors, statusCode: HTTP_STATUS.BAD_REQUEST })
      );
      return;
    }

    const item = await updateGalleryItem(String(req.params.id), validation.data!);
    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: 'Gallery item updated successfully', data: item, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const deleteGallery = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteGalleryItem(String(req.params.id));
    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: 'Gallery item deleted successfully', data: result, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};
