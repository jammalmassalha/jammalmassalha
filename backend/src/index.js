import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config.js';
import { requireAdmin } from './middleware/adminAuth.js';
import { fetchTrendingProducts } from './services/trendingService.js';
import { verifyWebhookSignature } from './services/signature.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile browsers, localhost tooling, and non-browser clients.
      if (!origin || config.allowedOrigins.includes(origin)) {
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

app.get('/api/products/trending', async (_req, res, next) => {
  try {
    const products = await fetchTrendingProducts();
    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
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
