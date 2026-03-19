import express from 'express';
import { list, get, create, update, remove, validate, getMoroccan, sync } from '../controllers/holidaysController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', list);
router.get('/moroccan/:year', getMoroccan);
router.post('/sync/:year', sync);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/validate', validate);

export default router;
