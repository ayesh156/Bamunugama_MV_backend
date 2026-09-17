import { Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/tokenUtil';
import { formatError } from '../utils/responseFormatter';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IAuthRequest, AdminRole, IJwtPayload } from '../types';

export const verifyAuthToken = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      const errorResponse = formatError({
        message: RESPONSE_MESSAGES.TOKEN_MISSING,
        errors: ['Authorization token is required in header: Authorization: Bearer <token>'],
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
      return;
    }

    const decoded = verifyToken(token);
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      fullName: decoded.fullName,
    };

    next();
  } catch (error) {
    let statusCode = HTTP_STATUS.UNAUTHORIZED;
    let message: string = RESPONSE_MESSAGES.INVALID_TOKEN;

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        message = 'Token has expired';
      } else if (error.message.includes('Invalid')) {
        message = RESPONSE_MESSAGES.INVALID_TOKEN;
      }
    }

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};

export const verifyAuthTokenOptional = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      req.admin = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
        fullName: decoded.fullName,
      };
    }

    next();
  } catch (error) {
    console.warn('Optional auth verification failed:', error instanceof Error ? error.message : 'Unknown error');
    next();
  }
};

export const authorize = (allowedRoles: AdminRole[] = []) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      const errorResponse = formatError({
        message: RESPONSE_MESSAGES.UNAUTHORIZED_ACCESS,
        errors: ['Authentication required'],
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.admin.role)) {
      const errorResponse = formatError({
        message: RESPONSE_MESSAGES.UNAUTHORIZED_ACCESS,
        errors: [`Insufficient permissions. Required role(s): ${allowedRoles.join(', ')}`],
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
      res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }

    next();
  };
};