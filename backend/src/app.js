import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Veylix Ecommerce Backend API',
      version: '1.0.0',
      healthEndpoint: '/api/health'
    },
    meta: {}
  });
});

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
