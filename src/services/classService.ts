import {
  arrayUnion,
  collection,
  doc,
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
import { Class } from '../types/class';
import { ClassDirectory } from '../utils/class';
import { getUserProfile } from './userService';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateClassCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function isCodeTaken(code: string): Promise<boolean> {
  const snapshot = await getDocs(
    query(collection(db, 'classes'), where('code', '==', code)),
  );
  return !snapshot.empty;
}

async function generateUniqueClassCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateClassCode();
    const taken = await isCodeTaken(code);
    if (!taken) return code;
  }
  throw new Error('Não foi possível gerar um código único para a turma.');
}

export function subscribeToTeacherClasses(
  teacherId: string,
  onData: (classes: Class[]) => void,
  onError?: (error: Error) => void,
) {
  const classesQuery = query(
    collection(db, 'classes'),
    where('teacherId', '==', teacherId),
  );

  return onSnapshot(
    classesQuery,
    (snapshot) => {
      const classes = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Class, 'id'>),
      }));
      onData(classes);
    },
    (error) => onError?.(error),
  );
}

export function subscribeToStudentClasses(
  classIds: string[],
  onData: (classes: Class[]) => void,
  onError?: (error: Error) => void,
) {
  if (classIds.length === 0) {
    onData([]);
    return () => undefined;
  }

  const limitedIds = classIds.slice(0, 10);
  const classesQuery = query(
    collection(db, 'classes'),
    where('__name__', 'in', limitedIds),
  );

  return onSnapshot(
    classesQuery,
    (snapshot) => {
      const classes = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Class, 'id'>),
      }));
      onData(classes);
    },
    (error) => onError?.(error),
  );
}

export async function getClassByCode(code: string): Promise<Class | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const snapshot = await getDocs(
    query(collection(db, 'classes'), where('code', '==', normalized)),
  );

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<Class, 'id'>),
  };
}

export async function createClass(user: User, name: string): Promise<string> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Informe o nome da turma.');
  }

  const code = await generateUniqueClassCode();
  const classRef = doc(collection(db, 'classes'));

  await setDoc(classRef, {
    name: trimmedName,
    code,
    teacherId: user.uid,
    teacherName: user.displayName ?? 'Professor(a)',
    studentIds: [],
    createdAt: serverTimestamp(),
  });

  return classRef.id;
}

export async function joinClassByCode(
  userId: string,
  code: string,
): Promise<Class> {
  const classItem = await getClassByCode(code);
  if (!classItem) {
    throw new Error('Código de turma inválido. Verifique com seu professor.');
  }

  if (classItem.studentIds.includes(userId)) {
    return classItem;
  }

  await updateDoc(doc(db, 'classes', classItem.id), {
    studentIds: arrayUnion(userId),
  });

  const userProfile = await getUserProfile(userId);
  const classIds = userProfile?.classIds ?? [];

  if (!classIds.includes(classItem.id)) {
    await updateDoc(doc(db, 'users', userId), {
      classIds: arrayUnion(classItem.id),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    ...classItem,
    studentIds: [...classItem.studentIds, userId],
  };
}

export async function getStudentsForClass(classItem: Class) {
  const profiles = await Promise.all(
    classItem.studentIds.map(async (studentId) => {
      const profile = await getUserProfile(studentId);
      return profile;
    }),
  );

  return profiles.filter((profile): profile is NonNullable<typeof profile> => profile !== null);
}

export function subscribeToClassDirectory(
  onData: (directory: ClassDirectory) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, 'classes'),
    (snapshot) => {
      const byCode: Record<string, string> = {};
      const byId: Record<string, string> = {};

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Class, 'id'>;
        byCode[data.code.toUpperCase()] = data.name;
        byId[docSnap.id] = data.name;
      });

      onData({ byCode, byId });
    },
    (error) => onError?.(error),
  );
}
