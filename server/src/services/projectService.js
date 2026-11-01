const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const defaultTemplates = require('../data/defaultTemplates');
const { getDatabaseStatus } = require('../config/database');

const LOCAL_DATA_FILE = path.join(__dirname, '../data/local_projects.json');

class ProjectService {
  constructor() {
    this.ensureDataStore();
  }

  ensureDataStore() {
    const dir = path.dirname(LOCAL_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DATA_FILE)) {
      const initial = defaultTemplates.map(t => ({
        _id: t.id,
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(initial, null, 2));
    }
  }

  readLocalStore() {
    this.ensureDataStore();
    try {
      const content = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error('[Storage Error] Read local store failed:', err);
      return [];
    }
  }

  writeLocalStore(data) {
    this.ensureDataStore();
    try {
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('[Storage Error] Write local store failed:', err);
      return false;
    }
  }

  isMongoActive() {
    return getDatabaseStatus().connected;
  }

  getTemplates() {
    return defaultTemplates;
  }

  async getAllProjects() {
    if (this.isMongoActive()) {
      let projects = await Project.find().sort({ updatedAt: -1 }).lean();
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
        projects = await Project.find().sort({ updatedAt: -1 }).lean();
      }
      return { projects, storage: 'MongoDB' };
    }

    const localProjects = this.readLocalStore();
    return { projects: localProjects, storage: 'Resilient File Store' };
  }

  async getProjectById(id) {
    const template = defaultTemplates.find(t => t.id === id);

    if (this.isMongoActive()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const found = await Project.findById(id).lean();
        if (found) return found;
      }
      if (template) return template;
      return null;
    }

    const localProjects = this.readLocalStore();
    const found = localProjects.find(p => p._id === id || p.id === id);
    return found || template || null;
  }

  async createProject(projectData) {
    const payload = {
      name: projectData.name.trim(),
      description: projectData.description || '',
      category: projectData.category || 'General',
      tags: projectData.tags || [],
      components: projectData.components || [],
      wires: projectData.wires || [],
      code: projectData.code || '',
      thumbnail: projectData.thumbnail || ''
    };

    if (this.isMongoActive()) {
      const created = await Project.create(payload);
      return { project: created.toObject(), storage: 'MongoDB' };
    }

    const localProjects = this.readLocalStore();
    const newEntry = {
      _id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localProjects.unshift(newEntry);
    this.writeLocalStore(localProjects);
    return { project: newEntry, storage: 'Resilient File Store' };
  }

  async updateProject(id, updateData) {
    if (this.isMongoActive()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const updated = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
      return updated ? { project: updated, storage: 'MongoDB' } : null;
    }

    const localProjects = this.readLocalStore();
    const index = localProjects.findIndex(p => p._id === id || p.id === id);

    if (index === -1) {
      // Clones template as new instance if modifying pre-seeded template
      const newEntry = {
        _id: `proj_${Date.now()}`,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      localProjects.unshift(newEntry);
      this.writeLocalStore(localProjects);
      return { project: newEntry, storage: 'Resilient File Store' };
    }

    localProjects[index] = {
      ...localProjects[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.writeLocalStore(localProjects);
    return { project: localProjects[index], storage: 'Resilient File Store' };
  }

  async deleteProject(id) {
    if (this.isMongoActive()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const deleted = await Project.findByIdAndDelete(id);
      return Boolean(deleted);
    }

    let localProjects = this.readLocalStore();
    const initialLen = localProjects.length;
    localProjects = localProjects.filter(p => p._id !== id && p.id !== id);
    this.writeLocalStore(localProjects);
    return localProjects.length < initialLen;
  }

  async forkProject(id) {
    const source = await this.getProjectById(id);
    if (!source) return null;

    const forkedPayload = {
      name: `${source.name} (Copy)`,
      description: source.description || '',
      category: source.category || 'General',
      tags: source.tags || [],
      components: JSON.parse(JSON.stringify(source.components || [])),
      wires: JSON.parse(JSON.stringify(source.wires || [])),
      code: source.code || '',
      thumbnail: source.thumbnail || ''
    };

    return this.createProject(forkedPayload);
  }
}

module.exports = new ProjectService();

