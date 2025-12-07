import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  detectForms,
  createForm,
  getFormsByWebsite,
  getFormSnippet,
  deleteForm,
} from '../controllers/formController';

const router = Router();

// All routes require authentication
router.post('/detect', authMiddleware, detectForms);
router.post('/', authMiddleware, createForm);
router.get('/website/:websiteId', authMiddleware, getFormsByWebsite);
router.get('/:id/snippet', authMiddleware, getFormSnippet);
router.delete('/:id', authMiddleware, deleteForm);

export default router;
