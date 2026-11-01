import { ProjectData } from '../types/circuit';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5000/api';
}

const LOCAL_STORAGE_KEY = 'circuit_simulator_projects';

// Check if backend API is reachable
export async function checkApiHealth(): Promise<boolean> {
  const apiBase = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Fetch all projects
export async function fetchProjects(): Promise<ProjectData[]> {
  const apiBase = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/projects`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('API fetch failed, falling back to local cache:', err);
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
  }
  return [];
}

// Fetch project by ID or template ID
export async function fetchProjectById(id: string): Promise<ProjectData | null> {
  const apiBase = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/projects/${id}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('API fetch by ID failed:', err);
  }

  // Fallback check in localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const list: ProjectData[] = JSON.parse(cached);
        return list.find(p => p._id === id || p.id === id) || null;
      } catch (e) {}
    }
  }
  return null;
}

// Save or create project
export async function saveProject(project: Partial<ProjectData>): Promise<ProjectData> {
  const apiBase = getApiBaseUrl();
  const isExisting = Boolean(project._id || (project.id && !project.id.startsWith('esp32-')));
  const id = project._id || project.id;

  try {
    const url = isExisting ? `${apiBase}/projects/${id}` : `${apiBase}/projects`;
    const method = isExisting ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        saveToLocalStorage(data.data);
        return data.data;
      }
    }
  } catch (err) {
    console.warn('Server save failed, using local storage:', err);
  }

  const savedProject: ProjectData = {
    _id: id || 'local_' + Date.now(),
    name: project.name || 'Untitled Circuit',
    description: project.description || '',
    category: project.category || 'General',
    tags: project.tags || [],
    components: project.components || [],
    wires: project.wires || [],
    code: project.code || '',
    updatedAt: new Date().toISOString()
  };

  saveToLocalStorage(savedProject);
  return savedProject;
}

// Delete project
export async function deleteProject(id: string): Promise<boolean> {
  const apiBase = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      removeFromLocalStorage(id);
      return true;
    }
  } catch (err) {
    console.warn('Server delete failed, updating local storage only:', err);
  }

  removeFromLocalStorage(id);
  return true;
}

// Fork project
export async function forkProject(id: string): Promise<ProjectData | null> {
  const apiBase = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/projects/fork/${id}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        saveToLocalStorage(data.data);
        return data.data;
      }
    }
  } catch (err) {
    console.warn('Fork via API failed:', err);
  }
  return null;
}

function saveToLocalStorage(proj: ProjectData) {
  if (typeof window === 'undefined') return;
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const id = proj._id || proj.id;
    const index = current.findIndex((p: any) => (p._id || p.id) === id);
    if (index >= 0) {
      current[index] = proj;
    } else {
      current.unshift(proj);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {}
}

function removeFromLocalStorage(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const filtered = current.filter((p: any) => (p._id || p.id) !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {}
}

