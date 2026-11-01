require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/circuit_simulator';

// Middleware
app.use(cors({
  origin: '*', // Allow Next.js client & preview access
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
    storageEngine: mongoose.connection.readyState === 1 ? 'MongoDB' : 'Resilient File Store'
  });
});

// API Routes
app.use('/api/projects', projectRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Connect to MongoDB with graceful fallback
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 2500 // Quick timeout so server doesn't hang if Mongo isn't running
})
.then(() => {
  console.log(`[MongoDB] Connected successfully to: ${MONGODB_URI}`);
})
.catch((err) => {
  console.warn(`[MongoDB Warning] Could not connect to MongoDB (${err.message}).`);
  console.warn(`[Fallback] Using local JSON storage file engine. Full CRUD persistence will work without MongoDB running!`);
});

// Start listening
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Interactive Circuit Simulator API running on port ${PORT} `);
  console.log(`  API Health: http://localhost:${PORT}/api/health         `);
  console.log(`  Projects:   http://localhost:${PORT}/api/projects       `);
  console.log(`=======================================================`);
});
