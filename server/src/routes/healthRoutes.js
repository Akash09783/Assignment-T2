const express = require('express');
const router = express.Router();
const { getDatabaseStatus } = require('../config/database');

router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const uptimeSeconds = Math.floor(process.uptime());

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    environment: process.env.NODE_ENV || 'development',
    runtime: {
      node: process.version,
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    },
    database: {
      connected: dbStatus.connected,
      storageEngine: dbStatus.connected ? 'MongoDB' : 'Resilient File Store'
    }
  });
});

module.exports = router;

