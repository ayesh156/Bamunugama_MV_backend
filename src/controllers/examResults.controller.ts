import { Request, Response, NextFunction } from 'express';
import {
  getExamTrends,
  createExamResult,
  bulkCreateExamResults,
  updateExamResult,
  deleteExamResult,
  validateExamResultInput,
} from '../services/examResults.service';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IAuthRequest } from '../types';

export const getResults = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const examType = req.query.examType as string | undefined;
    const trends = await getExamTrends(examType);

    const successResponse = formatSuccess({
      message: RESPONSE_MESSAGES.RESULT_FETCHED,
      data: trends,
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

export const createResults = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body;

    // Single object or array?
    const inputs = Array.isArray(body) ? body : [body];

    // Validate all inputs first
    const allErrors: string[] = [];
    const validInputs: unknown[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const validation = validateExamResultInput(inputs[i]);
      if (!validation.isValid) {
        allErrors.push(`Item ${i}: ${validation.errors.join(', ')}`);
      } else {
        validInputs.push(validation.data);
      }
    }

    if (allErrors.length > 0) {
      const errorResponse = formatError({
        message: RESPONSE_MESSAGES.VALIDATION_ERROR,
        errors: allErrors,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
      res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    // Process valid inputs
    const { results, errors: processingErrors } = await bulkCreateExamResults(
      validInputs as Parameters<typeof bulkCreateExamResults>[0]
    );

    const successResponse = formatSuccess({
      message: RESPONSE_MESSAGES.RESULT_CREATED,
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
      error instanceof Error ? error.message : RESPONSE_MESSAGES.INTERNAL_ERROR;

    const errorResponse = formatError({
      message,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode,
    });

    res.status(statusCode).json(errorResponse);
  }
};

export const updateResult = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validation = validateExamResultInput(req.body);

    if (!validation.isValid) {
      const errorResponse = formatError({
        message: RESPONSE_MESSAGES.VALIDATION_ERROR,
        errors: validation.errors,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
      res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    const id = req.params.id as string;
    const result = await updateExamResult(id, validation.data!);

    const successResponse = formatSuccess({
      message: 'Exam result updated successfully',
      data: result,
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

export const deleteResult = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await deleteExamResult(id);

    const successResponse = formatSuccess({
      message: RESPONSE_MESSAGES.RESULT_DELETED,
      data: result,
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