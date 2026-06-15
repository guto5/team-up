import { useEffect, useState } from 'react';
import { subscribeToProject } from '../services/projectService';
import { Project } from '../types/project';

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProject(
      projectId,
      (data) => {
        setProject(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [projectId]);

  return { project, loading, error };
}
