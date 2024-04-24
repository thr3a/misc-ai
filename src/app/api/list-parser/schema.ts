import { z } from 'zod';

export const countrySchema = z
  .array(
    z.object({
      fields: z.object({
        Name: z.string().describe('国名'),
        Capital: z.string().describe('その国の首都')
      })
    })
  )
  .describe('Airtable レコードの配列で、各レコードは国を表します。');
// .describe('An array of Airtable records, each representing a country');

export const paraphraseSchema = z
  .array(
    z.object({
      fields: z.object({
        Text: z.string().describe('Converted sentences')
      })
    })
  )
  .describe('Array of converted sentences');

export const ggrenSchema = z
  .array(
    z.object({
      fields: z.object({
        Keyword: z.string().describe('Search keywords')
      })
    })
  )
  .describe('Array of keywords');
