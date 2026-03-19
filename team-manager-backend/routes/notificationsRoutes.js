import express from 'express';
import { list, unreadCount, markRead, markAllRead } from '../controllers/notificationsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', list);
router.get('/unread-count', unreadCount);
router.patch('/:id', markRead);
router.post('/mark-all-read', markAllRead);

export default router;
