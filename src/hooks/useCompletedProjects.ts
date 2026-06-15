import { useEffect, useState } from 'react';
import { subscribeToCompletedProjectsForUser } from '../services/projectService';
import { Project } from '../types/project';

export function useCompletedProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCompletedProjectsForUser(
      userId,
      (data) => {
        setProjects(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, [userId]);

  return { projects, loading };
}
