import { prisma } from '../config/prisma';
import { Prisma } from '../generated/prisma/client';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../config/constants';
import { IExamResultInput, IExamTrend, IAppError } from '../types';

/**
 * Normalize exam type input to canonical DB form:
 *  - 'scholarship' or 'SCHOLARSHIP' -> 'SCHOLARSHIP'
 *  - 'ol' or 'o/l' or 'O/L'          -> 'O/L'
 *  - 'al' or 'a/l' or 'A/L'          -> 'A/L'
 * Returns null for unrecognized values.
 */
export const normalizeExamType = (examType: string): string | null => {
  const normalized = examType.trim().toUpperCase().replace(/\s+/g, '');
  if (normalized === 'SCHOLARSHIP') return 'SCHOLARSHIP';
  if (normalized === 'OL' || normalized === 'O/L') return 'O/L';
  if (normalized === 'AL' || normalized === 'A/L') return 'A/L';
  return null;
};

/**
 * Get exam trends, optionally filtered by examType.
 */
export const getExamTrends = async (examType?: string): Promise<IExamTrend[]> => {
  try {
    const filter: Record<string, unknown> = {};
    if (examType) {
      const normalized = normalizeExamType(examType);
      if (!normalized) return [];
      filter.examType = normalized;
    }

    const results = await prisma.examResult.findMany({
      where: filter,
      orderBy: [{ examType: 'asc' }, { year: 'asc' }],
    });

    if (!results.length) {
      return [];
    }

    return results.map((r) => ({
      _id: r.id,
      examType: r.examType,
      year: r.year,
      totalSat: r.totalSat,
      totalPassed: r.totalPassed,
      passPercentage: r.passPercentage,
      districtRank: r.districtRank ?? null,
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Create a single exam result.
 */
export const createExamResult = async (input: IExamResultInput) => {
  try {
    const normalizedType = normalizeExamType(input.examType);
    if (!normalizedType) {
      const error: IAppError = new Error('examType must be one of: SCHOLARSHIP, O/L, A/L');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const existing = await prisma.examResult.findFirst({
      where: {
        examType: normalizedType,
        year: input.year,
      },
    });

    if (existing) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.DUPLICATE_RESULT);
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const passPercentage =
      input.totalSat > 0
        ? parseFloat(((input.totalPassed / input.totalSat) * 100).toFixed(2))
        : 0;

    const result = await prisma.examResult.create({
      data: {
        examType: normalizedType,
        year: input.year,
        totalSat: input.totalSat,
        totalPassed: input.totalPassed,
        passPercentage,
        districtRank: input.districtRank ?? '',
      },
    });

    return {
      _id: result.id,
      examType: result.examType,
      year: result.year,
      totalSat: result.totalSat,
      totalPassed: result.totalPassed,
      passPercentage: result.passPercentage,
      districtRank: result.districtRank ?? '',
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error) {
    if ((error as IAppError).statusCode) throw error;

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const err: IAppError = new Error(RESPONSE_MESSAGES.DUPLICATE_RESULT);
      err.statusCode = HTTP_STATUS.CONFLICT;
      throw err;
    }

    throw error;
  }
};

/**
 * Bulk create exam results.
 */
export const bulkCreateExamResults = async (inputs: IExamResultInput[]) => {
  const results = [];
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < inputs.length; i++) {
    try {
      const result = await createExamResult(inputs[i]);
      results.push(result);
    } catch (error) {
      errors.push({
        index: i,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results, errors };
};

/**
 * Update an exam result by id.
 */
export const updateExamResult = async (id: string, input: IExamResultInput) => {
  try {
    const normalizedType = normalizeExamType(input.examType);
    if (!normalizedType) {
      const error: IAppError = new Error('examType must be one of: SCHOLARSHIP, O/L, A/L');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    // Check if another result exists with same examType + year (excluding this one)
    const conflicting = await prisma.examResult.findFirst({
      where: {
        examType: normalizedType,
        year: input.year,
        NOT: { id },
      },
    });

    if (conflicting) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.DUPLICATE_RESULT);
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const passPercentage =
      input.totalSat > 0
        ? parseFloat(((input.totalPassed / input.totalSat) * 100).toFixed(2))
        : 0;

    const result = await prisma.examResult.update({
      where: { id },
      data: {
        examType: normalizedType,
        year: input.year,
        totalSat: input.totalSat,
        totalPassed: input.totalPassed,
        passPercentage,
        districtRank: input.districtRank ?? '',
      },
    });

    return {
      _id: result.id,
      examType: result.examType,
      year: result.year,
      totalSat: result.totalSat,
      totalPassed: result.totalPassed,
      passPercentage: result.passPercentage,
      districtRank: result.districtRank ?? '',
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error(RESPONSE_MESSAGES.RESULT_NOT_FOUND);
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    if ((error as IAppError).statusCode) throw error;
    throw error;
  }
};

export const deleteExamResult = async (id: string) => {
  try {
    const result = await prisma.examResult.delete({
      where: { id },
    });

    if (!result) {
      const error: IAppError = new Error(RESPONSE_MESSAGES.RESULT_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return { success: true, id };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error(RESPONSE_MESSAGES.RESULT_NOT_FOUND);
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    if ((error as IAppError).statusCode) throw error;
    throw error;
  }
};

/**
 * Validate exam result input.
 * Accepts both lowercase (scholarship, ol, al) and uppercase (SCHOLARSHIP, O/L, A/L) exam types.
 */
export const validateExamResultInput = (
  input: unknown
): { isValid: boolean; errors: string[]; data?: IExamResultInput } => {
  const errors: string[] = [];
  const data = input as Record<string, unknown>;

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid input data'] };
  }

  const validExamTypes = ['SCHOLARSHIP', 'O/L', 'A/L', 'scholarship', 'ol', 'al'];
  const examType = data.examType as string;
  if (!examType || !validExamTypes.includes(examType)) {
    errors.push('examType must be one of: SCHOLARSHIP, O/L, A/L');
  }

  if (!data.year || typeof data.year !== 'number' || data.year < 2000 || data.year > 2099) {
    errors.push('year must be a number between 2000 and 2099');
  }

  // Support both totalSat and totalSit (frontend alias)
  const totalSat = (data.totalSat as number) ?? (data.totalSit as number);
  // Support both totalPassed and totalPass (frontend alias)
  const totalPassed = (data.totalPassed as number) ?? (data.totalPass as number);

  if (typeof totalSat !== 'number' || totalSat < 0) {
    errors.push('totalSat/totalSit must be a non-negative number');
  }

  if (typeof totalPassed !== 'number' || totalPassed < 0) {
    errors.push('totalPassed/totalPass must be a non-negative number');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      examType: examType,
      year: data.year as number,
      totalSat,
      totalPassed,
      districtRank: data.districtRank as string | undefined,
    },
  };
};