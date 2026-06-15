import * as FileSystem from 'expo-file-system/legacy';

function isRemoteUri(uri: string) {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function getProfilePhotoPath(userId: string) {
  if (!FileSystem.documentDirectory) {
    throw new Error('Armazenamento local indisponível neste dispositivo.');
  }

  return `${FileSystem.documentDirectory}profile-${userId}.jpg`;
}

export async function persistProfilePhotoLocally(
  userId: string,
  sourceUri: string,
): Promise<string> {
  if (isRemoteUri(sourceUri)) {
    return sourceUri;
  }

  const destination = getProfilePhotoPath(userId);

  if (sourceUri === destination) {
    return destination;
  }

  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}
