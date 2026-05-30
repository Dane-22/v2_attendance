import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authApi } from '../api/authApi';
import { settingsApi } from '../api/settingsApi';
import { AppHeader } from '../components/AppHeader';
import { GlassCard } from '../components/GlassCard';
import { GradientBackdrop } from '../components/GradientBackdrop';
import { useAppSelector } from '../hooks/useAppSelector';
import { useScreenReveal } from '../hooks/useScreenReveal';
import { SettingsPayload } from '../types';

type SettingsTab = 'general' | 'notifications' | 'security' | 'system';

const DEFAULT_SETTINGS: SettingsPayload = {
  companyName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  workStartTime: '08:00',
  workEndTime: '17:00',
  gracePeriod: 15,
  overtimeThreshold: 30,
  emailNotifications: true,
  pushNotifications: true,
  attendanceAlerts: true,
  payrollAlerts: true,
  systemUpdates: true,
  lowBalanceAlerts: false,
  twoFactorAuth: false,
  passwordExpiryDays: 90,
  sessionTimeout: 30,
  loginAttempts: 5,
  requireStrongPasswords: true,
  timezone: 'Asia/Manila',
  dateFormat: 'MM/DD/YYYY',
  currency: 'PHP',
  language: 'English',
  autoLogout: true,
  dataRetention: 365,
};

