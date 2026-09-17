import { Router } from 'express';
import * as examResultsController from '../controllers/examResults.controller';
import { verifyAuthToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public: Get 6-year exam trends (scholarship, O/L, A/L)
router.get('/', examResultsController.getResults);

// Protected: Create / Bulk update exam results (admin only)
router.post('/', verifyAuthToken, authorize(['admin', 'super_admin']), examResultsController.createResults);

// Protected: Update exam result entry (admin only)
router.put('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), examResultsController.updateResult);

// Protected: Delete exam result entry (admin only)
router.delete('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), examResultsController.deleteResult);

export default router;