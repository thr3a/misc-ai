import { z } from 'zod';

export const countrySchema = z.array(
  z.object({
    fields: z.object({
      Name: z.string().describe('国名'),
      Capital: z.string().describe('その国の首都')
    })
  })
).describe('Airtable レコードの配列で、各レコードは国を表します。');
// .describe('An array of Airtable records, each representing a country');

export const paraphraseSchema = z.array(
  z.object({
    fields: z.object({
      Text: z.string().describe('言い換えた単語/文章')
    })
  })
).describe('An array of Airtable records');
