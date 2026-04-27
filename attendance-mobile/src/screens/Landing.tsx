import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  AdminTabs: undefined;
};

const Landing = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Text style={[styles.logo, { color: '#facc15' }]}>🟧</Text>
          <Text style={[styles.appName, { color: theme.colors.onBackground }]}>
            JAJR Attendance
          </Text>
        </View>

        <View style={[styles.heroSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
            SECURE YOUR WORKFORCE
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Biometric & Geo-Fenced Attendance System
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={styles.buttonText}>GET STARTED</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
            ADMIN LOGIN
          </Text>
        </TouchableOpacity>

        <View style={[styles.featuresSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            KEY FEATURES
          </Text>
          <FeatureItem icon="🏷️" text="QR Code Scanning" theme={theme} />
          <FeatureItem icon="⏰" text="Real-Time Tracking" theme={theme} />
          <FeatureItem icon="📊" text="Attendance Analytics" theme={theme} />
          <FeatureItem icon="🔔" text="Smart Notifications" theme={theme} />
          <FeatureItem icon="📱" text="Mobile-First Design" theme={theme} />
        </View>

        <View style={[styles.statsSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            TRUSTED BY
          </Text>
          <StatItem value="200+" label="Companies" theme={theme} />
          <StatItem value="50K+" label="Daily Workers" theme={theme} />
          <StatItem value="99.9%" label="Uptime" theme={theme} />
        </View>

        <TouchableOpacity style={styles.contactButton}>
          <Text style={[styles.contactText, { color: theme.colors.primary }]}>
            📧 Contact Support
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>
          v1.0.0 © 2026 JAJR
        </Text>
      </View>
    </ScrollView>
  );
};

const FeatureItem = ({ icon, text, theme }: { icon: string; text: string; theme: any }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>{text}</Text>
  </View>
);

const StatItem = ({ value, label, theme }: { value: string; label: string; theme: any }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color: theme.colors.primary }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  heroSection: {
    padding: 30,
    borderRadius: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#facc15',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#facc15',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  featuresSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
  },
  statsSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  contactButton: {
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
  },
  contactText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
  },
});

export default Landing;