export default function SettingsScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SettingsPayload>(DEFAULT_SETTINGS);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const reveal = useScreenReveal(8);

  const tabs = useMemo(
    () => [
      { id: 'general' as const, label: 'General' },
      { id: 'notifications' as const, label: 'Notifications' },
      { id: 'security' as const, label: 'Security' },
      { id: 'system' as const, label: 'System' },
    ],
    []
  );

  const loadSettings = async () => {
    setLoading(true);
    try {
      const payload = await settingsApi.get();
      setSettings({ ...DEFAULT_SETTINGS, ...(payload || {}) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings().catch(() => setLoading(false));
  }, []);

  const updateSetting = <K extends keyof SettingsPayload>(key: K, value: SettingsPayload[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      Alert.alert('Saved', 'Settings updated successfully.');
    } catch (error: any) {
      Alert.alert('Save failed', error?.response?.data?.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      await authApi.changePassword(passwordData as any);
      Alert.alert('Password updated', 'Password changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      Alert.alert('Password update failed', error?.response?.data?.message || 'Unable to change password.');
    }
  };

  const renderGeneral = () => (
    <GlassCard>
      <Text style={styles.sectionTitle}>Company and schedule</Text>
      <TextInput style={styles.input} value={settings.companyName ?? ''} onChangeText={(v) => updateSetting('companyName', v)} placeholder="Company name" placeholderTextColor="#7d8ca4" />
      <TextInput style={styles.input} value={settings.address ?? ''} onChangeText={(v) => updateSetting('address', v)} placeholder="Address" placeholderTextColor="#7d8ca4" />
      <TextInput style={styles.input} value={settings.email ?? ''} onChangeText={(v) => updateSetting('email', v)} placeholder="Email" placeholderTextColor="#7d8ca4" />
      <TextInput style={styles.input} value={settings.workStartTime ?? ''} onChangeText={(v) => updateSetting('workStartTime', v)} placeholder="08:00" placeholderTextColor="#7d8ca4" />
      <TextInput style={styles.input} value={settings.workEndTime ?? ''} onChangeText={(v) => updateSetting('workEndTime', v)} placeholder="17:00" placeholderTextColor="#7d8ca4" />
    </GlassCard>
  );

  const renderNotifications = () => (
    <GlassCard>
      <Text style={styles.sectionTitle}>Notification preferences</Text>
      {[
        ['emailNotifications', 'Email notifications'],
        ['pushNotifications', 'Push notifications'],
        ['attendanceAlerts', 'Attendance alerts'],
        ['payrollAlerts', 'Payroll alerts'],
        ['systemUpdates', 'System updates'],
        ['lowBalanceAlerts', 'Low balance alerts'],
      ].map(([key, label]) => (
        <View key={key} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{label}</Text>
          <Switch value={Boolean(settings[key as keyof SettingsPayload])} onValueChange={(v) => updateSetting(key as keyof SettingsPayload, v as any)} />
        </View>
      ))}
    </GlassCard>
  );

  const renderSecurity = () => (
    <GlassCard>
      <Text style={styles.sectionTitle}>Security controls</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Two-factor authentication</Text>
        <Switch value={Boolean(settings.twoFactorAuth)} onValueChange={(v) => updateSetting('twoFactorAuth', v)} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Require strong passwords</Text>
        <Switch value={Boolean(settings.requireStrongPasswords)} onValueChange={(v) => updateSetting('requireStrongPasswords', v)} />
      </View>
      <TextInput
        style={styles.input}
        value={String(settings.sessionTimeout ?? 30)}
        onChangeText={(v) => updateSetting('sessionTimeout', Number(v) || 0)}
        placeholder="Session timeout"
        placeholderTextColor="#7d8ca4"
      />
      <TextInput
        style={styles.input}
        value={String(settings.loginAttempts ?? 5)}
        onChangeText={(v) => updateSetting('loginAttempts', Number(v) || 0)}
        placeholder="Login attempts"
        placeholderTextColor="#7d8ca4"
      />
      <Text style={styles.subTitle}>Change password</Text>
      <TextInput style={styles.input} secureTextEntry value={passwordData.currentPassword} onChangeText={(v) => setPasswordData((c) => ({ ...c, currentPassword: v }))} placeholder="Current password" placeholderTextColor="#7d8ca4" />
      <TextInput style={styles.input} secureTextEntry value={passwordData.newPassword} onChangeText={(v) => setPasswordData((c) => ({ ...c, newPassword: v }))} placeholder="New password" placeholderTextColor="#7d8ca4" />
      <TextInput style={styles.input} secureTextEntry value={passwordData.confirmPassword} onChangeText={(v) => setPasswordData((c) => ({ ...c, confirmPassword: v }))} placeholder="Confirm password" placeholderTextColor="#7d8ca4" />
      <TouchableOpacity style={styles.secondaryButton} onPress={handleChangePassword}>
        <Text style={styles.secondaryButtonText}>Change password</Text>
      </TouchableOpacity>
    </GlassCard>
  );

  const renderSystem = () => (
    <GlassCard>
      <Text style={styles.sectionTitle}>System preferences</Text>
      <TextInput style={styles.input} value={settings.timezone ?? ''} onChangeText={(v) => updateSetting('timezone', v)} placeholder="Timezone" placeholderTextColor="#7d8ca4" />
      <TextInput style={styles.input} value={settings.currency ?? ''} onChangeText={(v) => updateSetting('currency', v)} placeholder="Currency" placeholderTextColor="#7d8ca4" />
      <TextInput style={styles.input} value={settings.language ?? ''} onChangeText={(v) => updateSetting('language', v)} placeholder="Language" placeholderTextColor="#7d8ca4" />
      <TextInput
        style={styles.input}
        value={String(settings.dataRetention ?? 365)}
        onChangeText={(v) => updateSetting('dataRetention', Number(v) || 0)}
        placeholder="Data retention"
        placeholderTextColor="#7d8ca4"
      />
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Auto logout</Text>
        <Switch value={Boolean(settings.autoLogout)} onValueChange={(v) => updateSetting('autoLogout', v)} />
      </View>
    </GlassCard>
  );

  return (
    <GradientBackdrop>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Animated.View style={reveal.containerStyle}>
          <AppHeader title="Settings" subtitle={user?.name || 'Account configuration'} />
          <Animated.View style={reveal.itemStyle(0)}>
            <GlassCard>
              <View style={styles.tabRow}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Text style={[styles.tabChipText, activeTab === tab.id && styles.tabChipTextActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          </Animated.View>

          {loading ? (
            <ActivityIndicator color="#7ef0d4" size="large" />
          ) : (
            <>
              <Animated.View style={reveal.itemStyle(1)}>{activeTab === 'general' ? renderGeneral() : null}</Animated.View>
              <Animated.View style={reveal.itemStyle(2)}>{activeTab === 'notifications' ? renderNotifications() : null}</Animated.View>
              <Animated.View style={reveal.itemStyle(3)}>{activeTab === 'security' ? renderSecurity() : null}</Animated.View>
              <Animated.View style={reveal.itemStyle(4)}>{activeTab === 'system' ? renderSystem() : null}</Animated.View>
              <Animated.View style={reveal.itemStyle(5)}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveSettings} disabled={saving}>
                  <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save settings'}</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </GradientBackdrop>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120, gap: 16 },
  sectionTitle: { color: '#f7fbff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  subTitle: { color: '#f7fbff', fontSize: 15, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tabChip: { borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 10 },
  tabChipActive: { backgroundColor: 'rgba(126,240,212,0.2)' },
  tabChipText: { color: '#c6d2e5', fontSize: 12, fontWeight: '700' },
  tabChipTextActive: { color: '#7ef0d4' },
  input: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f7fbff',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  toggleLabel: { color: '#f7fbff', fontSize: 14, flex: 1, paddingRight: 12 },
  primaryButton: { backgroundColor: '#7ef0d4', borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#07111f', fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#f7fbff', fontWeight: '700' },
});
