import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SetupScreen } from '../screens/auth/SetupScreen';
import { SetupStackParamList } from './types';

const Stack = createNativeStackNavigator<SetupStackParamList>();

export function SetupStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Setup" component={SetupScreen} />
    </Stack.Navigator>
  );
}
