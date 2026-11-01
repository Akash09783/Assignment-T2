function validateProjectPayload(req, res, next) {
  const { name, components, wires } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Project name is required and must be a non-empty string.'
      }
    });
  }

  if (name.length > 120) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Project name cannot exceed 120 characters.'
      }
    });
  }

  if (components && !Array.isArray(components)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Components must be provided as an array.'
      }
    });
  }

  if (wires && !Array.isArray(wires)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Wires must be provided as an array.'
      }
    });
  }

  next();
}

module.exports = { validateProjectPayload };

