import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { captureLead, getLeads, getLeadsByForm } from '../controllers/leadController';

const router = Router();

// Public endpoint for capturing leads (no auth, uses API token)
router.post('/capture', captureLead);

// Protected endpoints
router.get('/', authMiddleware, getLeads);
router.get('/form/:formId', authMiddleware, getLeadsByForm);

export default router;
