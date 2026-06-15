import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import { ProjectApplication } from '../types/application';
import { Project } from '../types/project';
import { ChatMember, ChatMessage, ChatRoom } from '../types/chat';
import { getUserProfile } from './userService';

function toChatMember(
  uid: string,
  displayName: string,
  photoURL: string | null,
): ChatMember {
  return { uid, displayName, photoURL };
}

async function buildChatMember(
  uid: string,
  fallbackName: string,
  fallbackPhoto: string | null,
): Promise<ChatMember> {
  const profile = await getUserProfile(uid);
  return toChatMember(
    uid,
    profile?.displayName ?? fallbackName,
    profile?.photoURL ?? fallbackPhoto,
  );
}

async function getAcceptedApplications(projectId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, 'projects', projectId, 'applications'),
      where('status', '==', 'accepted'),
    ),
  );

  return snapshot.docs.map(
    (docSnap) => docSnap.data() as Omit<ProjectApplication, 'id'>,
  );
}

async function resolveProject(project: Project): Promise<Project> {
  const snapshot = await getDoc(doc(db, 'projects', project.id));
  if (!snapshot.exists()) return project;

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Project, 'id'>),
  };
}

async function buildTeamChatMembers(project: Project): Promise<ChatMember[]> {
  const members: ChatMember[] = [
    await buildChatMember(
      project.creatorId,
      project.creatorName,
      project.creatorPhotoURL,
    ),
  ];

  const acceptedApps = await getAcceptedApplications(project.id);

  for (const application of acceptedApps) {
    if (members.some((member) => member.uid === application.userId)) continue;

    members.push(
      await buildChatMember(
        application.userId,
        application.userName,
        application.userPhotoURL,
      ),
    );
  }

  return members;
}

export async function syncProjectTeamMemberIds(project: Project): Promise<void> {
  const acceptedApps = await getAcceptedApplications(project.id);
  const acceptedUserIds = acceptedApps.map((application) => application.userId);
  const teamMemberIds = [...new Set([project.creatorId, ...acceptedUserIds])];

  await updateDoc(doc(db, 'projects', project.id), { teamMemberIds });
}

export async function repairChatRoom(project: Project): Promise<void> {
  const members = await buildTeamChatMembers(project);
  const memberIds = members.map((member) => member.uid);
  const chatRef = doc(db, 'chats', project.id);
  const snapshot = await getDoc(chatRef);

  if (!snapshot.exists()) {
    await setDoc(chatRef, {
      projectId: project.id,
      projectTitle: project.title,
      projectImageURL: null,
      memberIds,
      members,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await updateDoc(chatRef, {
    projectId: project.id,
    projectTitle: project.title,
    memberIds,
    members,
    updatedAt: serverTimestamp(),
  });
}

export async function createProjectChat(
  project: Pick<
    Project,
    'id' | 'title' | 'creatorId' | 'creatorName' | 'creatorPhotoURL'
  >,
): Promise<void> {
  const creator = toChatMember(
    project.creatorId,
    project.creatorName,
    project.creatorPhotoURL,
  );

  await setDoc(doc(db, 'chats', project.id), {
    projectId: project.id,
    projectTitle: project.title,
    projectImageURL: null,
    memberIds: [creator.uid],
    members: [creator],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function addSelfToChat(project: Project, user: User): Promise<void> {
  const chatRef = doc(db, 'chats', project.id);
  const snapshot = await getDoc(chatRef);

  if (!snapshot.exists()) {
    await repairChatRoom(project);
    return;
  }

  const data = snapshot.data() as Omit<ChatRoom, 'id'>;
  const memberIds = data.memberIds ?? [];

  if (memberIds.includes(user.uid)) return;

  const currentMember = await buildChatMember(
    user.uid,
    user.displayName ?? 'Estudante',
    user.photoURL,
  );

  await updateDoc(chatRef, {
    memberIds: arrayUnion(user.uid),
    members: [...(data.members ?? []), currentMember],
    updatedAt: serverTimestamp(),
  });
}

export async function ensureChatMembership(
  project: Project,
  user: User,
): Promise<void> {
  const resolvedProject = await resolveProject(project);
  const isCreator = user.uid === resolvedProject.creatorId;
  const hasAccess = await userHasChatAccess(resolvedProject, user.uid);

  if (!hasAccess) {
    throw new Error(
      'O chat é liberado apenas para membros aceitos na equipe do projeto.',
    );
  }

  if (isCreator) {
    await syncProjectTeamMemberIds(resolvedProject).catch(() => undefined);
    await repairChatRoom(resolvedProject);
    return;
  }

  await addSelfToChat(resolvedProject, user);
}

export function subscribeToChatRoom(
  chatId: string,
  onData: (room: ChatRoom | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, 'chats', chatId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData({
        id: snapshot.id,
        ...(snapshot.data() as Omit<ChatRoom, 'id'>),
      });
    },
    (error) => onError?.(error),
  );
}

export function subscribeToChatMessages(
  chatId: string,
  onData: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
) {
  const messagesQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ChatMessage, 'id'>),
      }));
      onData(messages);
    },
    (error) => onError?.(error),
  );
}

