import express from 'express';
import { list } from '../controllers/historyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', list);

export default router;
