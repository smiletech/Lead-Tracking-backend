import { z } from 'zod';

export const detectFormSchema = z.object({
  websiteId: z.string(),
  url: z.string().url('Invalid URL'),
});

export const createFormSchema = z.object({
  websiteId: z.string(),
  name: z.string(),
  url: z.string().url('Invalid URL'),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      label: z.string().optional(),
      placeholder: z.string().optional(),
      required: z.boolean().default(false),
    })
  ),
});

export type DetectFormInput = z.infer<typeof detectFormSchema>;
export type CreateFormInput = z.infer<typeof createFormSchema>;
