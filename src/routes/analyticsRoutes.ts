import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  analyticsLeadsPerForm,
  analyticsLeadsPerDay,
  analyticsConversionTrends,
} from '../controllers/analyticsController';

const router = Router();

// All routes require authentication
router.get('/leads-per-form', authMiddleware, analyticsLeadsPerForm);
router.get('/leads-per-day', authMiddleware, analyticsLeadsPerDay);
router.get('/conversion-trends', authMiddleware, analyticsConversionTrends);

export default router;
