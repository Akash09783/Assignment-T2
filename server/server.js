require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const { PORT, CLIENT_URL, NODE_ENV } = require('./src/config/constants');
const { connectDatabase } = require('./src/config/database');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const projectRoutes = require('./src/routes/projectRoutes');
const healthRoutes = require('./src/routes/healthRoutes');

const app = express();

// 1. Enterprise Security & Compression Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allows dynamic 3D WebGL assets & canvas renders
}));
app.use(compression());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 2. Rate Limiting on API endpoints
app.use('/api', apiLimiter);

// 3. API Routes
app.use('/api/health', healthRoutes);
app.use('/api/projects', projectRoutes);

// Root greeting endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Interactive 3D Electronic Circuit Designer & Simulator API',
    version: '1.0.0',
    status: 'online',
    documentation: '/api/health'
  });
});

// 4. 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// 5. Connect Database and Start Server
let server;

async function startServer() {
  await connectDatabase();

  server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Interactive Circuit Simulator API running on port ${PORT} `);
    console.log(`  API Health: http://localhost:${PORT}/api/health         `);
    console.log(`  Projects:   http://localhost:${PORT}/api/projects       `);
    console.log(`=======================================================`);
  });
}

startServer();

// Graceful Termination
const gracefulShutdown = () => {
  console.log('\n[Process] Gracefully shutting down server...');
  if (server) {
    server.close(() => {
      console.log('[Process] Server closed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = app;
