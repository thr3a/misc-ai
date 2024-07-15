import { z } from 'zod';

export const schema = z.object({
  resources: z
    .array(
      z.object({
        name: z.string().describe('Terraform resource name'),
        description: z.string().describe('A description of the purpose and what it does')
      })
    )
    .describe('Array of terraform resource name')
});
