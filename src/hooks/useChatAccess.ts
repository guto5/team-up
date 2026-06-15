import { useEffect, useState } from 'react';
import { userHasChatAccess } from '../services/chatService';
import { Project } from '../types/project';

export function useChatAccess(
  project: Project | null | undefined,
  userId: string | undefined,
) {
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(Boolean(project && userId));

  useEffect(() => {
    if (!project || !userId) {
      setCanAccess(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    userHasChatAccess(project, userId)
      .then(setCanAccess)
      .catch(() => setCanAccess(false))
      .finally(() => setLoading(false));
  }, [project?.id, project?.creatorId, userId]);

  return { canAccess, loading };
}
