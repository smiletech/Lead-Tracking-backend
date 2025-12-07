import { z } from 'zod';

export const captureLeadSchema = z.object({
  formId: z.string(),
  data: z.record(z.string(), z.any()),
});

export type CaptureLeadInput = z.infer<typeof captureLeadSchema>;
