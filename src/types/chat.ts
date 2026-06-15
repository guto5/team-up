export interface ChatMember {
  uid: string;
  displayName: string;
  photoURL: string | null;
}

export interface ChatRoom {
  id: string;
  projectId: string;
  projectTitle: string;
  projectImageURL: string | null;
  memberIds: string[];
  members: ChatMember[];
  lastMessage?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  text: string;
  createdAt?: unknown;
}
