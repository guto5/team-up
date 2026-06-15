import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import {
  CompletedProject,
  ProfileUpdateData,
  SetupFormData,
  UserProfile,
} from '../types/user';
import { Project } from '../types/project';
import { ProjectApplication } from '../types/application';
import { createPortfolioSlug } from '../utils/portfolio';

export function subscribeToUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      onData(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    },
    (error) => onError?.(error),
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

export async function saveUserProfile(
  user: User,
  data: SetupFormData,
): Promise<void> {
  const existing = await getUserProfile(user.uid);

  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      email: user.email ?? '',
      displayName: data.displayName?.trim() || user.displayName || user.email?.split('@')[0] || 'Usuário',
      photoURL: data.photoURL ?? existing?.photoURL ?? user.photoURL ?? null,
      phone: data.phone,
      role: data.role,
      semester: data.semester ?? null,
      bio: data.bio,
      skills: data.skills,
      classIds: existing?.classIds ?? [],
      endorsedSkills: existing?.endorsedSkills ?? [],
      completedProjects: existing?.completedProjects ?? [],
      portfolioSlug:
        existing?.portfolioSlug ??
        createPortfolioSlug(user.displayName ?? 'user', user.uid),
      profileComplete: true,
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateUserProfile(
  uid: string,
  data: ProfileUpdateData,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function appendCompletedProjectToUser(
  uid: string,
  project: CompletedProject,
): Promise<void> {
  const existing = await getUserProfile(uid);
  const completedProjects = existing?.completedProjects ?? [];

  const alreadyExists = completedProjects.some((item) => item.id === project.id);
  if (alreadyExists) return;

  await setDoc(
    doc(db, 'users', uid),
    {
      completedProjects: [...completedProjects, project],
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function formatCompletedProjectPeriod(completedAt: unknown): string {
  if (
    completedAt &&
    typeof completedAt === 'object' &&
    'toDate' in completedAt &&
    typeof completedAt.toDate === 'function'
  ) {
    return completedAt.toDate().toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
    });
  }

  return new Date().toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  });
}

async function resolveParticipantRole(
  project: Project,
  userId: string,
): Promise<string> {
  if (project.participantRoles?.[userId]) {
    return project.participantRoles[userId];
  }

  if (userId === project.creatorId) {
    return 'Criador(a) do projeto';
  }

  const applicationsSnap = await getDocs(
    collection(db, 'projects', project.id, 'applications'),
  );

  const acceptedApp = applicationsSnap.docs
    .map((docSnap) => docSnap.data() as ProjectApplication)
    .find((app) => app.userId === userId && app.status === 'accepted');

  return acceptedApp?.roleTitle ?? 'Membro da equipe';
}

function buildCompletedProjectEntry(
  project: Project,
  userId: string,
  role: string,
): CompletedProject {
  const isCreator = userId === project.creatorId;
  const period = formatCompletedProjectPeriod(project.completedAt);

  return {
    id: isCreator ? `${project.id}-creator` : `${project.id}-${userId}`,
    title: project.title,
    role,
    period,
    description: isCreator
      ? project.description.slice(0, 180)
      : `Projeto concluído no TeamUp. Papel: ${role}.`,
  };
}

export async function syncCompletedProjectsForUser(uid: string): Promise<void> {
  const existing = await getUserProfile(uid);
  if (!existing) return;

  const projectsSnap = await getDocs(
    query(
      collection(db, 'projects'),
      where('status', '==', 'completed'),
      where('participantIds', 'array-contains', uid),
    ),
  );

  const syncedEntries: CompletedProject[] = [];

  for (const projectDoc of projectsSnap.docs) {
    const project = {
      id: projectDoc.id,
      ...(projectDoc.data() as Omit<Project, 'id'>),
    };
    const role = await resolveParticipantRole(project, uid);
    syncedEntries.push(buildCompletedProjectEntry(project, uid, role));
  }

  const currentProjects = existing.completedProjects ?? [];
  const mergedById = new Map(
    [...currentProjects, ...syncedEntries].map((entry) => [entry.id, entry]),
  );
  const mergedProjects = [...mergedById.values()];

  const hasChanges = syncedEntries.some((entry) => {
    const current = currentProjects.find((item) => item.id === entry.id);
    return (
      !current ||
      current.role !== entry.role ||
      current.title !== entry.title ||
      current.description !== entry.description
    );
  });

  if (!hasChanges) return;

  await setDoc(
    doc(db, 'users', uid),
    {
      completedProjects: mergedProjects,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
