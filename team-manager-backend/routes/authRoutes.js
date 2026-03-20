import express from 'express';
import { register, login, getMe, getSuperviseurs } from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/superviseurs', protect, admin, getSuperviseurs);

export default router;
