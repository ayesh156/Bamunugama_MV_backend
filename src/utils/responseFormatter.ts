import { HTTP_STATUS } from '../config/constants';

interface FormatSuccessOptions<T = unknown> {
  message?: string;
  data?: T;
  statusCode?: number;
}

interface FormatErrorOptions {
  message?: string;
  errors?: string[];
  statusCode?: number;
}

export const formatSuccess = <T = unknown>(options: FormatSuccessOptions<T> = {}) => {
  const {
    message = 'Operation successful',
    data = null as T | null,
    statusCode = HTTP_STATUS.OK,
  } = options;

  return {
    success: true as const,
    statusCode,
    message,
    data,
  };
};

export const formatError = (options: FormatErrorOptions = {}) => {
  const {
    message = 'An error occurred',
    errors = [],
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  } = options;

  return {
    success: false as const,
    statusCode,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
  };
};