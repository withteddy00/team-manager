import express from 'express';
import { 
  createTeam, 
  getMyTeam, 
  getTeamById,
  addOperatorToTeam, 
  removeOperatorFromTeam,
  getAllTeams,
  getAvailableOperators
} from '../controllers/teamManagementController.js';
import { protect, superviseur, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Superviseur routes
router.post('/', superviseur, createTeam);
router.get('/my-team', superviseur, getMyTeam);
router.post('/add-operator', superviseur, addOperatorToTeam);
router.delete('/remove-operator/:operatorId', superviseur, removeOperatorFromTeam);
router.get('/available-operators', superviseur, getAvailableOperators);

// Admin routes
router.get('/all', admin, getAllTeams);
router.get('/:id', getTeamById);

export default router;
