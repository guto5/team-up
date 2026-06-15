import { useEffect, useState } from 'react';
import {
  MyTeamProjectsData,
  SkippedTeamProject,
  subscribeToMyTeamProjects,
  TeamProjectEntry,
} from '../services/myProjectsService';

export function useMyTeamProjects(userId: string | undefined) {
  const [entries, setEntries] = useState<TeamProjectEntry[]>([]);
  const [skippedClassProjects, setSkippedClassProjects] = useState<
    SkippedTeamProject[]
  >([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setSkippedClassProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToMyTeamProjects(
      userId,
      (data: MyTeamProjectsData) => {
        setEntries(data.entries);
        setSkippedClassProjects(data.skippedClassProjects);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  return { entries, skippedClassProjects, loading, error };
}
