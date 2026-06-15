import { useEffect, useState } from 'react';
import { subscribeToChatMessages } from '../services/chatService';
import { ChatMessage } from '../types/chat';

export function useChatMessages(chatId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(chatId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToChatMessages(
      chatId,
      (data) => {
        setMessages(data);
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

  return { messages, loading, error };
}
