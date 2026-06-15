import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { CreateProjectScreen } from '../screens/feed/CreateProjectScreen';
import { EditProjectScreen } from '../screens/feed/EditProjectScreen';
import { JoinClassScreen } from '../screens/classes/JoinClassScreen';
import { ProjectDetailScreen } from '../screens/feed/ProjectDetailScreen';
import { TeamChatScreen } from '../screens/chat/TeamChatScreen';
import { EndorsementScreen } from '../screens/endorsement/EndorsementScreen';
import { FeedStackParamList } from './types';

const Stack = createNativeStackNavigator<FeedStackParamList>();

export function FeedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeedList" component={FeedScreen} />
      <Stack.Screen name="CreateProject" component={CreateProjectScreen} />
      <Stack.Screen name="EditProject" component={EditProjectScreen} />
      <Stack.Screen name="JoinClass" component={JoinClassScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="TeamChat" component={TeamChatScreen} />
      <Stack.Screen name="Endorsement" component={EndorsementScreen} />
    </Stack.Navigator>
  );
}
