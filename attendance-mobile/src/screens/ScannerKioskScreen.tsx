import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { attendanceApi } from '../api/attendanceApi';
import { branchApi } from '../api/branchApi';
import { employeeApi, ResolvedEmployee } from '../api/employeeApi';
import { APP_COPY } from '../constants/config';
import { AuthUser } from '../types';
import { BranchEmployee, BranchSummary } from '../types';
import FaceCaptureScreen from './FaceCaptureScreen';

type ScanResult = {
  success: boolean;
  message: string;
  detail?: string;
} | null;

type ScanStage =
  | 'idle'
  | 'launching'
  | 'scanned'
  | 'parsing'
  | 'resolving'
  | 'submitting'
  | 'success'
  | 'error';

type ParsedQRData = {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  format: 'JAJR-EMP' | 'SIMPLE' | 'URL' | 'LEGACY-URL' | 'GENERIC-URL';
};

const parseQRData = (qrData: string): ParsedQRData | null => {
  const jajrMatch = qrData.match(/^JAJR-EMP:(\d+)\|([^|]+)\|(.+)$/i);
  if (jajrMatch) {
    return {
      employeeId: parseInt(jajrMatch[1], 10),
      employeeCode: jajrMatch[2].trim().toUpperCase(),
      employeeName: jajrMatch[3].trim(),
      format: 'JAJR-EMP',
    };
  }

  const simpleMatch = qrData.match(/^([A-Za-z]\d{4,})$/);
  if (simpleMatch) {
    return {
      employeeId: 0,
      employeeCode: simpleMatch[1].toUpperCase(),
      employeeName: '',
      format: 'SIMPLE',
    };
  }

  const urlMatch = qrData.match(/\/attendance\/([A-Za-z]\d{4,})/i);
  if (urlMatch) {
    return {
      employeeId: 0,
      employeeCode: urlMatch[1].toUpperCase(),
      employeeName: '',
      format: 'URL',
    };
  }

  const empCodeMatch = qrData.match(/[?&]emp_code=([^&\s]+)/i);
  if (empCodeMatch) {
    const idMatch = qrData.match(/[?&]emp_id=(\d+)/i);
    return {
      employeeId: idMatch ? parseInt(idMatch[1], 10) : 0,
      employeeCode: decodeURIComponent(empCodeMatch[1]).toUpperCase(),
      employeeName: '',
      format: 'LEGACY-URL',
    };
  }

  const altCodeMatch = qrData.match(/[?&](?:emp|code|id)=([^&\s]+)/i);
  if (altCodeMatch) {
    return {
      employeeId: 0,
      employeeCode: decodeURIComponent(altCodeMatch[1]).toUpperCase(),
      employeeName: '',
      format: 'GENERIC-URL',
    };
  }

  return null;
};

interface ScannerKioskScreenProps {
  user?: AuthUser | null;
  onLogout?: () => Promise<void> | void;
}

