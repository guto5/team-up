import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { useClassDirectory } from '../../hooks/useClassDirectory';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useProjects } from '../../hooks/useProjects';
import { useCompletedProjects } from '../../hooks/useCompletedProjects';
import { FeedHeader } from '../../components/feed/FeedHeader';
import { ClassMembershipBanner } from '../../components/feed/ClassMembershipBanner';
import { EndorsementBanner } from '../../components/feed/EndorsementBanner';
import { ProjectCard } from '../../components/feed/ProjectCard';
import { CreateProjectFab } from '../../components/feed/CreateProjectFab';
import { AppTabParamList, FeedStackParamList } from '../../navigation/types';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type FeedScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<FeedStackParamList, 'FeedList'>,
  BottomTabNavigationProp<AppTabParamList>
>;

export function FeedScreen() {
  const navigation = useNavigation<FeedScreenNavigation>();
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const { directory: classDirectory } = useClassDirectory();
  const { projects, loading, error } = useProjects();
  const { projects: completedProjects } = useCompletedProjects(user?.uid);

  const handleAvatarPress = useCallback(() => {
    navigation.navigate('Portfolio');
  }, [navigation]);

  const handleCreateProject = useCallback(() => {
    navigation.navigate('CreateProject');
  }, [navigation]);

  const handleJoinClass = useCallback(() => {
    navigation.navigate('JoinClass');
  }, [navigation]);

  const endorsementProject = completedProjects[0];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Não foi possível carregar os projetos</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (projects.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nenhum projeto aberto ainda</Text>
          <Text style={styles.emptyText}>
            Quando projetos forem publicados no Firestore, eles aparecerão aqui.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            classDirectory={classDirectory}
            onPress={() =>
              navigation.navigate('ProjectDetail', { projectId: item.id })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FeedHeader
        photoURL={profile?.photoURL ?? user?.photoURL}
        onAvatarPress={handleAvatarPress}
      />
      <ClassMembershipBanner
        classCount={profile?.classIds?.length ?? 0}
        onPress={handleJoinClass}
      />
      {endorsementProject ? (
        <EndorsementBanner
          project={endorsementProject}
          onPress={() =>
            navigation.navigate('Endorsement', { projectId: endorsementProject.id })
          }
        />
      ) : null}
      <View style={styles.content}>{renderContent()}</View>
      <CreateProjectFab onPress={handleCreateProject} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  separator: {
    height: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
