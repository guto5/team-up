import { useEffect, useState } from 'react';
import { subscribeToChatRoom } from '../services/chatService';
import { ChatRoom } from '../types/chat';

export function useChatRoom(chatId: string | undefined) {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(Boolean(chatId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setRoom(null);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToChatRoom(
      chatId,
      (data) => {
        setRoom(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [chatId]);

  return { room, loading, error };
}
