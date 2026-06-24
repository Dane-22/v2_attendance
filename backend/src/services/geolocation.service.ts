// Geolocation service for location validation and distance calculation

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationValidationResult {
  isValid: boolean;
  distance: number;
  withinRadius: boolean;
  accuracy: number;
  message: string;
}

export interface BranchLocation {
  branchCode: string;
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
 * Validate if a location is within the allowed radius of a branch
 * @param scanLocation The location where the scan occurred
 * @param branchLocation The branch's registered location
 * @param accuracy GPS accuracy in meters
 * @param radius Allowed radius in meters (default 500m)
 * @returns Validation result with distance and status
 */
export const validateLocation = (
  scanLocation: LocationCoordinates,
  branchLocation: BranchLocation,
  accuracy: number = 0,
  radius?: number
): LocationValidationResult => {
  const allowedRadius = radius || branchLocation.radius || 500;
  
  // Calculate distance between scan location and branch location
  const distance = calculateDistance(
    scanLocation.latitude,
    scanLocation.longitude,
    branchLocation.latitude,
    branchLocation.longitude
  );

  const withinRadius = distance <= allowedRadius;
  const isValid = withinRadius;

  // Generate appropriate message
  let message = '';
  if (isValid) {
    message = `Location valid (${distance.toFixed(0)}m from branch)`;
  } else {
    message = `Location invalid (${distance.toFixed(0)}m from branch, max allowed: ${allowedRadius}m)`;
  }

  // Add accuracy information if available
  if (accuracy > 0) {
    message += ` (GPS accuracy: ±${accuracy.toFixed(0)}m)`;
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
 * Parse geolocation error into a standardized format
 * @param error Geolocation error object
 * @returns Standardized error message and type
 */
export const parseLocationError = (error: any): { message: string; type: string } => {
  if (!error) {
    return { message: 'Unknown location error', type: 'UNKNOWN' };
  }

  let type = 'UNKNOWN';
  let message = error.message || 'Unknown error';

  switch (error.code) {
    case error.PERMISSION_DENIED:
      type = 'denied';
      message = 'Location permission denied by user';
      break;
    case error.POSITION_UNAVAILABLE:
      type = 'unavailable';
      message = 'Location information unavailable';
      break;
    case error.TIMEOUT:
      type = 'timeout';
      message = 'Location request timed out';
      break;
    default:
      type = 'unknown';
      message = error.message || 'Unknown location error';
  }

  return { message, type };
};

/**
 * Check if GPS accuracy is acceptable
 * @param accuracy GPS accuracy in meters
 * @param threshold Maximum acceptable accuracy in meters (default 100m)
 * @returns true if accuracy is acceptable
 */
export const isAccuracyAcceptable = (accuracy: number, threshold: number = 100): boolean => {
  return accuracy <= threshold;
};

/**
 * Format distance for display
 * @param distanceInMeters Distance in meters
 * @returns Formatted distance string
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters.toFixed(0)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(2)}km`;
};
