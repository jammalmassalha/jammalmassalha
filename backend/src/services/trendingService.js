import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockPath = path.resolve(__dirname, '../data/mockTrending.json');

export const fetchTrendingProducts = async () => {
  // Replace this file-backed source with a marketplace API or a scraper pipeline.
  const fileContents = await fs.readFile(mockPath, 'utf-8');
  const products = JSON.parse(fileContents);

  return products.map((product, index) => ({
    ...product,
    rank: index + 1,
  }));
};
