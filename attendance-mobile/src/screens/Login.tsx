import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { setAdminAuth } from '../store/authSlice';
import { authApi } from '../api/authApi';
import { secureStorage, clearAuthData } from '../utils/secureStorage';
import { STORAGE_KEYS } from '../constants/config';

type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  AdminTabs: undefined;
};

const Login = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.adminLogin(username, password);
      
      if (!response.token) {
        throw new Error('No token received from server');
      }
      
      // Store auth data
      await secureStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      await secureStorage.setItem(STORAGE_KEYS.USER_TYPE, 'admin');
      
      // Update Redux store
      dispatch(setAdminAuth({ user: response.user as any, token: response.token }));
      
      // Check if admin is branch-a to branch-h for auto-routing
      const adminUser = response.user as any;
      if (adminUser.username && ['branch-a', 'branch-b', 'branch-c', 'branch-d', 'branch-e', 'branch-f', 'branch-g', 'branch-h'].includes(adminUser.username)) {
        // Auto-route to QR scanner (to be implemented)
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminTabs' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminTabs' }],
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Invalid credentials';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.navigate('Landing');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Admin Login
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
          placeholder="Username"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface, flex: 1 }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleAdminLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#facc15',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default Login;
