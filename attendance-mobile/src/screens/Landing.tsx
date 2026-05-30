import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { APP_COPY } from '../constants/config';
import { GradientBackdrop } from '../components/GradientBackdrop';
import { GlassCard } from '../components/GlassCard';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export default function Landing({ navigation }: Props) {
  return (
    <GradientBackdrop>
      <View style={styles.container}>
        <GlassCard style={styles.hero}>
          <Text style={styles.eyebrow}>Attendance Mobile Companion</Text>
          <Text style={styles.title}>{APP_COPY.name}</Text>
          <Text style={styles.description}>
            Synchronized with the web attendance backend for secure branch scanning, notifications, and role-gated mobile access.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryButtonText}>Continue to Sign In</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </GradientBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  hero: {
    gap: 16,
  },
  eyebrow: {
    color: '#7ef0d4',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  title: {
    color: '#f7fbff',
    fontSize: 38,
    fontWeight: '800',
  },
  description: {
    color: 'rgba(230,238,255,0.8)',
    fontSize: 15,
    lineHeight: 24,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 20,
    backgroundColor: '#7ef0d4',
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#07111f',
    fontSize: 15,
    fontWeight: '800',
  },
});
