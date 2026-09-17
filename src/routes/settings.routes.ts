import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { verifyAuthToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// PUBLIC SETTINGS — /api/settings
// ============================================

// GET /api/settings — public school settings (map URL, hours, footer contact)
router.get('/', settingsController.getSettings);

// ============================================
// ADMIN SETTINGS — /api/admin/settings
// ============================================

// PUT /api/admin/settings — update school settings
router.put('/', verifyAuthToken, authorize(['admin', 'super_admin']), settingsController.updateSettings);

export default router;