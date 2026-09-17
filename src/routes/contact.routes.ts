import { Router } from 'express';
import * as contactController from '../controllers/contact.controller';
import * as messagesController from '../controllers/messages.controller';
import { verifyAuthToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// PUBLIC ROUTES — /api/contact/*
// ============================================

// GET /api/contact/cards — public contact info cards
router.get('/cards', contactController.getContactCards);

// POST /api/contact/send — public contact form submission
router.post('/send', messagesController.sendMessage);

// ============================================
// ADMIN PROTECTED ROUTES — /api/admin/contact/*
// POST|PUT|DELETE /api/admin/contact/cards
// ============================================

// POST /api/admin/contact/cards
router.post('/cards', verifyAuthToken, authorize(['admin', 'super_admin']), contactController.createContactCardController);

// PUT /api/admin/contact/cards/:id
router.put('/cards/:id', verifyAuthToken, authorize(['admin', 'super_admin']), contactController.updateContactCardController);

// DELETE /api/admin/contact/cards/:id
router.delete('/cards/:id', verifyAuthToken, authorize(['admin', 'super_admin']), contactController.deleteContactCardController);

export default router;