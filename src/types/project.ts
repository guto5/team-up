export type ProjectStatus = 'open' | 'closed' | 'completed';
export type ProjectScope = 'class' | 'public';

export interface ProjectRole {
  id: string;
  title: string;
  quantity: number;
  filled: number;
  requirements: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  projectUrl?: string | null;
  deadline: string;
  isBoosted: boolean;
  classTag: string | null;
  classId?: string | null;
  className?: string | null;
  scope?: ProjectScope;
  creatorId: string;
  creatorName: string;
  creatorPhotoURL: string | null;
  creatorSubtitle?: string;
  roles: ProjectRole[];
  status: ProjectStatus;
  teamMemberIds?: string[];
  participantIds?: string[];
  participantRoles?: Record<string, string>;
  completedAt?: unknown;
  createdAt?: unknown;
}

export interface CreateProjectRoleInput {
  title: string;
  quantity: number;
  requirements: string[];
}

export interface CreateProjectInput {
  title: string;
  description: string;
  projectUrl?: string | null;
  deadline: string;
  classTag: string | null;
  classId?: string | null;
  className?: string | null;
  scope: ProjectScope;
  roles: CreateProjectRoleInput[];
}

export interface UpdateProjectInput {
  title: string;
  description: string;
  projectUrl?: string | null;
  deadline: string;
  roles?: CreateProjectRoleInput[];
}
