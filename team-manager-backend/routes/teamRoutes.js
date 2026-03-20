import express from 'express';
import { 
  list, get, create, update, remove, 
  addOperateur, approveOperateur, rejectOperateur 
} from '../controllers/teamController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', list);
router.get('/:id', get);
router.post('/', admin, create);
router.put('/:id', admin, update);
router.delete('/:id', admin, remove);

// Operateur management
router.patch('/:id/add-operateur', addOperateur);
router.patch('/:id/approve-operateur', admin, approveOperateur);
router.patch('/:id/reject-operateur', admin, rejectOperateur);

export default router;
