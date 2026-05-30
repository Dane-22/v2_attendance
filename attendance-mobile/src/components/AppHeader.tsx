import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { logout } from '../store/authSlice';
import { destroySession } from '../utils/authStorage';

interface AppHeaderProps {
  title: string;
  subtitle: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const AppHeader = ({ title, subtitle, showBack = false, onBack }: AppHeaderProps) => {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await destroySession();
    dispatch(logout());
  };

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity style={styles.iconButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#f3f7ff" />
          </TouchableOpacity>
        ) : null}
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#f3f7ff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#f7fbff',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(230,238,255,0.72)',
    fontSize: 13,
    marginTop: 4,
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
