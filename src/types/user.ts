export type UserRole = 'teacher' | 'student';

export interface EndorsedSkill {
  name: string;
  endorserCount: number;
}

export interface CompletedProject {
  id: string;
  title: string;
  role: string;
  period: string;
  description: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phone: string;
  role: UserRole;
  semester?: number;
  bio: string;
  skills: string[];
  classIds?: string[];
  endorsedSkills?: EndorsedSkill[];
  completedProjects?: CompletedProject[];
  portfolioSlug?: string;
  profileComplete: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SetupFormData {
  displayName?: string;
  phone: string;
  semester?: number;
  bio: string;
  skills: string[];
  role: UserRole;
  photoURL?: string | null;
}

export interface ProfileUpdateData {
  displayName?: string;
  phone?: string;
  semester?: number;
  bio?: string;
  skills?: string[];
  photoURL?: string | null;
}
