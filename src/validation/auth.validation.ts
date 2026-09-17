import { IRegisterBody, ILoginBody } from '../types';

export const validateRegistration = (data: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.fullName || typeof data.fullName !== 'string') {
    errors.push('Full name is required and must be a string');
  } else if (data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  } else if (data.fullName.trim().length > 100) {
    errors.push('Full name must not exceed 100 characters');
  }

  if (!data.username || typeof data.username !== 'string') {
    errors.push('Username is required and must be a string');
  } else {
    const username = data.username.trim().toLowerCase();
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    } else if (username.length > 50) {
      errors.push('Username must not exceed 50 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Please provide a valid email address');
    }
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required and must be a string');
  } else if (data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateLogin = (data: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const hasEmail = data.email && typeof data.email === 'string';
  const hasUsername = data.username && typeof data.username === 'string';

  if (!hasEmail && !hasUsername) {
    errors.push('Either email or username is required');
  } else {
    if (hasEmail) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(data.email as string)) {
        errors.push('Please provide a valid email address');
      }
    }

    if (hasUsername) {
      const username = (data.username as string).trim().toLowerCase();
      if (username.length < 3 || username.length > 50) {
        errors.push('Invalid username format');
      }
    }
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else if (data.password.length === 0) {
    errors.push('Password cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeRegistrationData = (data: Record<string, unknown>): IRegisterBody => {
  return {
    fullName: data.fullName ? (data.fullName as string).trim() : '',
    username: data.username ? (data.username as string).trim().toLowerCase() : '',
    email: data.email ? (data.email as string).trim().toLowerCase() : '',
    password: (data.password as string) || '',
  };
};

export const sanitizeLoginData = (data: Record<string, unknown>): ILoginBody => {
  return {
    email: data.email ? (data.email as string).trim().toLowerCase() : undefined,
    username: data.username ? (data.username as string).trim().toLowerCase() : undefined,
    password: (data.password as string) || '',
  };
};