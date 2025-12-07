import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  getLeadsPerForm,
  getLeadsPerDay,
  getConversionTrends,
} from '../services/analyticsService';

export const analyticsLeadsPerForm = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getLeadsPerForm(req.userId!);
    res.json({ data });
  } catch (error) {
    console.error('Analytics leads per form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const analyticsLeadsPerDay = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await getLeadsPerDay(req.userId!, days);
    res.json({ data });
  } catch (error) {
    console.error('Analytics leads per day error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const analyticsConversionTrends = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getConversionTrends(req.userId!);
    res.json({ data });
  } catch (error) {
    console.error('Analytics conversion trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
