import express from 'express';
import { 
  syncMoroccoHolidays,
  getAllEvents,
  getMyEvents,
  createAstreinte,
  assignOperatorsToAstreinte,
  submitHolidayConfirmation,
  getConfirmations,
  approveConfirmation,
  rejectConfirmation,
  getMyConfirmations
} from '../controllers/eventController.js';
import { protect, superviseur, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Events routes
router.get('/', getAllEvents);
router.get('/my-events', getMyEvents);

// Admin: sync holidays
router.post('/sync-holidays', admin, syncMoroccoHolidays);

// Create astreinte (admin or system)
router.post('/astreinte', admin, createAstreinte);

// Superviseur: assign operators to astreinte
router.post('/astreinte/assign', superviseur, assignOperatorsToAstreinte);

// Superviseur: submit holiday confirmation
router.post('/holiday/confirm', superviseur, submitHolidayConfirmation);

// Confirmations
router.get('/confirmations', getConfirmations);
router.get('/confirmations/my', getMyConfirmations);
router.put('/confirmations/:confirmationId/approve', admin, approveConfirmation);
router.put('/confirmations/:confirmationId/reject', admin, rejectConfirmation);

export default router;
