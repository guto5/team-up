import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChatsCircle, House, User } from 'phosphor-react-native';
import { FeedStack } from './FeedStack';
import { TeamStack } from './TeamStack';
import { PortfolioScreen } from '../screens/portfolio/PortfolioScreen';
import { colors, fonts } from '../theme';
import { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
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
        name="Feed"
        component={FeedStack}
        options={{
          tabBarLabel: 'Projetos',
          tabBarIcon: ({ color, size }) => (
            <House color={color} size={size} weight="bold" />
          ),
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamStack}
        options={{
          tabBarLabel: 'Equipe',
          tabBarIcon: ({ color, size }) => (
            <ChatsCircle color={color} size={size} weight="bold" />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Portfólio',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} weight="bold" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
