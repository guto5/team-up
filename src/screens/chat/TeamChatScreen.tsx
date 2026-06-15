import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../hooks/useProject';
import { useChatRoom } from '../../hooks/useChatRoom';
import { useChatMessages } from '../../hooks/useChatMessages';
import {
  ensureChatMembership,
  formatChatMemberPreview,
  sendChatMessage,
} from '../../services/chatService';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { ChatMessage } from '../../types/chat';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type TeamChatRoute = RouteProp<{ TeamChat: { projectId: string } }, 'TeamChat'>;

export function TeamChatScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<TeamChatRoute>();
  const { user } = useAuth();
  const { project, loading: projectLoading } = useProject(params.projectId);

  const [chatReady, setChatReady] = useState(false);
  const [joining, setJoining] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);

  const chatId = chatReady ? params.projectId : undefined;
  const { room, loading: roomLoading, error: roomError } = useChatRoom(chatId);
  const { messages, loading: messagesLoading, error: messagesError } =
    useChatMessages(chatId);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!project || !user) return;

    let active = true;

    const joinChat = async () => {
      setJoining(true);
      setJoinError(null);
      setChatReady(false);

      try {
        await ensureChatMembership(project, user);
        if (active) setChatReady(true);
      } catch (err) {
        if (active) {
          setJoinError(
            err instanceof Error
              ? err.message
              : 'Não foi possível entrar no chat da equipe.',
          );
        }
      } finally {
        if (active) setJoining(false);
      }
    };

    joinChat();

    return () => {
      active = false;
      setChatReady(false);
    };
  }, [project, user]);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const loading =
    projectLoading || joining || (chatReady && (roomLoading || messagesLoading));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const displayError = joinError ?? messagesError ?? roomError ?? null;

  if (!project || displayError) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatHeader
          title="Chat da Equipe"
          subtitle="Indisponível"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {displayError ?? 'Projeto não encontrado.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const memberPreview = room
    ? formatChatMemberPreview(room.members, user?.uid ?? '')
    : project.creatorName;

  const shouldShowSenderName = (index: number) => {
    const current = messages[index];
    if (current.senderId === user?.uid) return false;

    const previous = messages[index - 1];
    return !previous || previous.senderId !== current.senderId;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ChatHeader
        title={room?.projectTitle ?? project.title}
        subtitle={memberPreview}
        imageURL={room?.projectImageURL}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isOwn={item.senderId === user?.uid}
              showSenderName={shouldShowSenderName(index)}
            />
          )}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Nenhuma mensagem ainda. Dê as boas-vindas à equipe!
              </Text>
            </View>
          }
        />

        <ChatInput
          disabled={!user || !chatReady}
          onSend={async (text) => {
            if (!user) return;
            await sendChatMessage(params.projectId, user, text, project);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  flex: {
    flex: 1,
  },
  messages: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
