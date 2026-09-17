import { Router } from 'express';
import * as videoController from '../controllers/video.controller';
import { verifyAuthToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public: GET /api/videos
router.get('/', videoController.getVideos);

// Protected: POST /api/admin/videos
router.post('/', verifyAuthToken, authorize(['admin', 'super_admin']), videoController.createVideoItem);

// Protected: PUT /api/admin/videos/:id
router.put('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), videoController.updateVideoItem);

// Protected: DELETE /api/admin/videos/:id
router.delete('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), videoController.deleteVideo);

export default router;
