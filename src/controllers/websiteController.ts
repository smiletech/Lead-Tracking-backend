import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';
import { websiteSchema, updateWebsiteSchema } from '../validators/websiteValidator';

export const createWebsite = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = websiteSchema.parse(req.body);

    const website = await prisma.website.create({
      data: {
        url: validatedData.url,
        name: validatedData.name,
        userId: req.userId!,
      },
    });

    res.status(201).json({
      message: 'Website created successfully',
      website,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create website error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWebsites = async (req: AuthRequest, res: Response) => {
  try {
    const websites = await prisma.website.findMany({
      where: { userId: req.userId! },
      include: {
        forms: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ websites });
  } catch (error) {
    console.error('Get websites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateWebsite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateWebsiteSchema.parse(req.body);

    // Check if website belongs to user
    const website = await prisma.website.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const updatedWebsite = await prisma.website.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      message: 'Website updated successfully',
      website: updatedWebsite,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update website error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteWebsite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if website belongs to user
    const website = await prisma.website.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    await prisma.website.delete({
      where: { id },
    });

    res.json({ message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Delete website error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
