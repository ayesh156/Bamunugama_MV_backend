import { Router } from 'express';
import * as galleryController from '../controllers/gallery.controller';
import { verifyAuthToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public: GET /api/gallery
router.get('/', galleryController.getGallery);

// Protected: POST /api/admin/gallery
router.post('/', verifyAuthToken, authorize(['admin', 'super_admin']), galleryController.createGallery);

// Protected: PUT /api/admin/gallery/:id
router.put('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), galleryController.updateGallery);

// Protected: DELETE /api/admin/gallery/:id
router.delete('/:id', verifyAuthToken, authorize(['admin', 'super_admin']), galleryController.deleteGallery);

export default router;
