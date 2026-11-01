const projectService = require('../services/projectService');

exports.getTemplates = async (req, res, next) => {
  try {
    const templates = projectService.getTemplates();
    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const { projects, storage } = await projectService.getAllProjects();
    res.status(200).json({
      success: true,
      count: projects.length,
      storage,
      data: projects,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project with ID '${id}' could not be found.`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: project,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { project, storage } = await projectService.createProject(req.body);
    res.status(201).json({
      success: true,
      storage,
      data: project,
      message: 'Project created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await projectService.updateProject(id, req.body);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Cannot update non-existent project with ID '${id}'.`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      storage: result.storage,
      data: result.project,
      message: 'Project updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await projectService.deleteProject(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project with ID '${id}' not found to delete.`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.forkProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await projectService.forkProject(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SOURCE_PROJECT_NOT_FOUND',
          message: `Source project '${id}' not found to duplicate.`
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      storage: result.storage,
      data: result.project,
      message: 'Project cloned successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

