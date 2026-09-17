import { Request, Response, NextFunction } from 'express';
import {
  getStudentDemographics,
  bulkCreateStudentDemographics,
  updateStudentDemographic,
  deleteStudentDemographic,
  validateStudentDemographicInput,
} from '../services/studentDemographics.service';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../config/constants';
import { IAuthRequest } from '../types';

export const getDemographics = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const summary = await getStudentDemographics();

    const successResponse = formatSuccess({
      message: 'Student demographics fetched successfully',
      data: summary,
      statusCode: HTTP_STATUS.OK,
    });

    res.status(HTTP_STATUS.OK).json(successResponse);
  } catch (error) {
    const statusCode =
      (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};

export const createDemographics = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const body = req.body;

    // Single object or array?
    const inputs = Array.isArray(body) ? body : [body];

    // Validate all inputs first
    const allErrors: string[] = [];
    const validInputs: unknown[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const validation = validateStudentDemographicInput(inputs[i]);
      if (!validation.isValid) {
        allErrors.push(`Item ${i}: ${validation.errors.join(', ')}`);
      } else {
        validInputs.push(validation.data);
      }
    }

    if (allErrors.length > 0) {
      const errorResponse = formatError({
        message: 'Validation error',
        errors: allErrors,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
      res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    // Process valid inputs
    const { results, errors: processingErrors } = await bulkCreateStudentDemographics(
      validInputs as Parameters<typeof bulkCreateStudentDemographics>[0]
    );

    const successResponse = formatSuccess({
      message: 'Student demographic(s) created successfully',
      data: {
        created: results.length,
        errors: processingErrors,
        results,
      },
      statusCode: HTTP_STATUS.CREATED,
    });

    res.status(HTTP_STATUS.CREATED).json(successResponse);
  } catch (error) {
    const statusCode =
      (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};

export const updateDemographic = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const validation = validateStudentDemographicInput(req.body);

    if (!validation.isValid) {
      const errorResponse = formatError({
        message: 'Validation error',
        errors: validation.errors,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
      res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    const id = req.params.id as string;
    const result = await updateStudentDemographic(id, validation.data!);

    const successResponse = formatSuccess({
      message: 'Student demographic updated successfully',
      data: result,
      statusCode: HTTP_STATUS.OK,
    });

    res.status(HTTP_STATUS.OK).json(successResponse);
  } catch (error) {
    const statusCode =
      (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};

export const deleteDemographic = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await deleteStudentDemographic(id);

    const successResponse = formatSuccess({
      message: 'Student demographic deleted successfully',
      data: result,
      statusCode: HTTP_STATUS.OK,
    });

    res.status(HTTP_STATUS.OK).json(successResponse);
  } catch (error) {
    const statusCode =
      (error as Record<string, number>).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};