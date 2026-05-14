import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockPath = path.resolve(__dirname, '../data/usaTopSellers.json');

let catalogCache = null;
let featuredProductIds = [];

const ensureCatalog = async () => {
  if (catalogCache) {
    return catalogCache;
  }

  // Replace this file-backed source with a marketplace API or a compliant scraper pipeline.
  const fileContents = await fs.readFile(mockPath, 'utf-8');
  catalogCache = JSON.parse(fileContents);

  if (featuredProductIds.length === 0) {
    featuredProductIds = catalogCache
      .slice()
      .sort((a, b) => Number(b.salesLast30d || 0) - Number(a.salesLast30d || 0))
      .slice(0, 4)
      .map((item) => item.id);
  }

  return catalogCache;
};

const withRankAndFeature = (items) =>
  items.map((item, index) => ({
    ...item,
    rank: index + 1,
    isFeatured: featuredProductIds.includes(item.id),
  }));

export const fetchTopUsaProducts = async (limit = 10) => {
  const catalog = await ensureCatalog();
  const sorted = catalog
    .slice()
    .sort((a, b) => Number(b.salesLast30d || 0) - Number(a.salesLast30d || 0))
    .slice(0, limit);

  return withRankAndFeature(sorted);
};

export const fetchFeaturedProducts = async () => {
  const top = await fetchTopUsaProducts(10);
  return top.filter((item) => featuredProductIds.includes(item.id));
};

export const setFeaturedProducts = async (productIds) => {
  const top = await fetchTopUsaProducts(10);
  const topIds = new Set(top.map((item) => item.id));
  featuredProductIds = productIds.filter((id) => topIds.has(id)).slice(0, 10);

  return fetchFeaturedProducts();
};

export const createCatalogProduct = async (product) => {
  const catalog = await ensureCatalog();
  const suffix = String(catalog.length + 1).padStart(4, '0');

  const newProduct = {
    id: `p-${suffix}`,
    title: product.title,
    category: product.category,
    priceUsd: Number(product.priceUsd),
    imageUrl: product.imageUrl,
    source: product.source || 'manual-admin-entry',
    salesLast30d: Number(product.salesLast30d || 0),
  };

  catalogCache = [newProduct, ...catalog];
  return newProduct;
};
