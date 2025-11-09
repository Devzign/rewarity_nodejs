require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

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

connectDB().catch((err) => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

app.get('/', (req, res) => {
  res.send('Rewarity backend running 🚀');
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

try {
  const openapi = require('./openapi.json');
  app.get('/api/openapi.json', (_req, res) => res.json(openapi));
} catch (e) {
  console.warn('OpenAPI spec not loaded:', e.message);
}

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

