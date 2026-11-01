'use client';

import { useState, useCallback, useEffect } from 'react';
import { ProjectData, PlacedComponent, Wire } from '../types/circuit';
import { fetchProjects, saveProject, deleteProject, forkProject } from '../lib/api';

export function useProjectsApi() {
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      const list = await fetchProjects();
      setSavedProjects(list);
    } catch (err) {
      console.warn('Could not refresh projects list:', err);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const saveCurrentProject = useCallback(async (
    currentProject: ProjectData,
    components: PlacedComponent[],
    wires: Wire[],
    code: string
  ): Promise<ProjectData | null> => {
    setIsSaving(true);
    const updatedPayload: ProjectData = {
      ...currentProject,
      components,
      wires,
      code,
      updatedAt: new Date().toISOString()
    };

    try {
      const saved = await saveProject(updatedPayload);
      await refreshProjects();
      showToast('Project saved successfully to persistent storage!');
      return saved;
    } catch (err) {
      showToast('Saved locally (Offline mode).');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [refreshProjects, showToast]);

  const forkExisting = useCallback(async (id: string): Promise<ProjectData | null> => {
    const cloned = await forkProject(id);
    if (cloned) {
      await refreshProjects();
      showToast(`Project duplicated: ${cloned.name}`);
      return cloned;
    }
    return null;
  }, [refreshProjects, showToast]);

  const deleteExisting = useCallback(async (id: string): Promise<boolean> => {
    const ok = await deleteProject(id);
    if (ok) {
      await refreshProjects();
      showToast('Project removed.');
    }
    return ok;
  }, [refreshProjects, showToast]);

  const exportProjectJson = useCallback((
    project: ProjectData,
    components: PlacedComponent[],
    wires: Wire[],
    code: string
  ) => {
    const data = { ...project, components, wires, code };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Circuit project exported as JSON file.');
  }, [showToast]);

  const shareProject = useCallback((project: ProjectData) => {
    if (typeof window !== 'undefined') {
      const id = project._id || project.id || '';
      const shareUrl = `${window.location.origin}?project=${encodeURIComponent(id)}`;
      navigator.clipboard.writeText(shareUrl);
      showToast('Shareable project link copied to clipboard!');
    }
  }, [showToast]);

  return {
    savedProjects,
    isSaving,
    toastMessage,
    refreshProjects,
    saveCurrentProject,
    forkExisting,
    deleteExisting,
    exportProjectJson,
    shareProject
  };
}

