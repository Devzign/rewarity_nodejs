require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { seedAdmin } = require('./controllers/userController');

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
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/dev', require('./routes/devRoutes'));

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
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found', path: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`🚀 Rewarity server running on port ${PORT}`));
