import { z } from 'zod';

export const websiteSchema = z.object({
  url: z.string().url('Invalid URL'),
  name: z.string().optional(),
});

export const updateWebsiteSchema = z.object({
  url: z.string().url('Invalid URL').optional(),
  name: z.string().optional(),
});

export type WebsiteInput = z.infer<typeof websiteSchema>;
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;
