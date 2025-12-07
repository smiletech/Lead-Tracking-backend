import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';
import { captureLeadSchema } from '../validators/leadValidator';

// Public endpoint for capturing leads
export const captureLead = async (req: Request, res: Response) => {
  try {
    const validatedData = captureLeadSchema.parse(req.body);
    const apiToken = req.headers['x-api-token'] as string;

    if (!apiToken) {
      return res.status(401).json({ error: 'API token required' });
    }

    // Verify form exists and token matches
    const form = await prisma.form.findFirst({
      where: {
        id: validatedData.formId,
        apiToken,
      },
      include: {
        fields: true,
      },
    });

    if (!form) {
      return res.status(404).json({ error: 'Invalid form or API token' });
    }

    // Create lead with data
    const lead = await prisma.lead.create({
      data: {
        formId: form.id,
        data: {
          create: Object.entries(validatedData.data).map(([fieldName, value]) => ({
            fieldName,
            value: String(value),
          })),
        },
      },
      include: {
        data: true,
      },
    });

    res.status(201).json({
      message: 'Lead captured successfully',
      leadId: lead.id,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Capture lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all leads with optional filters
export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const { formId, startDate, endDate, source } = req.query;

    // Build where clause
    const where: any = {};

    if (formId) {
      // Verify form belongs to user
      const form = await prisma.form.findFirst({
        where: {
          id: formId as string,
          website: {
            userId: req.userId!,
          },
        },
      });

      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      where.formId = formId;
    } else {
      // Get all forms for user's websites
      const formWhere: any = {
        website: {
          userId: req.userId!,
        },
      };

      // Add source filter if provided
      if (source && (source === 'website' || source === 'form')) {
        formWhere.source = source;
      }

      const userForms = await prisma.form.findMany({
        where: formWhere,
        select: { id: true },
      });

      where.formId = {
        in: userForms.map((f) => f.id),
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        data: true,
        form: {
          select: {
            id: true,
            name: true,
            source: true,
            website: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
        } as any,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedLeads = leads.map((lead: any) => ({
      id: lead.id,
      formId: lead.formId,
      formName: lead.form.name,
      source: lead.form.source,
      website: lead.form.website,
      createdAt: lead.createdAt,
      data: lead.data.reduce((acc: Record<string, string>, item: any) => {
        acc[item.fieldName] = item.value;
        return acc;
      }, {} as Record<string, string>),
    }));

    res.json({ leads: formattedLeads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get leads for a specific form
export const getLeadsByForm = async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    // Verify form belongs to user
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        website: {
          userId: req.userId!,
        },
      },
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const leads = await prisma.lead.findMany({
      where: { formId },
      include: {
        data: true,
        form: {
          select: {
            id: true,
            name: true,
            source: true,
            website: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
        } as any,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedLeads = leads.map((lead: any) => ({
      id: lead.id,
      formId: lead.formId,
      formName: lead.form.name,
      source: lead.form.source,
      website: lead.form.website,
      createdAt: lead.createdAt,
      data: lead.data.reduce((acc: Record<string, string>, item: any) => {
        acc[item.fieldName] = item.value;
        return acc;
      }, {} as Record<string, string>),
    }));

    res.json({ leads: formattedLeads });
  } catch (error) {
    console.error('Get leads by form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
