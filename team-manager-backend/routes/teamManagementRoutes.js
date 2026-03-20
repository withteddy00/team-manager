import express from 'express';
import { 
  createTeam, 
  getMyTeam, 
  getTeamById,
  addOperatorToTeam, 
  removeOperatorFromTeam,
  getAllTeams,
  getAvailableOperators,
  validateOperateur,
  deleteTeam,
  getPendingOperateurs
} from '../controllers/teamManagementController.js';
import { protect, superviseur, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== ADMIN ROUTES ====================
router.post('/', admin, createTeam);  // Create team (max 4)
router.get('/all', admin, getAllTeams);  // Get all teams
router.put('/:teamId/validate/:operateurId', admin, validateOperateur);  // Approve/reject operateur
router.delete('/:teamId', admin, deleteTeam);  // Delete team

// ==================== SUPERVISEUR ROUTES ====================
router.get('/my-team', superviseur, getMyTeam);  // Get my team
router.get('/my-team/pending', superviseur, getPendingOperateurs);  // Get pending operateurs
router.post('/add-operator', superviseur, addOperatorToTeam);  // Add operateur (becomes pending)
router.delete('/remove-operator/:operatorId', superviseur, removeOperatorFromTeam);  // Remove operateur

// ==================== PUBLIC/SHARED ROUTES ====================
router.get('/available-operators', getAvailableOperators);  // Get available operators
router.get('/:id', getTeamById);  // Get team by ID

export default router;
