import {
  QuerySnapshot,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Project } from '../types/project';
import { isClassScopedProject } from '../utils/class';

export interface TeamProjectEntry {
  project: Project;
  roleLabel: string;
  isCreator: boolean;
}

export interface SkippedTeamProject {
  projectId: string;
  title: string;
  isCreator: boolean;
  reason: string;
}

export interface MyTeamProjectsData {
  entries: TeamProjectEntry[];
  skippedClassProjects: SkippedTeamProject[];
}

function mapProjects(snapshot: QuerySnapshot): Project[] {
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Project, 'id'>),
  }));
}

function mergeTeamEntries(
  created: Project[],
  memberProjects: Project[],
  userId: string,
): TeamProjectEntry[] {
  const map = new Map<string, TeamProjectEntry>();

  for (const project of created) {
    map.set(project.id, {
      project,
      roleLabel: 'Criador(a)',
      isCreator: true,
    });
  }

  for (const project of memberProjects) {
    if (map.has(project.id) || project.creatorId === userId) continue;

    map.set(project.id, {
      project,
      roleLabel: 'Membro(a)',
      isCreator: false,
    });
  }

  return Array.from(map.values());
}

function buildTeamData(
  createdProjects: Project[],
  memberProjects: Project[],
  userId: string,
): MyTeamProjectsData {
  const merged = mergeTeamEntries(createdProjects, memberProjects, userId);
  const fullEntries: TeamProjectEntry[] = [];
  const skipped: SkippedTeamProject[] = [];

  for (const entry of merged) {
    const project = entry.project;

    if (!project.title || !project.creatorId || project.status === 'completed') {
      if (entry.isCreator) {
        skipped.push({
          projectId: project.id,
          title: project.title ?? 'Projeto',
          isCreator: entry.isCreator,
          reason: !project.title || !project.creatorId ? 'not_found' : 'completed',
        });
      }
      continue;
    }

    if (isClassScopedProject(project)) {
      skipped.push({
        projectId: project.id,
        title: project.title,
        isCreator: entry.isCreator,
        reason: 'class_scoped',
      });
      continue;
    }

    fullEntries.push(entry);
  }

  return {
    entries: fullEntries,
    skippedClassProjects: skipped.filter((item) => item.reason === 'class_scoped'),
  };
}

export function subscribeToMyTeamProjects(
  userId: string,
  onData: (data: MyTeamProjectsData) => void,
  onError?: (error: Error) => void,
) {
  let createdProjects: Project[] = [];
  let memberProjects: Project[] = [];

  const createdQuery = query(
    collection(db, 'projects'),
    where('creatorId', '==', userId),
  );
  const memberQuery = query(
    collection(db, 'projects'),
    where('teamMemberIds', 'array-contains', userId),
  );

  const publish = () => {
    onData(buildTeamData(createdProjects, memberProjects, userId));
  };

  Promise.all([getDocs(createdQuery), getDocs(memberQuery)])
    .then(([createdSnapshot, memberSnapshot]) => {
      createdProjects = mapProjects(createdSnapshot);
      memberProjects = mapProjects(memberSnapshot);
      publish();
    })
    .catch((err) => onError?.(err as Error));

  const createdUnsub = onSnapshot(
    createdQuery,
    (snapshot) => {
      createdProjects = mapProjects(snapshot);
      publish();
    },
    (error) => onError?.(error),
  );

  const memberUnsub = onSnapshot(
    memberQuery,
    (snapshot) => {
      memberProjects = mapProjects(snapshot);
      publish();
    },
    (error) => onError?.(error),
  );

  return () => {
    createdUnsub();
    memberUnsub();
  };
}
