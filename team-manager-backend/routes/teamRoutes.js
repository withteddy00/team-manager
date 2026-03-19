import express from 'express';
import { list, get, create, update, remove, toggleStatus } from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.patch('/:id/toggle-status', toggleStatus);

export default router;
