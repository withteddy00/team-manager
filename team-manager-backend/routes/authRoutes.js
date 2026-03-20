import express from 'express';
import { 
  login, 
  getMe, 
  getSuperviseurs,
  getAllUsers,
  getPendingOperateurs,
  createUser,
  validateOperateur,
  deleteUser
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Admin routes - User management
router.get('/users', protect, admin, getAllUsers);
router.get('/users/pending', protect, admin, getPendingOperateurs);
router.post('/users', protect, admin, createUser);
router.put('/users/:userId/validate', protect, admin, validateOperateur);
router.delete('/users/:userId', protect, admin, deleteUser);
router.get('/superviseurs', protect, admin, getSuperviseurs);

export default router;
