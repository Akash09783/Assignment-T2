const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const defaultTemplates = require('../data/defaultTemplates');

// File-backed fallback storage when MongoDB is not connected
const DATA_FILE = path.join(__dirname, '../data/local_projects.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    // Seed with default templates
    const initialProjects = defaultTemplates.map(tmpl => ({
      _id: tmpl.id,
      ...tmpl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialProjects, null, 2));
  }
}

function readLocalProjects() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local projects file:', err);
    return [];
  }
}

function writeLocalProjects(projects) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing local projects file:', err);
    return false;
  }
}

const isMongoConnected = () => mongoose.connection.readyState === 1;

// GET /api/templates
exports.getTemplates = async (req, res) => {
  try {
    res.json({
      success: true,
      count: defaultTemplates.length,
      data: defaultTemplates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const projects = await Project.find().sort({ updatedAt: -1 });
      // If DB is empty, auto-seed templates
      if (projects.length === 0) {
        for (const tmpl of defaultTemplates) {
          await Project.create({
            name: tmpl.name,
            description: tmpl.description,
            category: tmpl.category,
            tags: tmpl.tags,
            components: tmpl.components,
            wires: tmpl.wires,
            code: tmpl.code
          });
        }
        const seeded = await Project.find().sort({ updatedAt: -1 });
        return res.json({ success: true, count: seeded.length, data: seeded });
      }
      return res.json({ success: true, count: projects.length, data: projects });
    }

    // Fallback: local file store
    const localProjects = readLocalProjects();
    res.json({ success: true, count: localProjects.length, data: localProjects, storage: 'local-file' });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check template match first
    const templateMatch = defaultTemplates.find(t => t.id === id);
    if (templateMatch && !isMongoConnected()) {
      return res.json({ success: true, data: { _id: templateMatch.id, ...templateMatch } });
    }

    if (isMongoConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const project = await Project.findById(id);
        if (project) return res.json({ success: true, data: project });
      }
      // Or search by custom id in templates
      if (templateMatch) {
        return res.json({ success: true, data: templateMatch });
      }
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Fallback local file
    const localProjects = readLocalProjects();
    const found = localProjects.find(p => p._id === id || p.id === id);
    if (!found) {
      if (templateMatch) return res.json({ success: true, data: templateMatch });
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: found });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description, category, tags, components, wires, code, thumbnail } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const newProjectData = {
      name,
      description: description || '',
      category: category || 'General',
      tags: tags || [],
      components: components || [],
      wires: wires || [],
      code: code || '',
      thumbnail: thumbnail || ''
    };

    if (isMongoConnected()) {
      const project = await Project.create(newProjectData);
      return res.status(201).json({ success: true, data: project });
    }

    // Fallback: local file store
    const localProjects = readLocalProjects();
    const newLocalProject = {
      _id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...newProjectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localProjects.unshift(newLocalProject);
    writeLocalProjects(localProjects);

    res.status(201).json({ success: true, data: newLocalProject, storage: 'local-file' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (isMongoConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid Project ID' });
      }
      const updated = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      return res.json({ success: true, data: updated });
    }

    // Fallback: local file store
    const localProjects = readLocalProjects();
    const index = localProjects.findIndex(p => p._id === id || p.id === id);
    if (index === -1) {
      // If updating a template, save it as a new clone
      const newLocal = {
        _id: 'proj_' + Date.now(),
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      localProjects.unshift(newLocal);
      writeLocalProjects(localProjects);
      return res.json({ success: true, data: newLocal });
    }

    localProjects[index] = {
      ...localProjects[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    writeLocalProjects(localProjects);

    res.json({ success: true, data: localProjects[index], storage: 'local-file' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid Project ID' });
      }
      const deleted = await Project.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      return res.json({ success: true, message: 'Project deleted successfully' });
    }

    // Fallback: local file store
    let localProjects = readLocalProjects();
    localProjects = localProjects.filter(p => p._id !== id && p.id !== id);
    writeLocalProjects(localProjects);

    res.json({ success: true, message: 'Project deleted successfully from local storage' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/fork/:id
exports.forkProject = async (req, res) => {
  try {
    const { id } = req.params;

    let sourceProject = null;
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(id)) {
      sourceProject = await Project.findById(id).lean();
    }
    if (!sourceProject) {
      const localProjects = readLocalProjects();
      sourceProject = localProjects.find(p => p._id === id || p.id === id);
    }
    if (!sourceProject) {
      sourceProject = defaultTemplates.find(t => t.id === id);
    }

    if (!sourceProject) {
      return res.status(404).json({ success: false, message: 'Source project not found to fork' });
    }

    const forkedData = {
      name: `${sourceProject.name} (Copy)`,
      description: sourceProject.description,
      category: sourceProject.category,
      tags: sourceProject.tags,
      components: JSON.parse(JSON.stringify(sourceProject.components || [])),
      wires: JSON.parse(JSON.stringify(sourceProject.wires || [])),
      code: sourceProject.code,
      thumbnail: sourceProject.thumbnail || ''
    };

    if (isMongoConnected()) {
      const cloned = await Project.create(forkedData);
      return res.status(201).json({ success: true, data: cloned });
    }

    const localProjects = readLocalProjects();
    const clonedLocal = {
      _id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...forkedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localProjects.unshift(clonedLocal);
    writeLocalProjects(localProjects);

    res.status(201).json({ success: true, data: clonedLocal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
