import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import { SkillEndorsement } from '../types/endorsement';
import { EndorsedSkill } from '../types/user';

function getEndorsementId(
  projectId: string,
  endorserId: string,
  endorseeId: string,
  skillName: string,
) {
  return `${projectId}_${endorserId}_${endorseeId}_${skillName}`
    .replace(/\s+/g, '_')
    .toLowerCase();
}

export function subscribeToEndorsementsReceived(
  userId: string,
  onData: (endorsements: SkillEndorsement[]) => void,
  onError?: (error: Error) => void,
) {
  const endorsementsQuery = query(
    collection(db, 'endorsements'),
    where('endorseeId', '==', userId),
  );

  return onSnapshot(
    endorsementsQuery,
    (snapshot) => {
      const endorsements = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<SkillEndorsement, 'id'>),
      }));
      onData(endorsements);
    },
    (error) => onError?.(error),
  );
}

export function subscribeToEndorsementsGiven(
  userId: string,
  onData: (endorsements: SkillEndorsement[]) => void,
  onError?: (error: Error) => void,
) {
  const endorsementsQuery = query(
    collection(db, 'endorsements'),
    where('endorserId', '==', userId),
  );

  return onSnapshot(
    endorsementsQuery,
    (snapshot) => {
      const endorsements = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<SkillEndorsement, 'id'>),
      }));
      onData(endorsements);
    },
    (error) => onError?.(error),
  );
}

export function aggregateEndorsedSkills(
  endorsements: SkillEndorsement[],
): EndorsedSkill[] {
  const counts = new Map<string, number>();

  for (const endorsement of endorsements) {
    counts.set(endorsement.skillName, (counts.get(endorsement.skillName) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, endorserCount]) => ({ name, endorserCount }))
    .sort((a, b) => b.endorserCount - a.endorserCount);
}

export async function endorseTeammateSkill(
  endorser: User,
  endorseeId: string,
  projectId: string,
  projectTitle: string,
  skillName: string,
): Promise<void> {
  if (endorser.uid === endorseeId) {
    throw new Error('Você não pode validar suas próprias skills.');
  }

  const endorsementRef = doc(
    db,
    'endorsements',
    getEndorsementId(projectId, endorser.uid, endorseeId, skillName),
  );

  const existing = await getDoc(endorsementRef);
  if (existing.exists()) {
    throw new Error('Você já validou esta skill para este colega neste projeto.');
  }

  await setDoc(endorsementRef, {
    projectId,
    projectTitle,
    endorserId: endorser.uid,
    endorserName: endorser.displayName ?? 'Estudante',
    endorseeId,
    skillName,
    createdAt: serverTimestamp(),
  });
}
