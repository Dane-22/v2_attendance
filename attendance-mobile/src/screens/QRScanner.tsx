import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';

const QRScanner = ({ navigation }: any) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const isDark = useSelector((state: any) => state.theme.isDark);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleBarCodeScanned = ({ data }: any) => {
    if (scanned) return;

    setScanned(true);

    // Parse QR code format: JAJR-EMP:{id}|{employee_code}|{employee_name}
    if (data.startsWith('JAJR-EMP:')) {
      const parts = data.split('|');
      if (parts.length >= 3) {
        const id = parts[0].replace('JAJR-EMP:', '');
        const employeeCode = parts[1];
        const employeeName = parts[2];

        Alert.alert(
          'QR Code Scanned',
          `Employee: ${employeeName}\nCode: ${employeeCode}`,
          [
            { text: 'OK', onPress: () => setScanned(false) },
          ]
        );

        // TODO: Send scan data to API
        console.log('Scanned:', { id, employeeCode, employeeName });
      }
    } else {
      Alert.alert('Invalid QR Code', 'This is not a valid JAJR attendance QR code', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.onSurface }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.onSurface }]}>
          No access to camera
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>QR Scanner</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
            <Text style={[styles.statusText, { color: '#fff' }]}>Online</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleThemeToggle} style={styles.iconButton}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Align QR code within frame
          </Text>
        </View>

        {/* Footer Actions */}
        <View style={[styles.footer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: '#ef4444' }]}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderColor: '#facc15',
    borderWidth: 4,
  },
  topLeft: {
    top: 100,
    left: 40,
    borderTopLeftRadius: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 100,
    right: 40,
    borderTopRightRadius: 10,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 150,
    left: 40,
    borderBottomLeftRadius: 10,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 150,
    right: 40,
    borderBottomRightRadius: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default QRScanner;
