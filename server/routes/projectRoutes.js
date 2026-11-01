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

// Routes
router.get('/templates', getTemplates);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/fork/:id', forkProject);

module.exports = router;
