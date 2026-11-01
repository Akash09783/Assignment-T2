function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  };

  if (statusCode >= 500) {
    console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};

