import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const GET = async () => {
  try {
    const filePath = join(process.cwd(), 'public', 'null-cart', 'items.json');
    const data = await readFile(filePath, 'utf-8');
    const items = JSON.parse(data);
    return Response.json(items);
  } catch (error) {
    console.error('Failed to load items:', error);
    return Response.json({ error: 'Failed to load items' }, { status: 500 });
  }
};
