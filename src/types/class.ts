export interface Class {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  createdAt?: unknown;
}

export interface CreateClassInput {
  name: string;
}
