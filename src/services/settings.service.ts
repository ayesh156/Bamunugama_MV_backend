import { prisma } from '../config/prisma';
import { ISchoolSettingsResponse } from '../types';

/**
 * Fetch all school settings as a flattened key/value map with parsed school_hours.
 */
export const getSchoolSettings = async (): Promise<ISchoolSettingsResponse> => {
  const settings = await prisma.schoolSetting.findMany({});
  const result: ISchoolSettingsResponse = {};

  for (const setting of settings) {
    if (setting.key === 'school_hours') {
      try {
        result.school_hours = JSON.parse(setting.value) as Array<{ days: string; time: string }>;
      } catch {
        result.school_hours = [];
      }
    } else if (setting.key === 'google_map_url') {
      result.google_map_url = setting.value;
    } else if (setting.key === 'footer_phone') {
      result.footer_phone = setting.value;
    } else if (setting.key === 'footer_email') {
      result.footer_email = setting.value;
    } else if (setting.key === 'footer_address') {
      result.footer_address = setting.value;
    } else {
      (result as Record<string, unknown>)[setting.key] = setting.value;
    }
  }

  return result;
};

/**
 * Get a single setting's raw value by key.
 */
export const getSettingValue = async (key: string): Promise<string | null> => {
  const setting = await prisma.schoolSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
};

/**
 * Bulk update school settings. Upserts each provided key/value pair.
 */
export const updateSchoolSettings = async (
  updates: Record<string, string>
): Promise<ISchoolSettingsResponse> => {
  for (const [key, value] of Object.entries(updates)) {
    await prisma.schoolSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }

  return getSchoolSettings();
};

/**
 * Validate school settings payload.
 * Accepts a map of known keys -> string values. `school_hours` may be passed
 * as a JSON string or already-parsed array. Returns normalized string map.
 */
export const validateSchoolSettingsInput = (
  input: unknown
): { isValid: boolean; errors: string[]; data?: Record<string, string> } => {
  const errors: string[] = [];
  const data = input as Record<string, unknown>;
  const ALLOWED_KEYS = [
    'google_map_url',
    'school_hours',
    'footer_phone',
    'footer_email',
    'footer_address',
  ];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid input data'] };
  }

  const normalized: Record<string, string> = {};

  for (const key of ALLOWED_KEYS) {
    const raw = data[key];
    if (raw === undefined || raw === null) continue;

    if (key === 'school_hours') {
      let hoursJson: string;
      if (typeof raw === 'string') {
        hoursJson = raw;
      } else if (Array.isArray(raw)) {
        hoursJson = JSON.stringify(raw);
      } else {
        errors.push('school_hours must be a JSON string or an array of { days, time } objects');
        continue;
      }

      try {
        const parsed = JSON.parse(hoursJson);
        if (!Array.isArray(parsed)) {
          errors.push('school_hours must be a JSON array');
          continue;
        }
        for (const item of parsed) {
          if (!item || typeof item.days !== 'string' || typeof item.time !== 'string') {
            errors.push('Each school_hours entry must have string "days" and "time" fields');
            break;
          }
        }
        normalized[key] = hoursJson;
      } catch {
        errors.push('school_hours must be valid JSON');
      }
    } else {
      if (typeof raw !== 'string') {
        errors.push(`${key} must be a string`);
        continue;
      }
      normalized[key] = raw.trim();
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [], data: normalized };
};
