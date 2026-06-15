import { useEffect, useState } from 'react';
import {
  subscribeToStudentClasses,
  subscribeToTeacherClasses,
} from '../services/classService';
import { Class } from '../types/class';
import { UserRole } from '../types/user';

interface UseClassesOptions {
  role?: UserRole;
  classIds?: string[];
}

export function useClasses(
  userId: string | undefined,
  { role = 'student', classIds = [] }: UseClassesOptions = {},
) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setClasses([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const unsubscribe =
      role === 'teacher'
        ? subscribeToTeacherClasses(
            userId,
            (data) => {
              setClasses(data);
              setLoading(false);
              setError(null);
            },
            (err) => {
              setError(err.message);
              setLoading(false);
            },
          )
        : subscribeToStudentClasses(
            classIds,
            (data) => {
              setClasses(data);
              setLoading(false);
              setError(null);
            },
            (err) => {
              setError(err.message);
              setLoading(false);
            },
          );

    return unsubscribe;
  }, [userId, role, classIds.join(',')]);

  return { classes, loading, error };
}
