import { useEffect, useState } from 'react';
import {
  subscribeToProjectApplications,
  subscribeToUserProjectApplications,
} from '../services/applicationService';
import { ProjectApplication } from '../types/application';

export function useUserProjectApplications(
  projectId: string,
  userId: string | undefined,
) {
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserProjectApplications(
      projectId,
      userId,
      (data) => {
        setApplications(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, [projectId, userId]);

  const appliedRoleIds = new Set(applications.map((item) => item.roleId));

  return { applications, appliedRoleIds, loading };
}

export function useAllProjectApplications(projectId: string, enabled: boolean) {
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToProjectApplications(
      projectId,
      (data) => {
        setApplications(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, [projectId, enabled]);

  const pendingApplications = applications.filter((app) => app.status === 'pending');
  const acceptedApplications = applications.filter((app) => app.status === 'accepted');

  return { applications, pendingApplications, acceptedApplications, loading };
}
