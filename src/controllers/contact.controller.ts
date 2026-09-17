import { Request, Response, NextFunction } from 'express';
import {
  getAllContactCards,
  createContactCard,
  updateContactCard,
  deleteContactCard,
  validateContactCardInput,
} from '../services/contact.service';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IAuthRequest } from '../types';

export const getContactCards = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const cards = await getAllContactCards();

    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.CONTACT_CARDS_FETCHED, data: cards, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const createContactCardController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const validation = validateContactCardInput(req.body);

    if (!validation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError({ message: RESPONSE_MESSAGES.VALIDATION_ERROR, errors: validation.errors, statusCode: HTTP_STATUS.BAD_REQUEST })
      );
      return;
    }

    const card = await createContactCard(validation.data!);
    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess({ message: RESPONSE_MESSAGES.CONTACT_CARD_CREATED, data: card, statusCode: HTTP_STATUS.CREATED })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const updateContactCardController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const validation = validateContactCardInput(req.body);

    if (!validation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError({ message: RESPONSE_MESSAGES.VALIDATION_ERROR, errors: validation.errors, statusCode: HTTP_STATUS.BAD_REQUEST })
      );
      return;
    }

    const card = await updateContactCard(String(req.params.id), validation.data!);
    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.CONTACT_CARD_UPDATED, data: card, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const deleteContactCardController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteContactCard(String(req.params.id));
    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.CONTACT_CARD_DELETED, data: result, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};