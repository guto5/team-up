import { Pressable, StyleSheet } from 'react-native';
import { Plus } from 'phosphor-react-native';
import { colors } from '../../theme';

interface CreateProjectFabProps {
  onPress: () => void;
}

export function CreateProjectFab({ onPress }: CreateProjectFabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
    >
      <Plus size={24} color={colors.black} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
});
