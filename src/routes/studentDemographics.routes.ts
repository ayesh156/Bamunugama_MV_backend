import { Router } from 'express';
import * as studentDemographicsController from '../controllers/studentDemographics.controller';
import { verifyAuthToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public: Get all student demographics with computed totals
router.get('/', studentDemographicsController.getDemographics);

// Protected: Create / Bulk create student demographics (admin only)
router.post('/', verifyAuthToken, authorize(['admin', 'super_admin']), studentDemographicsController.createDemographics);

// Protected: Update student demographic entry (admin only)
router.put('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), studentDemographicsController.updateDemographic);

// Protected: Delete student demographic entry (admin only)
router.delete('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), studentDemographicsController.deleteDemographic);

export default router;