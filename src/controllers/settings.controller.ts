import { Request, Response, NextFunction } from 'express';
import {
  getSchoolSettings,
  updateSchoolSettings,
  validateSchoolSettingsInput,
} from '../services/settings.service';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IAuthRequest } from '../types';

export const getSettings = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const settings = await getSchoolSettings();

    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.SETTINGS_FETCHED, data: settings, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};

export const updateSettings = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const validation = validateSchoolSettingsInput(req.body);

    if (!validation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError({ message: RESPONSE_MESSAGES.VALIDATION_ERROR, errors: validation.errors, statusCode: HTTP_STATUS.BAD_REQUEST })
      );
      return;
    }

    const settings = await updateSchoolSettings(validation.data!);
    res.status(HTTP_STATUS.OK).json(
      formatSuccess({ message: RESPONSE_MESSAGES.SETTINGS_UPDATED, data: settings, statusCode: HTTP_STATUS.OK })
    );
  } catch (error) {
    const statusCode = (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;
    res.status(statusCode).json(formatError({ message, errors: [message], statusCode }));
  }
};