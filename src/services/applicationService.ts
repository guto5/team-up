import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import { Project, ProjectRole } from '../types/project';
import { ProjectApplication } from '../types/application';
import { isClassScopedProject } from '../utils/class';
import { resolveDisplayName } from '../utils/user';
import { addMemberToChat } from './chatService';
import { getUserProfile } from './userService';

function getApplicationId(userId: string, roleId: string) {
  return `${userId}_${roleId}`;
}

export function subscribeToUserProjectApplications(
  projectId: string,
  userId: string,
  onData: (applications: ProjectApplication[]) => void,
  onError?: (error: Error) => void,
) {
  const applicationsQuery = query(
    collection(db, 'projects', projectId, 'applications'),
    where('userId', '==', userId),
  );

  return onSnapshot(
    applicationsQuery,
    (snapshot) => {
      const applications = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ProjectApplication, 'id'>),
      }));
      onData(applications);
    },
    (error) => onError?.(error),
  );
}

export function subscribeToProjectApplications(
  projectId: string,
  onData: (applications: ProjectApplication[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, 'projects', projectId, 'applications'),
    (snapshot) => {
      const applications = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ProjectApplication, 'id'>),
      }));
      onData(applications);
    },
    (error) => onError?.(error),
  );
}

export async function applyToProjectRole(
  project: Project,
  role: ProjectRole,
  user: User,
): Promise<void> {
  if (role.filled >= role.quantity) {
    throw new Error('Esta vaga já foi preenchida.');
  }

  if (user.uid === project.creatorId) {
    throw new Error('Você não pode se candidatar ao seu próprio projeto.');
  }

  if (isClassScopedProject(project)) {
    throw new Error('Projetos de turma não aceitam candidaturas.');
  }

  const applicationRef = doc(
    db,
    'projects',
    project.id,
    'applications',
    getApplicationId(user.uid, role.id),
  );

  const existing = await getDoc(applicationRef);
  if (existing.exists()) {
    throw new Error('Você já se candidatou a esta vaga.');
  }

  const userProfile = await getUserProfile(user.uid);

  await setDoc(applicationRef, {
    userId: user.uid,
    userName: resolveDisplayName(userProfile, user),
    userPhotoURL: userProfile?.photoURL ?? user.photoURL ?? null,
    roleId: role.id,
    roleTitle: role.title,
    projectId: project.id,
    projectTitle: project.title,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function acceptApplication(
  project: Project,
  application: ProjectApplication,
): Promise<void> {
  const projectRef = doc(db, 'projects', project.id);
  const applicationRef = doc(
    db,
    'projects',
    project.id,
    'applications',
    application.id,
  );

  await runTransaction(db, async (transaction) => {
    const projectSnap = await transaction.get(projectRef);
    const applicationSnap = await transaction.get(applicationRef);

    if (!projectSnap.exists() || !applicationSnap.exists()) {
      throw new Error('Candidatura ou projeto não encontrado.');
    }

    const projectData = {
      id: projectSnap.id,
      ...(projectSnap.data() as Omit<Project, 'id'>),
    };
    const applicationData = applicationSnap.data() as ProjectApplication;

    if (applicationData.status !== 'pending') {
      throw new Error('Esta candidatura já foi processada.');
    }

    const roleIndex = projectData.roles.findIndex(
      (role) => role.id === applicationData.roleId,
    );

    if (roleIndex === -1) {
      throw new Error('Vaga não encontrada neste projeto.');
    }

    const role = projectData.roles[roleIndex];
    if (role.filled >= role.quantity) {
      throw new Error('Esta vaga já está lotada.');
    }

    const updatedRoles = [...projectData.roles];
    updatedRoles[roleIndex] = {
      ...role,
      filled: role.filled + 1,
    };

    transaction.update(applicationRef, { status: 'accepted' });
    transaction.update(projectRef, {
      roles: updatedRoles,
      teamMemberIds: arrayUnion(
        projectData.creatorId,
        applicationData.userId,
      ),
    });
  });

  await addMemberToChat(
    project.id,
    {
      uid: application.userId,
      displayName: application.userName,
      photoURL: application.userPhotoURL,
    },
    project,
  );
}

export async function rejectApplication(
  projectId: string,
  applicationId: string,
): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId, 'applications', applicationId), {
    status: 'rejected',
  });
}
