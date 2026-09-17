import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { verifyAuthToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', verifyAuthToken, authController.logout);
router.get('/profile', verifyAuthToken, authController.getProfile);

export default router;