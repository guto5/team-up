import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChalkboardTeacher, User } from 'phosphor-react-native';
import { TeacherStack } from './TeacherStack';
import { TeacherProfileScreen } from '../screens/teacher/TeacherProfileScreen';
import { colors, fonts } from '../theme';
import { TeacherTabParamList } from './types';

const Tab = createBottomTabNavigator<TeacherTabParamList>();

export function TeacherTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 11,
          marginBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Classes"
        component={TeacherStack}
        options={{
          tabBarLabel: 'Turmas',
          tabBarIcon: ({ color, size }) => (
            <ChalkboardTeacher color={color} size={size} weight="bold" />
          ),
        }}
      />
      <Tab.Screen
        name="TeacherProfile"
        component={TeacherProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} weight="bold" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
