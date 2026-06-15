import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyTeamScreen } from '../screens/team/MyTeamScreen';
import { TeamChatScreen } from '../screens/chat/TeamChatScreen';
import { ProjectDetailScreen } from '../screens/feed/ProjectDetailScreen';
import { EditProjectScreen } from '../screens/feed/EditProjectScreen';
import { colors } from '../theme';
import { TeamStackParamList } from './types';

const Stack = createNativeStackNavigator<TeamStackParamList>();

export function TeamStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgApp },
      }}
    >
      <Stack.Screen name="MyTeamList" component={MyTeamScreen} />
      <Stack.Screen name="TeamChat" component={TeamChatScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="EditProject" component={EditProjectScreen} />
    </Stack.Navigator>
  );
}
