import { useEffect, useMemo, useState } from 'react';
import {
  aggregateEndorsedSkills,
  subscribeToEndorsementsGiven,
  subscribeToEndorsementsReceived,
} from '../services/endorsementService';
import { SkillEndorsement } from '../types/endorsement';

export function useEndorsementsReceived(userId: string | undefined) {
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setEndorsements([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToEndorsementsReceived(
      userId,
      (data) => {
        setEndorsements(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, [userId]);

  const endorsedSkills = useMemo(
    () => aggregateEndorsedSkills(endorsements),
    [endorsements],
  );

  return { endorsements, endorsedSkills, loading };
}

export function useEndorsementsGiven(userId: string | undefined) {
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setEndorsements([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToEndorsementsGiven(
      userId,
      (data) => {
        setEndorsements(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, [userId]);

  return { endorsements, loading };
}
