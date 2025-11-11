require('dotenv').config();

const express = require('express');
const cors = require('cors');
// const path = require('path');
// const fs = require('fs');
const { connectDB } = require('./config/db');
const { seedAdmin } = require('./controllers/userController');
const { auth } = require('./middleware/auth');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins, credentials: true }));
} else {
  app.use(cors());
}
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Global auth gate: require token for all APIs except public auth endpoints
const PUBLIC_ROUTES = [
  { method: 'POST', pattern: /^\/api\/auth\/(login|register|request-otp|verify-otp)$/i },
  { method: 'GET', pattern: /^\/$/ },
  { method: 'GET', pattern: /^\/api\/openapi\.json$/i },
  { method: 'GET', pattern: /^\/swagger(?:\/.*)?$/i },
  { method: 'GET', pattern: /^\/(?:api\/)?docs$/i },
];

app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (method === 'OPTIONS') return next(); // Allow CORS preflight
  const path = req.path;
  const isPublic = PUBLIC_ROUTES.some((r) => (!r.method || r.method === method) && r.pattern.test(path));
  if (isPublic) return next();
  return auth(req, res, next);
});

connectDB()
  .then(async () => {
    try {
      await seedAdmin();
    } catch (e) {
      console.error('Admin seed failed:', e.message);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Rewarity backend running 🚀');
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user-types', require('./routes/userTypeRoutes'));
app.use('/api/colors', require('./routes/colorRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/dev', require('./routes/devRoutes'));
app.use('/api/master', require('./routes/masterRoutes'));
app.use('/api/product-config', require('./routes/productConfigRoutes'));
app.use('/api/rewards', require('./routes/rewardRoutes'));

try {
  const openapi = require('./openapi.json');
  app.get('/api/openapi.json', (_req, res) => res.json(openapi));
} catch (e) {
  console.warn('OpenAPI spec not loaded:', e.message);
}

// Swagger UI (static HTML using CDN)
app.use('/swagger', require('express').static('public/swagger'));
app.get(['/api/docs', '/docs'], (_req, res) => res.redirect('/swagger'));

const PORT = process.env.PORT || 5000;

// Admin panel serving removed — front-end will be deployed separately.

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found', path: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`🚀 Rewarity server running on port ${PORT}`));
