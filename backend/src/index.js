import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config.js';
import { requireAdmin } from './middleware/adminAuth.js';
import {
  createCatalogProduct,
  fetchFeaturedProducts,
  fetchTopUsaProducts,
  setFeaturedProducts,
} from './services/trendingService.js';
import { verifyWebhookSignature } from './services/signature.js';

const app = express();

const normalizeProfitRange = () => {
  const min = Number.isFinite(config.minProfitUsd) ? config.minProfitUsd : 5;
  const max = Number.isFinite(config.maxProfitUsd) ? config.maxProfitUsd : 10;

  if (min <= max) {
    return { min, max };
  }

  return { min: max, max: min };
};

const calculateProfitForProduct = (productId) => {
  const { min, max } = normalizeProfitRange();
  const span = Math.floor(max - min) + 1;

  if (span <= 1) {
    return Number(min.toFixed(2));
  }

  // Deterministic hash keeps margin stable per product across requests.
  const hash = String(productId)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return Number((min + (hash % span)).toFixed(2));
};

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile browsers, localhost tooling, and non-browser clients.
      const isCodespacesOrigin = Boolean(origin && origin.endsWith('.app.github.dev'));

      if (!origin || config.allowedOrigins.includes(origin) || isCodespacesOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS blocked for origin: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-api-key', 'x-payment-signature'],
  })
);
app.use(morgan('dev'));
app.use('/api/payments/callback', express.text({ type: '*/*' }));
app.use(express.json());

const orders = [];

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'dropshopping-backend' });
});

app.get('/', (_req, res) => {
  res.json({
    service: 'dropshopping-backend',
    status: 'running',
    docs: [
      '/health',
      '/api/products/trending',
      '/api/admin/products/top-usa',
      '/api/admin/products/featured',
      '/api/orders',
      '/api/admin/orders',
    ],
  });
});

app.get('/api/products/trending', async (_req, res, next) => {
  try {
    const products = (await fetchFeaturedProducts()).map((product) => {
      const originalPriceUsd = Number(product.priceUsd);
      const profitUsd = calculateProfitForProduct(product.id);
      const appPriceUsd = Number((originalPriceUsd + profitUsd).toFixed(2));

      return {
        ...product,
        originalPriceUsd,
        profitUsd,
        appPriceUsd,
        // Keep priceUsd as displayed app price for existing clients.
        priceUsd: appPriceUsd,
      };
    });

    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/products/top-usa', requireAdmin, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 10);
    const products = await fetchTopUsaProducts(limit);
    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/products/featured', requireAdmin, async (_req, res, next) => {
  try {
    const products = await fetchFeaturedProducts();
    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/products/featured', requireAdmin, async (req, res, next) => {
  try {
    const productIds = req.body?.productIds;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: 'productIds must be an array' });
    }

    const products = await setFeaturedProducts(productIds);
    return res.json({ products, count: products.length });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res, next) => {
  try {
    const { title, category, priceUsd, imageUrl, salesLast30d, source } = req.body || {};

    if (!title || !category || !priceUsd || !imageUrl) {
      return res.status(400).json({
        message: 'title, category, priceUsd and imageUrl are required',
      });
    }

    const product = await createCatalogProduct({
      title,
      category,
      priceUsd,
      imageUrl,
      salesLast30d,
      source,
    });

    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/orders', async (req, res) => {
  const { productId, quantity, walletAddress, chain } = req.body || {};

  if (!productId || !quantity || !walletAddress || !chain) {
    return res.status(400).json({
      message: 'productId, quantity, walletAddress and chain are required',
    });
  }

  const newOrder = {
    id: 'ord_' + (orders.length + 1).toString().padStart(5, '0'),
    productId,
    quantity,
    walletAddress,
    chain,
    status: 'pending_payment',
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  return res.status(201).json({ order: newOrder });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  res.json({ orders, total: orders.length });
});

app.post('/api/payments/callback', (req, res) => {
  const signature = req.header('x-payment-signature') || '';
  const isValid = verifyWebhookSignature(req.body || '', signature, config.paymentWebhookSecret);

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid callback signature' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body || '{}');
  } catch {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }

  const { orderId, status } = payload;
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  order.status = status || order.status;
  order.updatedAt = new Date().toISOString();

  return res.json({ ok: true, order });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
