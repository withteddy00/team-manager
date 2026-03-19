import express from 'express';
import { list, get, create, update, remove, checkSunday, getSundays } from '../controllers/egyptDutyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', list);
router.get('/check-sunday/:date', checkSunday);
router.get('/sundays/:year/:month', getSundays);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
