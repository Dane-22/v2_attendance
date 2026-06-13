import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, CameraCapturedPicture, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { employeeApi, ResolvedEmployee } from '../api/employeeApi';

interface FaceCaptureScreenProps {
  employee: ResolvedEmployee;
  branchCode: string;
  onBack: () => void;
  onCaptured?: (employee: ResolvedEmployee) => void;
}

export default function FaceCaptureScreen({
  employee,
  branchCode,
  onBack,
  onCaptured = () => {},
}: FaceCaptureScreenProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<CameraCapturedPicture | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const employeeName =
    [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.employeeCode || 'Employee';

  const handleTakePhoto = async () => {
    if (!cameraRef.current || capturing || uploading) {
      return;
    }

    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });

      setCapturedPhoto(photo);
    } catch (error: any) {
      Alert.alert('Capture failed', error?.message || 'Unable to capture face image.');
    } finally {
      setCapturing(false);
    }
  };

  const handleUpload = async () => {
    if (!capturedPhoto?.uri || uploading) {
      return;
    }

    try {
      setUploading(true);
      const result = await employeeApi.uploadFaceCapture(employee.id, {
        uri: capturedPhoto.uri,
        branchCode,
        fileName: `${employee.employeeCode || employee.id}_face.jpg`,
        mimeType: 'image/jpeg',
      });

      onCaptured(result);
      Alert.alert('Face capture saved', 'Face image uploaded successfully for facial-recognition preparation.');
      onBack();
    } catch (error: any) {
      Alert.alert('Upload failed', error?.response?.data?.message || error?.message || 'Unable to upload face capture.');
    } finally {
      setUploading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#7ef0d4" size="large" />
        <Text style={styles.loaderText}>Preparing face capture...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loaderText}>Camera permission is required for face capture.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {capturedPhoto ? (
        <Image source={{ uri: capturedPhoto.uri }} style={styles.cameraView} resizeMode="cover" />
      ) : (
        <CameraView ref={cameraRef} style={styles.cameraView} facing="front" />
      )}

      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={onBack} disabled={uploading}>
            <Ionicons name="arrow-back" size={20} color="#f7fbff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Face Capture</Text>
            <Text style={styles.headerSubtitle}>{employeeName}</Text>
          </View>
        </View>

        <View style={styles.frameWrap}>
          <View style={styles.faceFrame}>
            <View style={[styles.frameCorner, styles.topLeft]} />
            <View style={[styles.frameCorner, styles.topRight]} />
            <View style={[styles.frameCorner, styles.bottomLeft]} />
            <View style={[styles.frameCorner, styles.bottomRight]} />
          </View>
          <Text style={styles.instruction}>
            {capturedPhoto
              ? 'Review the photo before uploading.'
              : 'Center the face in frame and keep the device steady.'}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.employeeCard}>
            <Text style={styles.employeeName}>{employeeName}</Text>
            <Text style={styles.employeeMeta}>
              {(employee.employeeCode || '--') + ' • ' + (employee.branchName || employee.branchCode || branchCode)}
            </Text>
          </View>

          {capturedPhoto ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setCapturedPhoto(null)} disabled={uploading}>
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleUpload} disabled={uploading}>
                <Text style={styles.primaryButtonText}>{uploading ? 'Uploading...' : 'Save Face Capture'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto} disabled={capturing || uploading}>
              <View style={styles.captureOuter}>
                <View style={styles.captureInner} />
              </View>
              <Text style={styles.captureCopy}>{capturing ? 'Capturing...' : 'Capture Face'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050a12',
  },
  cameraView: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 15, 0.28)',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 22,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#07111f',
    paddingHorizontal: 24,
  },
  loaderText: {
    color: '#f7fbff',
    fontSize: 14,
    marginTop: 14,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#7ef0d4',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#07111f',
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(9, 17, 28, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#f7fbff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(230,238,255,0.78)',
    fontSize: 13,
    marginTop: 4,
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFrame: {
    width: 240,
    height: 320,
    borderRadius: 120,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderColor: '#7ef0d4',
    borderWidth: 4,
  },
  topLeft: {
    top: 14,
    left: 26,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: 14,
    right: 26,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: 14,
    left: 26,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: 14,
    right: 26,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 24,
  },
  instruction: {
    color: '#f7fbff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 22,
    paddingHorizontal: 24,
  },
  footer: {
    gap: 14,
  },
  employeeCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(9, 17, 28, 0.9)',
    padding: 16,
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
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#f7fbff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9, 17, 28, 0.5)',
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7ef0d4',
  },
  captureCopy: {
    color: '#f7fbff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(9, 17, 28, 0.9)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#f7fbff',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1.4,
    borderRadius: 16,
    backgroundColor: '#7ef0d4',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#07111f',
    fontSize: 14,
    fontWeight: '800',
  },
});
