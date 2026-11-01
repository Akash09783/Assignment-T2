const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  forkProject,
  getTemplates
} = require('../controllers/projectController');
const { validateProjectPayload } = require('../middleware/validator');

// Template routes
router.get('/templates', getTemplates);

// Project CRUD routes
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', validateProjectPayload, createProject);
router.put('/:id', validateProjectPayload, updateProject);
router.delete('/:id', deleteProject);
router.post('/fork/:id', forkProject);

module.exports = router;
