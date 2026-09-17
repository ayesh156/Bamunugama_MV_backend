import { Response, NextFunction } from 'express';
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
} from '../services/auth.service';
import {
  validateRegistration,
  validateLogin,
  sanitizeRegistrationData,
  sanitizeLoginData,
} from '../validation/auth.validation';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IAuthRequest } from '../types';

export const register = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawData = req.body;

    const validation = validateRegistration(rawData);
    if (!validation.isValid) {
      const errorResponse = formatError({
        message: RESPONSE_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
      res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    const sanitizedData = sanitizeRegistrationData(rawData);
    const result = await registerAdmin(sanitizedData);

    const successResponse = formatSuccess({
      message: RESPONSE_MESSAGES.AUTH_REGISTER_SUCCESS,
      data: result,
      statusCode: HTTP_STATUS.CREATED,
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse);
  } catch (error) {
    const statusCode =
      (error as unknown as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};

export const login = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawData = req.body;

    const validation = validateLogin(rawData);
    if (!validation.isValid) {
      const errorResponse = formatError({
        message: RESPONSE_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
      res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    const sanitizedData = sanitizeLoginData(rawData);
    const result = await loginAdmin(sanitizedData);

    const successResponse = formatSuccess({
      message: RESPONSE_MESSAGES.AUTH_LOGIN_SUCCESS,
      data: result,
      statusCode: HTTP_STATUS.OK,
    });

    res.status(HTTP_STATUS.OK).json(successResponse);
  } catch (error) {
    const statusCode =
      (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : RESPONSE_MESSAGES.INVALID_CREDENTIALS;

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};

export const logout = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.admin!.id;
    await logoutAdmin(adminId);

    const successResponse = formatSuccess({
      message: RESPONSE_MESSAGES.AUTH_LOGOUT_SUCCESS,
      data: { success: true },
      statusCode: HTTP_STATUS.OK,
    });

    res.status(HTTP_STATUS.OK).json(successResponse);
  } catch (error) {
    const statusCode =
      (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};

export const getProfile = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.admin!.id;
    const adminProfile = await getAdminProfile(adminId);

    const successResponse = formatSuccess({
      message: RESPONSE_MESSAGES.AUTH_PROFILE_FETCHED,
      data: adminProfile,
      statusCode: HTTP_STATUS.OK,
    });

    res.status(HTTP_STATUS.OK).json(successResponse);
  } catch (error) {
    const statusCode =
      (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};