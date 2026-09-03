import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import authRouter from './server/routes/auth.js';
import staffRouter from './server/routes/staff.js';
import auditRouter from './server/routes/audit.js';
import productsRouter from './server/routes/products.js';
import ordersRouter from './server/routes/orders.js';
import paymentsRouter from './server/routes/payments.js';
import settingsRouter from './server/routes/settings.js';
import customersRouter from './server/routes/customers.js';
import aiRouter from './server/routes/ai.js';

import { requireStaffAuth } from './server/auth.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      store: 'AKASH STORE',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Public & Customer Auth Routes
  app.use('/api/auth', authRouter);

  // CRITICAL RBAC GATEWAY:
  // Strict middleware protecting ALL /api/admin/* endpoints.
  // Blocks customers and unauthenticated requests with 403 Forbidden.
  app.use('/api/admin/*', requireStaffAuth);

  // Protected Admin API Routes
  app.use('/api/admin/staff', staffRouter);
  app.use('/api/admin/audit-logs', auditRouter);
  app.use('/api/admin/payments', paymentsRouter);
  app.use('/api/admin/customers', customersRouter);

  // Public/Customer Store Routes
  app.use('/api/products', productsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/ai', aiRouter);

  // Vite middleware in dev / Static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AKASH STORE Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
