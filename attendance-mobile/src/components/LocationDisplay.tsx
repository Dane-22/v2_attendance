import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LocationCoordinates,
  LocationError,
} from '../types';
import {
  getCurrentLocation,
  formatCoordinates,
  formatDistance,
  parseLocationError,
} from '../utils/locationService';

interface LocationDisplayProps {
  onLocationAcquired?: (location: LocationCoordinates) => void;
  onLocationError?: (error: LocationError) => void;
  branchLocation?: { latitude: number; longitude: number; radius: number };
  showDistance?: boolean;
}

type LocationStatus = 'loading' | 'success' | 'error' | 'idle';

export default function LocationDisplay({
  onLocationAcquired,
  onLocationError,
  branchLocation,
  showDistance = true,
}: LocationDisplayProps) {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const acquireLocation = async () => {
    setStatus('loading');
    setError(null);

    try {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      setStatus('success');

      // Calculate distance if branch location provided
      if (branchLocation) {
        const dist = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          branchLocation.latitude,
          branchLocation.longitude
        );
        setDistance(dist);
      }

      onLocationAcquired?.(currentLocation);
    } catch (err: any) {
      const parsedError = parseLocationError(err);
      setError(parsedError);
      setStatus('error');
      onLocationError?.(parsedError);
    }
  };

  useEffect(() => {
    acquireLocation();
  }, []);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <View style={styles.content}>
            <ActivityIndicator color="#7ef0d4" size="small" />
            <Text style={styles.text}>Acquiring location...</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.content}>
            <Ionicons name="location" size={16} color="#7ef0d4" />
            <View style={styles.locationInfo}>
              <Text style={styles.coordinates}>{formatCoordinates(location!)}</Text>
              {location?.accuracy && (
                <Text style={styles.accuracy}>Accuracy: ±{formatDistance(location.accuracy)}</Text>
              )}
              {showDistance && distance !== null && branchLocation && (
                <Text style={[
                  styles.distance,
                  distance > branchLocation.radius ? styles.distanceWarning : styles.distanceValid
                ]}>
                  {distance > branchLocation.radius ? '⚠️ ' : ''}
                  {formatDistance(distance)} from branch
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={acquireLocation} style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#7ef0d4" />
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.content}>
            <Ionicons name="location-outline" size={16} color="#ff7b7b" />
            <View style={styles.errorInfo}>
              <Text style={styles.errorText}>{error?.message || 'Location unavailable'}</Text>
              <TouchableOpacity onPress={acquireLocation} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 18, 30, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    color: '#cfd9e8',
    fontSize: 13,
  },
  locationInfo: {
    flex: 1,
  },
  coordinates: {
    color: '#7ef0d4',
    fontSize: 13,
    fontWeight: '600',
  },
  accuracy: {
    color: 'rgba(230, 238, 255, 0.72)',
    fontSize: 11,
    marginTop: 2,
  },
  distance: {
    color: '#8bcbb8',
    fontSize: 11,
    marginTop: 2,
  },
  distanceValid: {
    color: '#8bcbb8',
  },
  distanceWarning: {
    color: '#ffb86c',
  },
  refreshButton: {
    padding: 4,
  },
  errorInfo: {
    flex: 1,
  },
  errorText: {
    color: '#ff7b7b',
    fontSize: 12,
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#7ef0d4',
    fontSize: 11,
    fontWeight: '600',
  },
});
