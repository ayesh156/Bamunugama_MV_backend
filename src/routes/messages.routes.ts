import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { verifyAuthToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// ADMIN MESSAGES — /api/admin/messages
// ============================================

// GET /api/admin/messages — list all received contact messages
router.get('/', verifyAuthToken, authorize(['admin', 'super_admin']), messagesController.getMessages);

// PATCH /api/admin/messages/:id/read — mark a message read/unread
router.patch('/:id/read', verifyAuthToken, authorize(['admin', 'super_admin']), messagesController.markRead);

// DELETE /api/admin/messages/:id — delete a message
router.delete('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), messagesController.deleteMessage);

export default router;