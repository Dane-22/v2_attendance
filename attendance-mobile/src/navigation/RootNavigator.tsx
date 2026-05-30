import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { hydrateAuth } from '../store/authSlice';
import { readStoredAuth } from '../utils/authStorage';
import Landing from '../screens/Landing';
import Login from '../screens/Login';
import ScannerKioskScreen from '../screens/ScannerKioskScreen';
import AppTabs from './AppTabs';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  MainTabs: undefined;
  ScannerKiosk: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isHydrated, isAuthenticated, userType } = useAppSelector((state) => state.auth);

  useEffect(() => {
    readStoredAuth()
      .then((payload) => dispatch(hydrateAuth(payload)))
      .catch(() => dispatch(hydrateAuth(null)));
  }, [dispatch]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#07111f', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#7ef0d4" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Landing" component={Landing} />
            <Stack.Screen name="Login" component={Login} />
          </>
        ) : userType === 'branch' ? (
          <Stack.Screen name="ScannerKiosk" component={ScannerKioskScreen} />
        ) : (
          <Stack.Screen name="MainTabs" component={AppTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
