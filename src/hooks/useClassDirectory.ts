import { useEffect, useState } from 'react';
import { subscribeToClassDirectory } from '../services/classService';
import { ClassDirectory, emptyClassDirectory } from '../utils/class';

export function useClassDirectory() {
  const [directory, setDirectory] = useState<ClassDirectory>(emptyClassDirectory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToClassDirectory(
      (data) => {
        setDirectory(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, []);

  return { directory, loading };
}
