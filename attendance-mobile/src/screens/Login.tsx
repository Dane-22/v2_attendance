import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../api/authApi';
import { GlassCard } from '../components/GlassCard';
import { GradientBackdrop } from '../components/GradientBackdrop';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setAuth } from '../store/authSlice';
import { persistAuth } from '../utils/authStorage';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = await authApi.login(username.trim(), password);
      await persistAuth(payload);
      dispatch(setAuth(payload));
    } catch (error: any) {
      Alert.alert('Login failed', error?.response?.data?.message || 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackdrop>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <GlassCard>
          <Text style={styles.eyebrow}>Secure Backend Session</Text>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>The app routes admins to the main workspace and branch scanners directly into kiosk mode.</Text>

          <TextInput
            autoCapitalize="none"
            placeholder="Username"
            placeholderTextColor="rgba(230,238,255,0.45)"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="rgba(230,238,255,0.45)"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>{loading ? 'Authenticating...' : 'Access Mobile Workspace'}</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </GradientBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  backButton: {
    position: 'absolute',
    top: 68,
    left: 24,
  },
  backText: {
    color: '#dfe9ff',
    fontSize: 14,
    fontWeight: '600',
  },
  eyebrow: {
    color: '#7ef0d4',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    color: '#f7fbff',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(230,238,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  input: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#f7fbff',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  primaryButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#7ef0d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#07111f',
    fontSize: 15,
    fontWeight: '800',
  },
});
