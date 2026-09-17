import { Request, Response, NextFunction } from 'express';
import {
  createContactMessage,
  getAllContactMessages,
  markMessageAsRead,
  deleteContactMessage,
  validateContactMessageInput,
} from '../services/messages.service';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IAuthRequest } from '../types';

export const sendMessage = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const validation = validateContactMessageInput(req.body);

    if (!validation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError({ message: RESPONSE_MESSAGES.VALIDATION_ERROR, errors: validation.errors, statusCode: HTTP_STATUS.BAD_REQUEST })
      );
      return;
    }

    const message = await createContactMessage(validation.data!);
    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess({ message: RESPONSE_MESSAGES.MESSAGE_SENT, data: message, statusCode: HTTP_STATUS.CREATED })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const getMessages = async (
  _req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const messages = await getAllContactMessages();

    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.MESSAGES_FETCHED, data: messages, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const markRead = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const isRead = req.body?.isRead !== false;
    const message = await markMessageAsRead(String(req.params.id), isRead);

    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.MESSAGE_MARKED_READ, data: message, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const deleteMessage = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteContactMessage(String(req.params.id));
    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.MESSAGE_DELETED, data: result, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};