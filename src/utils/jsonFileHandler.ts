import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

/**
 * Ensures the data directory exists
 */
const ensureDataDir = (): void => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

/**
 * Read data from a JSON file
 */
export const readJsonFile = <T>(filename: string): T[] => {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || raw.trim() === '') {
      return [];
    }
    return JSON.parse(raw) as T[];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

/**
 * Write data to a JSON file
 */
export const writeJsonFile = <T>(filename: string, data: T[]): void => {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw new Error(`Failed to write to ${filename}`);
  }
};

/**
 * Generate a simple unique ID
 */
export const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
};