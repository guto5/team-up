import { useEffect, useState } from 'react';
import { subscribeToUserProfile } from '../services/userService';
import { UserProfile } from '../types/user';

export function useUserProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserProfile(
      uid,
      (data) => {
        setProfile(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return {
    profile,
    loading,
    error,
    isProfileComplete: profile?.profileComplete ?? false,
  };
}
