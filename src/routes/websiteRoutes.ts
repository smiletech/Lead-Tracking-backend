import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createWebsite,
  getWebsites,
  updateWebsite,
  deleteWebsite,
} from '../controllers/websiteController';

const router = Router();

// All routes require authentication
router.post('/', authMiddleware, createWebsite);
router.get('/', authMiddleware, getWebsites);
router.put('/:id', authMiddleware, updateWebsite);
router.delete('/:id', authMiddleware, deleteWebsite);

export default router;
