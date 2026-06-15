import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, PencilSimple, User } from 'phosphor-react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface ProfilePhotoPickerProps {
  photoURL?: string | null;
  size?: number;
  editable?: boolean;
  loading?: boolean;
  onPhotoSelected: (localUri: string) => void;
}

async function pickFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permita o acesso à galeria para escolher uma foto.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

async function pickFromCamera(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permita o acesso à câmera para tirar uma foto.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export function ProfilePhotoPicker({
  photoURL,
  size = 96,
  editable = true,
  loading = false,
  onPhotoSelected,
}: ProfilePhotoPickerProps) {
  const [picking, setPicking] = useState(false);

  const handlePress = () => {
    if (!editable || loading || picking) return;

    Alert.alert('Foto de perfil', 'Como deseja adicionar sua foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Galeria',
        onPress: () => {
          setPicking(true);
          pickFromLibrary()
            .then((uri) => {
              if (uri) onPhotoSelected(uri);
            })
            .catch((err) => {
              Alert.alert(
                'Erro',
                err instanceof Error ? err.message : 'Não foi possível escolher a foto.',
              );
            })
            .finally(() => setPicking(false));
        },
      },
      {
        text: 'Câmera',
        onPress: () => {
          setPicking(true);
          pickFromCamera()
            .then((uri) => {
              if (uri) onPhotoSelected(uri);
            })
            .catch((err) => {
              Alert.alert(
                'Erro',
                err instanceof Error ? err.message : 'Não foi possível tirar a foto.',
              );
            })
            .finally(() => setPicking(false));
        },
      },
    ]);
  };

  const busy = loading || picking;
  const radius = size / 2;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        disabled={!editable || busy}
        style={{ width: size, height: size }}
      >
        {photoURL ? (
          <Image
            source={{ uri: photoURL }}
            style={[styles.photo, { width: size, height: size, borderRadius: radius }]}
          />
        ) : (
          <View
            style={[
              styles.fallback,
              { width: size, height: size, borderRadius: radius },
            ]}
          >
            <User color={colors.textSecondary} size={size * 0.38} weight="bold" />
          </View>
        )}

        {editable ? (
          <View style={[styles.badge, { right: 0, bottom: 0 }]}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Camera size={14} color={colors.black} weight="bold" />
            )}
          </View>
        ) : null}
      </Pressable>

      {editable && !busy ? (
        <Text style={styles.hint}>Toque para alterar</Text>
      ) : null}
    </View>
  );
}

export function ProfilePhotoEditButton({
  onPress,
  loading,
}: {
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={styles.editButton}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.black} />
      ) : (
        <>
          <PencilSimple size={16} color={colors.black} weight="bold" />
          <Text style={styles.editButtonText}>Alterar foto</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
  },
  photo: {
    backgroundColor: colors.surface2,
    borderWidth: 3,
    borderColor: colors.border,
  },
  fallback: {
    backgroundColor: colors.surface2,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgApp,
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },
  editButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.black,
  },
});
