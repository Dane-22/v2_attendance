import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { useSelector } from 'react-redux';

import { store, RootState } from './store';
import Landing from './screens/Landing';
import Login from './screens/Login';
import AdminTabs from './navigation/AdminTabs';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const isDark = useSelector((state: RootState) => state.theme.isDark);

  return (
    <PaperProvider theme={isDark ? MD3DarkTheme : MD3LightTheme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={Landing} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <ReduxProvider store={store}>
      <AppContent />
    </ReduxProvider>
  );
}