export default function ScannerKioskScreen({ user = null, onLogout = async () => {} }: ScannerKioskScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [presentEmployees, setPresentEmployees] = useState<BranchEmployee[]>([]);
  const [showPresentList, setShowPresentList] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [lastQrData, setLastQrData] = useState('');
  const [processingDelay, setProcessingDelay] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resolvedEmployee, setResolvedEmployee] = useState<ResolvedEmployee | null>(null);
  const [scanStage, setScanStage] = useState<ScanStage>('launching');
  const [parsedFormat, setParsedFormat] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const scanLockRef = useRef(false);

  const branchCode = user?.branch_code || user?.username?.split('-')[1]?.toUpperCase() || 'A';

  const branchName = useMemo(() => {
    return branches.find((branch) => branch.code === branchCode)?.shortName || branchCode;
  }, [branches, branchCode]);

  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          console.warn('Camera permission status:', status);
        }
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
      }
    };

    requestCameraPermission();
  }, []);

  useEffect(() => {
    void loadBranchContext();
  }, [branchCode]);

  useEffect(() => {
    if (hasPermission === true) {
      setScanResult({
        success: true,
        message: 'Scanner opened',
        detail: 'Align QR code within frame.',
      });
    }
  }, [hasPermission]);

  const loadBranchContext = async () => {
    setLoading(true);
    try {
      const [allBranches, employees] = await Promise.all([
        branchApi.getAll(),
        branchApi.getEmployees(branchCode),
      ]);

      setBranches(allBranches || []);
      setPresentEmployees((employees || []).filter((employee) => employee.timeIn && !employee.timeOut));
    } catch (error) {
      console.error('Failed to load branch scanner context', error);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    scanLockRef.current = false;
    setScannerActive(true);
    setScanStage('idle');
    setScanResult({
      success: true,
      message: 'Scanner ready',
      detail: 'Align QR code within frame.',
    });
  };

  const handleInvalidScan = (qrData: string) => {
    const preview = qrData.length > 40 ? `${qrData.substring(0, 40)}...` : qrData;
    setResolvedEmployee(null);
    setParsedFormat(null);
    setScanStage('error');
    setScanResult({
      success: false,
      message: 'Invalid code format',
      detail: preview,
    });
    Alert.alert('Invalid QR code', preview);
  };

  const handleResolvedScan = async (qrData: string, parsed: ParsedQRData) => {
    setScanStage('resolving');
    setScanResult({
      success: true,
      message: 'Resolving employee',
      detail: `Format ${parsed.format} • ${parsed.employeeCode}`,
    });

    const employee = await employeeApi.resolveScan({
      qrCodeData: qrData,
      employeeCode: parsed.employeeCode,
      employeeId: parsed.employeeId || undefined,
    });

    if (!employee) {
      throw new Error('Employee resolution returned no data');
    }

    setResolvedEmployee(employee);
    setScanStage('submitting');
    setScanResult({
      success: true,
      message: 'Submitting attendance',
      detail: [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.employeeCode || '',
    });

    const attendanceResponse = await attendanceApi.clock(qrData);
    const message = attendanceResponse?.message || 'Scan recorded';

    setScanStage('success');
    setScanResult({
      success: true,
      message,
      detail: [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.employeeCode || '',
    });

    Alert.alert('Scan successful', message);
    await loadBranchContext();
  };

  const handleScan = async (qrData: string) => {
    if (busy || processingDelay || scanLockRef.current) return;

    scanLockRef.current = true;
    setScannerActive(false);

    const parsed = parseQRData(qrData);
    setLastQrData(qrData);
    setScanStage('scanned');
    setScanResult({
      success: true,
      message: 'QR detected',
      detail: qrData.length > 48 ? `${qrData.slice(0, 48)}...` : qrData,
    });

    if (!parsed) {
      handleInvalidScan(qrData);
      return;
    }

    setParsedFormat(parsed.format);
    setScanStage('parsing');
    setScanResult({
      success: true,
      message: 'QR parsed',
      detail: `${parsed.format} • ${parsed.employeeCode}`,
    });
    setProcessingDelay(true);
    setCountdown(3);
    setResolvedEmployee(null);

    let currentCount = 3;
    const countdownInterval = setInterval(() => {
      currentCount -= 1;
      setCountdown(currentCount);

      if (currentCount === 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    setBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await handleResolvedScan(qrData, parsed);
    } catch (error: any) {
      setResolvedEmployee(null);
      setScanStage('error');
      setScanResult({
        success: false,
        message: error?.response?.data?.message || error?.message || 'Unable to process scan',
        detail: qrData.length > 30 ? `${qrData.substring(0, 30)}...` : qrData,
      });
      Alert.alert('Scan failed', error?.response?.data?.message || error?.message || 'Unable to process scan');
    } finally {
      clearInterval(countdownInterval);
      setCountdown(0);
      setProcessingDelay(false);
      setBusy(false);
    }
  };

  const handleBarcodeScanned = (event: BarcodeScanningResult) => {
    if (!event?.data || busy || processingDelay || scanLockRef.current) {
      return;
    }

    void handleScan(event.data);
  };

  const handleManualSubmit = async () => {
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    setManualCode('');
    await handleScan(trimmed);
  };

  const handleOpenFaceCapture = () => {
    if (!resolvedEmployee) {
      Alert.alert('Employee required', 'Scan an employee QR code first before capturing a face image.');
      return;
    }

    setShowFaceCapture(true);
  };

  if (showFaceCapture && resolvedEmployee) {
    return (
      <FaceCaptureScreen
        employee={resolvedEmployee}
        branchCode={branchCode}
        onBack={() => setShowFaceCapture(false)}
        onCaptured={(employee) => {
          setResolvedEmployee(employee);
          setScanResult({
            success: true,
            message: 'Face capture saved',
            detail: [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.employeeCode || '',
          });
          setScanStage('success');
        }}
      />
    );
  }

  if (hasPermission === null || loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#f0c91d" size="large" />
        <Text style={styles.loaderText}>Preparing branch scanner...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loaderText}>Camera access is required before the branch kiosk can scan attendance codes.</Text>
        <Text style={styles.loaderText}>Please grant camera permission in your device settings and restart the app.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => void onLogout()}>
          <Text style={styles.permissionButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {scannerActive ? (
        <CameraView
          style={styles.cameraView}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      ) : (
        <View style={styles.cameraPlaceholder} />
      )}

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <View style={styles.brandPanel}>
            <View style={styles.branchBadge}>
              <Text style={styles.branchBadgeText}>I A</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{branchName}</Text>
              <Text style={styles.statusDot}>●</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={() => void onLogout()}>
            <Ionicons name="log-out-outline" size={18} color="#cfd9e8" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.presentToggle} onPress={() => setShowPresentList((value) => !value)}>
          <Text style={styles.presentToggleText}>View Present ({presentEmployees.length})</Text>
          <Ionicons name={showPresentList ? 'chevron-up' : 'chevron-down'} size={16} color="#cfd9e8" />
        </TouchableOpacity>

        {showPresentList ? (
          <View style={styles.presentPanel}>
            {presentEmployees.length === 0 ? (
              <Text style={styles.emptyCopy}>No employees currently present</Text>
            ) : (
              <FlatList
                data={presentEmployees}
                keyExtractor={(item) => `${item.id}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.presentItem}>
                    <Text style={styles.presentName}>{item.name}</Text>
                    <Text style={styles.presentMeta}>{item.timeIn} • Active</Text>
                  </View>
                )}
              />
            )}
          </View>
        ) : null}

        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.scanLine]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.cameraHint}>
            {processingDelay ? `Processing in ${countdown}` : busy ? 'Submitting attendance...' : 'Align QR code within frame'}
          </Text>

          <TouchableOpacity style={styles.manualToggle} onPress={() => setShowManualEntry((value) => !value)}>
            <Text style={styles.manualToggleText}>{showManualEntry ? 'Hide manual entry' : 'Tap to enter code manually'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.faceCaptureButton} onPress={handleOpenFaceCapture}>
            <Ionicons name="person-circle-outline" size={18} color="#07111f" />
            <Text style={styles.faceCaptureButtonText}>Face Capture</Text>
          </TouchableOpacity>

          {!scannerActive ? (
            <TouchableOpacity style={styles.reopenScannerButton} onPress={resetScanner} disabled={busy || processingDelay}>
              <Text style={styles.reopenScannerText}>Reopen Scanner</Text>
            </TouchableOpacity>
          ) : null}

          {showManualEntry ? (
            <View style={styles.manualPanel}>
              <TextInput
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Paste or type QR code / employee code"
                placeholderTextColor="rgba(230,238,255,0.42)"
                style={styles.manualInput}
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit} disabled={!manualCode.trim() || busy || processingDelay}>
                <Text style={styles.submitButtonText}>Submit Code</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Scanner Status</Text>
          {resolvedEmployee ? (
            <View style={styles.employeeSummary}>
              <Text style={styles.employeeName}>
                {[resolvedEmployee.firstName, resolvedEmployee.lastName].filter(Boolean).join(' ') || resolvedEmployee.employeeCode || 'Employee'}
              </Text>
              <Text style={styles.employeeMeta}>
                {resolvedEmployee.employeeCode || '--'} • {resolvedEmployee.branchName || resolvedEmployee.branchCode || 'Unknown branch'}
              </Text>
            </View>
          ) : null}
          {scanResult ? (
            <View style={[styles.resultBanner, scanResult.success ? styles.resultSuccess : styles.resultError]}>
              <Text style={styles.resultMessage}>{scanResult.message}</Text>
              {scanResult.detail ? <Text style={styles.resultDetail}>{scanResult.detail}</Text> : null}
            </View>
          ) : (
            <Text style={styles.statusCopy}>Ready to scan.</Text>
          )}
          <Text style={styles.debugLine}>Stage: {scanStage}</Text>
          {parsedFormat ? <Text style={styles.debugLine}>Format: {parsedFormat}</Text> : null}
          {lastQrData ? <Text style={styles.lastScanCopy}>Last scan: {lastQrData.slice(0, 48)}{lastQrData.length > 48 ? '...' : ''}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#191d24',
  },
  overlay: {
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 18,
    backgroundColor: 'rgba(13, 18, 28, 0.26)',
  },
  loader: {
    flex: 1,
    backgroundColor: '#07111f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loaderText: {
    color: '#f7fbff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 22,
  },
  permissionButton: {
    borderRadius: 14,
    backgroundColor: '#f0c91d',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 18,
  },
  permissionButtonText: {
    color: '#07111f',
    fontSize: 14,
    fontWeight: '800',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(25, 34, 49, 0.95)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  brandPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  branchBadge: {
    minWidth: 46,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#f0c91d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  branchBadgeText: {
    color: '#0b1020',
    fontSize: 14,
    fontWeight: '900',
  },
  headerTitle: {
    color: '#f7fbff',
    fontSize: 16,
    fontWeight: '800',
  },
  statusDot: {
    color: '#1ed760',
    fontSize: 10,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: '#cfd9e8',
    fontSize: 14,
  },
  presentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'flex-start',
    minWidth: 150,
    borderRadius: 4,
    backgroundColor: 'rgba(48, 60, 87, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  presentToggleText: {
    color: '#cfd9e8',
    fontSize: 14,
  },
  presentPanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,18,30,0.92)',
    padding: 14,
    marginTop: 10,
  },
  emptyCopy: {
    color: '#7e8c9e',
    textAlign: 'center',
    fontSize: 13,
  },
  presentItem: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  presentName: {
    color: '#f7fbff',
    fontSize: 14,
    fontWeight: '700',
  },
  presentMeta: {
    color: '#8bcbb8',
    fontSize: 12,
    marginTop: 4,
  },
  frameWrap: {
    alignItems: 'center',
    marginTop: 88,
  },
  frame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#f0c91d',
    borderWidth: 3,
  },
  topLeft: {
    top: 12,
    left: 14,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 12,
    right: 14,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 12,
    left: 14,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 12,
    right: 14,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    top: 82,
    left: 54,
    right: 54,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#f0c91d',
  },
  cameraHint: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  manualToggle: {
    marginTop: 12,
  },
  manualToggleText: {
    color: '#f0c91d',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  reopenScannerButton: {
    marginTop: 12,
  },
  reopenScannerText: {
    color: '#f7fbff',
    fontSize: 13,
    fontWeight: '700',
  },
  manualPanel: {
    width: '100%',
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(12, 18, 28, 0.9)',
    padding: 12,
    gap: 12,
  },
  faceCaptureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#7ef0d4',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  faceCaptureButtonText: {
    color: '#07111f',
    fontSize: 14,
    fontWeight: '800',
  },
  manualInput: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f7fbff',
    paddingHorizontal: 14,
  },
  submitButton: {
    borderRadius: 12,
    backgroundColor: '#f0c91d',
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#07111f',
    fontSize: 15,
    fontWeight: '800',
  },
  statusCard: {
    marginTop: 'auto',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,18,30,0.92)',
    padding: 18,
  },
  statusTitle: {
    color: '#f7fbff',
    fontSize: 17,
    fontWeight: '800',
  },
  employeeSummary: {
    marginTop: 14,
    marginBottom: 6,
  },
  employeeName: {
    color: '#f7fbff',
    fontSize: 16,
    fontWeight: '700',
  },
  employeeMeta: {
    color: 'rgba(230,238,255,0.72)',
    fontSize: 12,
    marginTop: 4,
  },
  statusCopy: {
    color: '#cfd9e8',
    fontSize: 14,
    marginTop: 14,
  },
  resultBanner: {
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultSuccess: {
    backgroundColor: 'rgba(23, 151, 115, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(126,240,212,0.24)',
  },
  resultError: {
    backgroundColor: 'rgba(180, 58, 58, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 120, 120, 0.24)',
  },
  resultMessage: {
    color: '#f7fbff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultDetail: {
    color: 'rgba(230,238,255,0.75)',
    fontSize: 12,
    marginTop: 4,
  },
  lastScanCopy: {
    color: '#7e8c9e',
    fontSize: 12,
    marginTop: 14,
  },
  debugLine: {
    color: '#8bcbb8',
    fontSize: 12,
    marginTop: 10,
  },
});
