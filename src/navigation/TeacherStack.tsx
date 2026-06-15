import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeacherDashboardScreen } from '../screens/teacher/TeacherDashboardScreen';
import { CreateClassScreen } from '../screens/teacher/CreateClassScreen';
import { ClassDetailScreen } from '../screens/teacher/ClassDetailScreen';
import { ProjectDetailScreen } from '../screens/feed/ProjectDetailScreen';
import { colors } from '../theme';
import { TeacherStackParamList } from './types';

const Stack = createNativeStackNavigator<TeacherStackParamList>();

export function TeacherStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgApp },
      }}
    >
      <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
      <Stack.Screen name="CreateClass" component={CreateClassScreen} />
      <Stack.Screen name="ClassDetail" component={ClassDetailScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
    </Stack.Navigator>
  );
}
