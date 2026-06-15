export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface ProjectApplication {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  roleId: string;
  roleTitle: string;
  projectId: string;
  projectTitle: string;
  status: ApplicationStatus;
  createdAt?: unknown;
}