export async function sendChatMessage(
  chatId: string,
  user: User,
  text: string,
  project?: Project,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const projectData =
    project ??
    (await (async () => {
      const snapshot = await getDoc(doc(db, 'projects', chatId));
      if (!snapshot.exists()) return null;
      return {
        id: snapshot.id,
        ...(snapshot.data() as Omit<Project, 'id'>),
      };
    })());

  if (!projectData) {
    throw new Error('Projeto não encontrado.');
  }

  await ensureChatMembership(projectData, user);

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId: user.uid,
    senderName: user.displayName ?? 'Estudante',
    senderPhotoURL: user.photoURL,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: trimmed,
    updatedAt: serverTimestamp(),
  });
}

export async function addMemberToChat(
  projectId: string,
  member: ChatMember,
  project?: Pick<Project, 'creatorId' | 'creatorName' | 'creatorPhotoURL'>,
): Promise<void> {
  const chatRef = doc(db, 'chats', projectId);
  const snapshot = await getDoc(chatRef);

  if (!snapshot.exists()) {
    const members: ChatMember[] = [];

    if (project) {
      members.push(
        toChatMember(
          project.creatorId,
          project.creatorName,
          project.creatorPhotoURL,
        ),
      );
    }

    if (!members.some((item) => item.uid === member.uid)) {
      members.push(member);
    }

    await setDoc(chatRef, {
      projectId,
      projectTitle: '',
      projectImageURL: null,
      memberIds: members.map((item) => item.uid),
      members,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const data = snapshot.data() as Omit<ChatRoom, 'id'>;
  const memberIds = [...(data.memberIds ?? [])];
  const members = [...(data.members ?? [])];
  let changed = false;

  if (project && !memberIds.includes(project.creatorId)) {
    memberIds.push(project.creatorId);
    members.push(
      toChatMember(
        project.creatorId,
        project.creatorName,
        project.creatorPhotoURL,
      ),
    );
    changed = true;
  }

  if (!memberIds.includes(member.uid)) {
    memberIds.push(member.uid);
    members.push(member);
    changed = true;
  }

  if (!changed) return;

  await updateDoc(chatRef, {
    memberIds,
    members,
    updatedAt: serverTimestamp(),
  });
}

export async function userHasChatAccess(
  project: Project,
  userId: string,
): Promise<boolean> {
  const resolvedProject = await resolveProject(project);
  if (userId === resolvedProject.creatorId) return true;
  if (resolvedProject.teamMemberIds?.includes(userId)) return true;

  const applicationsQuery = query(
    collection(db, 'projects', resolvedProject.id, 'applications'),
    where('userId', '==', userId),
    where('status', '==', 'accepted'),
  );
  const snapshot = await getDocs(applicationsQuery);
  return !snapshot.empty;
}

export function formatChatMemberPreview(
  members: ChatMember[],
  currentUserId: string,
) {
  const names = members.map((member) => {
    if (member.uid === currentUserId) return 'Você';
    return member.displayName.split(' ')[0];
  });

  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}
