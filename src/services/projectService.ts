import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import { CreateProjectInput, Project, UpdateProjectInput } from '../types/project';
import { ProjectApplication } from '../types/application';
import { createProjectChat } from './chatService';
import { getUserProfile, syncCompletedProjectsForUser } from './userService';
import { resolveDisplayName } from '../utils/user';

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => {
    if (a.isBoosted !== b.isBoosted) {
      return a.isBoosted ? -1 : 1;
    }

    const aTime = getTimestampValue(a.createdAt);
    const bTime = getTimestampValue(b.createdAt);
    return bTime - aTime;
  });
}

function getTimestampValue(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (typeof value === 'string') {
    return new Date(value).getTime();
  }

  return 0;
}

function generateRoleId() {
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function subscribeToProject(
  projectId: string,
  onData: (project: Project | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, 'projects', projectId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData({
        id: snapshot.id,
        ...(snapshot.data() as Omit<Project, 'id'>),
      });
    },
    (error) => onError?.(error),
  );
}

export function subscribeToProjectsByClassCode(
  classCode: string,
  onData: (projects: Project[]) => void,
  onError?: (error: Error) => void,
) {
  const projectsQuery = query(
    collection(db, 'projects'),
    where('classTag', '==', classCode),
  );

  return onSnapshot(
    projectsQuery,
    (snapshot) => {
      const projects = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Project, 'id'>),
      }));
      onData(sortProjects(projects));
    },
    (error) => onError?.(error),
  );
}

export function subscribeToOpenProjects(
  onData: (projects: Project[]) => void,
  onError?: (error: Error) => void,
) {
  const projectsQuery = query(
    collection(db, 'projects'),
    where('status', '==', 'open'),
  );

  return onSnapshot(
    projectsQuery,
    (snapshot) => {
      const projects = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Project, 'id'>),
      }));
      onData(sortProjects(projects));
    },
    (error) => onError?.(error),
  );
}

export function subscribeToCompletedProjectsForUser(
  userId: string,
  onData: (projects: Project[]) => void,
  onError?: (error: Error) => void,
) {
  const projectsQuery = query(
    collection(db, 'projects'),
    where('status', '==', 'completed'),
    where('participantIds', 'array-contains', userId),
  );

  return onSnapshot(
    projectsQuery,
    (snapshot) => {
      const projects = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Project, 'id'>),
      }));
      onData(projects);
    },
    (error) => onError?.(error),
  );
}

const DEFAULT_CLASS_ROLE = {
  title: 'Equipe do projeto',
  quantity: 1,
  requirements: [] as string[],
};

export async function createProject(
  user: User,
  input: CreateProjectInput,
): Promise<string> {
  const roleInputs =
    input.scope === 'class' && input.roles.length === 0
      ? [DEFAULT_CLASS_ROLE]
      : input.roles;

  if (roleInputs.length === 0) {
    throw new Error('Adicione pelo menos uma vaga ao projeto.');
  }

  const projectRef = doc(collection(db, 'projects'));
  const roles = roleInputs.map((role) => ({
    id: generateRoleId(),
    title: role.title.trim(),
    quantity: role.quantity,
    filled: 0,
    requirements: role.requirements,
  }));

  const userProfile = await getUserProfile(user.uid);
  const creatorName = resolveDisplayName(userProfile, user);
  const creatorPhotoURL = userProfile?.photoURL ?? user.photoURL ?? null;

  await setDoc(projectRef, {
    title: input.title.trim(),
    description: input.description.trim(),
    projectUrl: input.projectUrl?.trim() || null,
    deadline: input.deadline,
    isBoosted: false,
    classTag: input.classTag?.trim() || null,
    classId: input.classId ?? null,
    className: input.className?.trim() || null,
    scope: input.scope,
    creatorId: user.uid,
    creatorName,
    creatorPhotoURL,
    creatorSubtitle: 'Criador(a) do projeto',
    roles,
    status: 'open',
    teamMemberIds: [user.uid],
    createdAt: serverTimestamp(),
  });

  if (input.scope === 'public') {
    await createProjectChat({
      id: projectRef.id,
      title: input.title.trim(),
      creatorId: user.uid,
      creatorName,
      creatorPhotoURL,
    });
  }

  return projectRef.id;
}

export async function updateProject(
  project: Project,
  userId: string,
  input: UpdateProjectInput,
): Promise<void> {
  if (project.creatorId !== userId) {
    throw new Error('Somente o criador pode editar este projeto.');
  }

  if (project.status === 'completed') {
    throw new Error('Projetos concluídos não podem ser editados.');
  }

  const updatePayload: Record<string, unknown> = {
    title: input.title.trim(),
    description: input.description.trim(),
    projectUrl: input.projectUrl?.trim() || null,
    deadline: input.deadline,
  };

  if (input.roles && project.scope !== 'class') {
    const updatedRoles = project.roles.map((existing, index) => {
      const incoming = input.roles![index];
      if (!incoming?.title.trim()) {
        return existing;
      }

      return {
        ...existing,
        title: incoming.title.trim(),
        quantity: Math.max(existing.filled, incoming.quantity),
        requirements: incoming.requirements,
      };
    });

    const newRoles = input.roles.slice(project.roles.length).map((role) => ({
      id: generateRoleId(),
      title: role.title.trim(),
      quantity: Math.max(1, role.quantity),
      filled: 0,
      requirements: role.requirements,
    }));

    updatePayload.roles = [...updatedRoles, ...newRoles];
  }

  await updateDoc(doc(db, 'projects', project.id), updatePayload);

  const chatRef = doc(db, 'chats', project.id);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    await updateDoc(chatRef, {
      projectTitle: input.title.trim(),
    });
  }
}

export async function completeProject(project: Project): Promise<void> {
  if (project.status === 'completed') {
    throw new Error('Este projeto já foi concluído.');
  }

  const applicationsSnap = await getDocs(
    collection(db, 'projects', project.id, 'applications'),
  );

  const acceptedApps = applicationsSnap.docs
    .map((docSnap) => docSnap.data() as ProjectApplication)
    .filter((app) => app.status === 'accepted');

  const participantIds = [
    project.creatorId,
    ...acceptedApps.map((app) => app.userId),
  ];

  const participantRoles: Record<string, string> = {
    [project.creatorId]: 'Criador(a) do projeto',
  };
  for (const app of acceptedApps) {
    participantRoles[app.userId] = app.roleTitle;
  }

  await updateDoc(doc(db, 'projects', project.id), {
    status: 'completed',
    completedAt: serverTimestamp(),
    participantIds,
    participantRoles,
  });

  await syncCompletedProjectsForUser(project.creatorId);
}
