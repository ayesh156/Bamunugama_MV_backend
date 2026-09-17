import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { HTTP_STATUS } from '../config/constants';
import {
  IStudentDemographic,
  IStudentDemographicInput,
  IDemographicSummary,
  IDemographicTotals,
  IAppError,
} from '../types';

/**
 * Get all student demographics grouped by section, with computed totals.
 */
export const getStudentDemographics = async (): Promise<IDemographicSummary> => {
  const rows = await prisma.studentDemographic.findMany({
    orderBy: [{ section: 'asc' }, { grade: 'asc' }],
  });

  const demographics: IStudentDemographic[] = rows.map((r) => ({
    _id: r.id,
    grade: r.grade,
    femaleCount: r.femaleCount,
    maleCount: r.maleCount,
    totalCount: r.totalCount,
    section: r.section,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  // Compute section totals
  const totals: IDemographicTotals = {
    primary: { female: 0, male: 0, total: 0 },
    secondary: { female: 0, male: 0, total: 0 },
    grand: { female: 0, male: 0, total: 0 },
  };

  for (const d of demographics) {
    const isPrimary = d.section === 'Primary';
    const bucket = isPrimary ? totals.primary : totals.secondary;
    bucket.female += d.femaleCount;
    bucket.male += d.maleCount;
    bucket.total += d.totalCount;

    totals.grand.female += d.femaleCount;
    totals.grand.male += d.maleCount;
    totals.grand.total += d.totalCount;
  }

  return { demographics, totals };
};

/**
 * Create a single student demographic entry.
 * totalCount is computed automatically server-side.
 */
export const createStudentDemographic = async (input: IStudentDemographicInput) => {
  try {
    const existing = await prisma.studentDemographic.findUnique({
      where: { grade: input.grade.trim() },
    });

    if (existing) {
      const error: IAppError = new Error('A demographic entry for this grade already exists');
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const totalCount = input.femaleCount + input.maleCount;
    const section = input.section ?? 'Secondary';

    const result = await prisma.studentDemographic.create({
      data: {
        grade: input.grade.trim(),
        femaleCount: input.femaleCount,
        maleCount: input.maleCount,
        totalCount,
        section,
      },
    });

    return {
      _id: result.id,
      grade: result.grade,
      femaleCount: result.femaleCount,
      maleCount: result.maleCount,
      totalCount: result.totalCount,
      section: result.section,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error) {
    if ((error as IAppError).statusCode) throw error;

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const err: IAppError = new Error('A demographic entry for this grade already exists');
      err.statusCode = HTTP_STATUS.CONFLICT;
      throw err;
    }

    throw error;
  }
};

/**
 * Bulk create student demographics.
 */
export const bulkCreateStudentDemographics = async (inputs: IStudentDemographicInput[]) => {
  const results = [];
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < inputs.length; i++) {
    try {
      const result = await createStudentDemographic(inputs[i]);
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
 * Update a student demographic entry by id.
 * totalCount is recomputed automatically server-side.
 */
export const updateStudentDemographic = async (id: string, input: IStudentDemographicInput) => {
  try {
    // Check if another entry exists with the same grade (excluding this one)
    const conflicting = await prisma.studentDemographic.findFirst({
      where: {
        grade: input.grade.trim(),
        NOT: { id },
      },
    });

    if (conflicting) {
      const error: IAppError = new Error('A demographic entry for this grade already exists');
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const totalCount = input.femaleCount + input.maleCount;
    const section = input.section ?? 'Secondary';

    const result = await prisma.studentDemographic.update({
      where: { id },
      data: {
        grade: input.grade.trim(),
        femaleCount: input.femaleCount,
        maleCount: input.maleCount,
        totalCount,
        section,
      },
    });

    return {
      _id: result.id,
      grade: result.grade,
      femaleCount: result.femaleCount,
      maleCount: result.maleCount,
      totalCount: result.totalCount,
      section: result.section,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Demographic entry not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    if ((error as IAppError).statusCode) throw error;
    throw error;
  }
};

/**
 * Delete a student demographic entry by id.
 */
export const deleteStudentDemographic = async (id: string) => {
  try {
    const result = await prisma.studentDemographic.delete({
      where: { id },
    });

    if (!result) {
      const error: IAppError = new Error('Demographic entry not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return { success: true, id };
  } catch (error) {
    // Prisma P2025 -> record not found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const notFoundError: IAppError = new Error('Demographic entry not found');
      notFoundError.statusCode = HTTP_STATUS.NOT_FOUND;
      throw notFoundError;
    }

    if ((error as IAppError).statusCode) throw error;
    throw error;
  }
};

/**
 * Validate student demographic input.
 */
export const validateStudentDemographicInput = (
  input: unknown
): { isValid: boolean; errors: string[]; data?: IStudentDemographicInput } => {
  const errors: string[] = [];
  const data = input as Record<string, unknown>;

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid input data'] };
  }

  if (!data.grade || typeof data.grade !== 'string' || data.grade.trim() === '') {
    errors.push('grade is required and must be a non-empty string');
  }

  const femaleCount = data.femaleCount as number;
  const maleCount = data.maleCount as number;

  if (typeof femaleCount !== 'number' || !Number.isInteger(femaleCount) || femaleCount < 0) {
    errors.push('femaleCount must be a non-negative integer');
  }

  if (typeof maleCount !== 'number' || !Number.isInteger(maleCount) || maleCount < 0) {
    errors.push('maleCount must be a non-negative integer');
  }

  const validSections = ['Primary', 'Secondary'];
  if (data.section !== undefined && data.section !== null && data.section !== '') {
    const section = data.section as string;
    if (!validSections.includes(section)) {
      errors.push('section must be one of: Primary, Secondary');
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      grade: (data.grade as string).trim(),
      femaleCount,
      maleCount,
      section: data.section as string | undefined,
    },
  };
};
