import { Image, StyleSheet, Text, View } from 'react-native';
import { User } from 'phosphor-react-native';
import { ChatMessage } from '../../types/chat';
import { formatMessageTime } from '../../utils/formatTime';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSenderName?: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showSenderName = false,
}: MessageBubbleProps) {
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn ? (
        message.senderPhotoURL ? (
          <Image source={{ uri: message.senderPhotoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <User size={14} color={colors.textSecondary} weight="bold" />
          </View>
        )
      ) : null}

      <View style={[styles.content, isOwn ? styles.contentOwn : styles.contentOther]}>
        {!isOwn && showSenderName ? (
          <Text style={styles.senderName}>{message.senderName}</Text>
        ) : null}

        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
            {message.text}
          </Text>
        </View>

        <Text style={styles.time}>{formatMessageTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.lg,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 18,
    backgroundColor: colors.surface2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxWidth: '78%',
  },
  contentOwn: {
    alignItems: 'flex-end',
  },
  contentOther: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    lineHeight: 20,
  },
  textOwn: {
    color: colors.black,
    fontFamily: fonts.semiBold,
  },
  textOther: {
    color: colors.textPrimary,
  },
  time: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});
