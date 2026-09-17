import { Request } from 'express';

// ============================================
// Admin Types
// ============================================

export type AdminRole = 'super_admin' | 'admin' | 'staff';

export interface IAdmin {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminPayload {
  id: string;
  email: string;
  username: string;
  role: AdminRole;
  fullName: string;
}

export interface IAdminResponse {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: Date;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// Exam Result Types
// ============================================

export interface IExamResult {
  _id: string;
  examType: string;
  year: number;
  totalSat: number;
  totalPassed: number;
  passPercentage: number;
  districtRank: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExamResultInput {
  examType: string;
  year: number;
  totalSat: number;
  totalPassed: number;
  districtRank?: string;
}

export interface IExamTrend {
  examType: string;
  year: number;
  totalSat: number;
  totalPassed: number;
  passPercentage: number;
  districtRank: string | null;
}

// ============================================
// API Response Types
// ============================================

export interface ISuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

export interface IErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors: string[];
}

export type ApiResponse<T = unknown> = ISuccessResponse<T> | IErrorResponse;

// ============================================
// Request Types
// ============================================

export interface IAuthRequest extends Request {
  admin?: IAdminPayload;
}

export interface IRegisterBody {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface ILoginBody {
  email?: string;
  username?: string;
  password: string;
}

// ============================================
// Gallery Types
// ============================================

export interface IGalleryItem {
  _id: string;
  title: string;
  imageUrl: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGalleryInput {
  title: string;
  imageUrl: string;
  description?: string;
  category?: string;
}

// ============================================
// Video Types
// ============================================

export interface IVideoItem {
  _id: string;
  title: string;
  videoUrl: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVideoInput {
  title: string;
  videoUrl: string;
  description?: string;
  thumbnailUrl?: string;
}

// ============================================
// Student Demographic Types
// ============================================

export type DemographicSection = 'Primary' | 'Secondary';

export interface IStudentDemographic {
  _id: string;
  grade: string;
  femaleCount: number;
  maleCount: number;
  totalCount: number;
  section: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentDemographicInput {
  grade: string;
  femaleCount: number;
  maleCount: number;
  section?: string;
}

export interface IDemographicTotals {
  primary: { female: number; male: number; total: number };
  secondary: { female: number; male: number; total: number };
  grand: { female: number; male: number; total: number };
}

export interface IDemographicSummary {
  demographics: IStudentDemographic[];
  totals: IDemographicTotals;
}

// ============================================
// Contact Card Types
// ============================================

export interface IContactCard {
  _id: string;
  title: string;
  value: string;
  icon: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IContactCardInput {
  title: string;
  value: string;
  icon?: string;
  order?: number;
}

// ============================================
// Contact Message Types
// ============================================

export interface IContactMessage {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface IContactMessageInput {
  fullName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

// ============================================
// School Setting Types
// ============================================

export interface ISchoolSetting {
  _id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface ISchoolSettingsResponse {
  google_map_url?: string;
  school_hours?: Array<{ days: string; time: string }>;
  footer_phone?: string;
  footer_email?: string;
  footer_address?: string;
}

// ============================================
// Error Types
// ============================================

export interface IAppError extends Error {
  statusCode?: number;
  errors?: string[];
}

// ============================================
// JWT Types
// ============================================

export interface IJwtPayload {
  id: string;
  email: string;
  username: string;
  role: AdminRole;
  fullName: string;
  iat?: number;
  exp?: number;
}