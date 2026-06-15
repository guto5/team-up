import { Project } from '../types/project';

export interface ClassDirectory {
  byCode: Record<string, string>;
  byId: Record<string, string>;
}

export const emptyClassDirectory: ClassDirectory = {
  byCode: {},
  byId: {},
};

export function getProjectClassLabel(
  project: Pick<Project, 'className' | 'classTag' | 'classId'>,
  directory: ClassDirectory = emptyClassDirectory,
): string | null {
  if (project.className?.trim()) {
    return project.className.trim();
  }

  if (project.classId && directory.byId[project.classId]) {
    return directory.byId[project.classId];
  }

  if (project.classTag) {
    const code = project.classTag.trim().toUpperCase();
    if (directory.byCode[code]) {
      return directory.byCode[code];
    }
  }

  return null;
}

export function isClassScopedProject(project: Pick<Project, 'scope' | 'classTag'>) {
  return project.scope === 'class' || Boolean(project.classTag);
}
