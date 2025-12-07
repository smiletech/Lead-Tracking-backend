import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';
import { detectFormSchema, createFormSchema } from '../validators/formValidator';
import { detectFormsFromUrl } from '../services/formDetectionService';

export const detectForms = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = detectFormSchema.parse(req.body);

    // Verify website belongs to user
    const website = await prisma.website.findFirst({
      where: {
        id: validatedData.websiteId,
        userId: req.userId!,
      },
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    // Detect forms
    const detectedForms = await detectFormsFromUrl(validatedData.url);

    res.json({
      message: 'Forms detected successfully',
      forms: detectedForms,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Detect forms error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const createForm = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createFormSchema.parse(req.body);

    // Verify website belongs to user
    const website = await prisma.website.findFirst({
      where: {
        id: validatedData.websiteId,
        userId: req.userId!,
      },
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    // Create form with fields
    const form = await prisma.form.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        websiteId: validatedData.websiteId,
        fields: {
          create: validatedData.fields,
        },
      },
      include: {
        fields: true,
      },
    });

    res.status(201).json({
      message: 'Form created successfully',
      form,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFormsByWebsite = async (req: AuthRequest, res: Response) => {
  try {
    const { websiteId } = req.params;

    // Verify website belongs to user
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        userId: req.userId!,
      },
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const forms = await prisma.form.findMany({
      where: { websiteId },
      include: {
        fields: true,
        _count: {
          select: { leads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ forms });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFormSnippet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get form and verify access
    const form = await prisma.form.findFirst({
      where: { id },
      include: {
        website: {
          select: {
            userId: true,
          },
        },
        fields: true,
      },
    });

    if (!form || form.website.userId !== req.userId!) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Generate JS snippet
    const apiUrl = process.env.API_URL || 'http://localhost:5002';
    const snippet = `
<script>
(function() {
  const formElement = document.querySelector('form'); // Adjust selector as needed
  
  if (formElement) {
    formElement.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(formElement);
      const data = {};
      
      formData.forEach((value, key) => {
        data[key] = value;
      });
      
      fetch('${apiUrl}/api/leads/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Token': '${form.apiToken}'
        },
        body: JSON.stringify({
          formId: '${form.id}',
          data: data
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Lead captured successfully');
        // Submit the original form or redirect
        formElement.submit();
      })
      .catch(error => {
        console.error('Error capturing lead:', error);
        // Submit the form anyway to not break user experience
        formElement.submit();
      });
    });
  }
})();
</script>`.trim();

    res.json({
      snippet,
      apiToken: form.apiToken,
      webhookUrl: `${apiUrl}/api/leads/capture`,
    });
  } catch (error) {
    console.error('Get form snippet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteForm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify form belongs to user's website
    const form = await prisma.form.findFirst({
      where: { id },
      include: {
        website: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!form || form.website.userId !== req.userId!) {
      return res.status(404).json({ error: 'Form not found' });
    }

    await prisma.form.delete({
      where: { id },
    });

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
