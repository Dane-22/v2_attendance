import * as Location from 'expo-location';
import {
  LocationCoordinates,
  LocationPermissionStatus,
  LocationError,
  LocationValidationResult,
} from '../types';

const ACCURACY_THRESHOLD = 100; // meters
const LOCATION_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

/**
 * Request location permissions from the user
 */
export const requestLocationPermission = async (): Promise<LocationPermissionStatus> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    return {
      granted: status === 'granted',
      canAskAgain: status !== 'denied',
      status: status as 'granted' | 'denied' | 'undetermined' | 'limited',
    };
  } catch (error: any) {
    console.error('[LocationService] Permission request failed:', error);
    return {
      granted: false,
      canAskAgain: true,
      status: 'denied',
    };
  }
};

/**
 * Check if location services are enabled
 */
export const areLocationServicesEnabled = async (): Promise<boolean> => {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('[LocationService] Failed to check location services:', error);
    return false;
  }
};

/**
 * Get current location with retry logic
 */
export const getCurrentLocation = async (
  retryCount: number = 0
): Promise<LocationCoordinates> => {
  try {
    const servicesEnabled = await areLocationServicesEnabled();
    if (!servicesEnabled) {
      throw new Error('Location services are disabled');
    }

    const permissionStatus = await requestLocationPermission();
    if (!permissionStatus.granted) {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      altitude: location.coords.altitude || undefined,
      altitudeAccuracy: location.coords.altitudeAccuracy || undefined,
      heading: location.coords.heading || undefined,
      speed: location.coords.speed || undefined,
    };
  } catch (error: any) {
    console.error(`[LocationService] Get location failed (attempt ${retryCount + 1}):`, error);
    
    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const backoffTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return getCurrentLocation(retryCount + 1);
    }

    throw parseLocationError(error);
  }
};

/**
 * Parse location error into standardized format
 */
export const parseLocationError = (error: any): LocationError => {
  if (!error) {
    return {
      message: 'Unknown location error',
      type: 'UNKNOWN',
    };
  }

  let type: LocationError['type'] = 'UNKNOWN';
  let message = error.message || 'Unknown error';

  if (error.message?.includes('permission') || error.code === 1) {
    type = 'PERMISSION_DENIED';
    message = 'Location permission denied by user';
  } else if (error.message?.includes('unavailable') || error.code === 2) {
    type = 'POSITION_UNAVAILABLE';
    message = 'Location information unavailable';
  } else if (error.message?.includes('timeout') || error.code === 3) {
    type = 'TIMEOUT';
    message = 'Location request timed out';
  }

  return {
    code: error.code,
    message,
    type,
  };
};

/**
 * Check if GPS accuracy is acceptable
 */
export const isAccuracyAcceptable = (accuracy: number, threshold: number = ACCURACY_THRESHOLD): boolean => {
  return accuracy <= threshold;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
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

  return R * c; // Distance in meters
};

/**
 * Validate location against branch coordinates
 */
export const validateLocation = (
  currentLocation: LocationCoordinates,
  branchLocation: { latitude: number; longitude: number; radius: number }
): LocationValidationResult => {
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    branchLocation.latitude,
    branchLocation.longitude
  );

  const withinRadius = distance <= branchLocation.radius;
  const isValid = withinRadius;
  const accuracy = currentLocation.accuracy || 0;

  let message = '';
  if (isValid) {
    message = `Location valid (${formatDistance(distance)} from branch)`;
  } else {
    message = `Location invalid (${formatDistance(distance)} from branch, max allowed: ${formatDistance(branchLocation.radius)})`;
  }

  if (accuracy > 0) {
    message += ` (GPS accuracy: ±${formatDistance(accuracy)})`;
  }

  return {
    isValid,
    distance,
    withinRadius,
    accuracy,
    message,
  };
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters.toFixed(0)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(2)}km`;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (location: LocationCoordinates): string => {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
};

/**
 * Get location with timeout and error handling
 */
export const getLocationWithTimeout = async (
  timeoutMs: number = LOCATION_TIMEOUT
): Promise<LocationCoordinates> => {
  return Promise.race([
    getCurrentLocation(),
    new Promise<LocationCoordinates>((_, reject) =>
      setTimeout(() => reject(new Error('Location request timeout')), timeoutMs)
    ),
  ]);
};
