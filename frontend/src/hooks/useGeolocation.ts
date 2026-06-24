import { useState, useEffect, useRef, useCallback } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

export interface GeolocationState {
  location: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  permissionStatus: PermissionState;
}

const GEOLOCATION_TIMEOUT = 15000; // 15 seconds timeout
const ACCURACY_THRESHOLD = 100; // 100 meters accuracy threshold

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    permissionStatus: 'prompt',
  });

  const watchIdRef = useRef<number | null>(null);

  // Parse geolocation error
  const parseError = useCallback((error: GeolocationPositionError): GeolocationError => {
    let type: GeolocationError['type'] = 'UNKNOWN';
    let message = error.message;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        type = 'PERMISSION_DENIED';
        message = 'Location permission denied. Please enable location access in browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        type = 'POSITION_UNAVAILABLE';
        message = 'Location information is unavailable. Please check your device settings.';
        break;
      case error.TIMEOUT:
        type = 'TIMEOUT';
        message = 'Location request timed out. Please try again or move to an area with better GPS signal.';
        break;
      default:
        type = 'UNKNOWN';
        message = 'An unknown error occurred while getting location.';
    }

    return { code: error.code, message, type };
  }, []);

  // Request location permission and get current position
  const requestLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!navigator.geolocation) {
      const error: GeolocationError = {
        code: 0,
        message: 'Geolocation is not supported by your browser',
        type: 'UNKNOWN',
      };
      setState(prev => ({ ...prev, error, loading: false }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          // Check accuracy threshold
          if (position.coords.accuracy > ACCURACY_THRESHOLD) {
            const error: GeolocationError = {
              code: 0,
              message: `GPS accuracy too low (${position.coords.accuracy.toFixed(0)}m). Please move to an open area for better accuracy.`,
              type: 'POSITION_UNAVAILABLE',
            };
            setState(prev => ({ 
              ...prev, 
              location, 
              error, 
              loading: false,
              permissionStatus: 'granted',
            }));
            resolve(location);
            return;
          }

          // Store permission state in localStorage
          localStorage.setItem('geolocationPermission', 'granted');

          setState(prev => ({ 
            ...prev, 
            location, 
            error: null, 
            loading: false,
            permissionStatus: 'granted',
          }));
          resolve(location);
        },
        (error) => {
          const parsedError = parseError(error);
          
          // Store permission state in localStorage
          if (error.code === error.PERMISSION_DENIED) {
            localStorage.setItem('geolocationPermission', 'denied');
            setState(prev => ({ 
              ...prev, 
              error: parsedError, 
              loading: false,
              permissionStatus: 'denied',
            }));
          } else {
            setState(prev => ({ 
              ...prev, 
              error: parsedError, 
              loading: false,
            }));
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: 0, // Always get fresh position
        }
      );
    });
  }, [parseError]);

  // Start watching location
  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        // Check accuracy threshold
        if (position.coords.accuracy > ACCURACY_THRESHOLD) {
          const error: GeolocationError = {
            code: 0,
            message: `GPS accuracy too low (${position.coords.accuracy.toFixed(0)}m). Please move to an open area for better accuracy.`,
            type: 'POSITION_UNAVAILABLE',
          };
          setState(prev => ({ 
            ...prev, 
            location, 
            error,
            permissionStatus: 'granted',
          }));
          return;
        }

        setState(prev => ({ 
          ...prev, 
          location, 
          error: null,
          permissionStatus: 'granted',
        }));
      },
      (error) => {
        const parsedError = parseError(error);
        setState(prev => ({ 
          ...prev, 
          error: parsedError,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT,
        maximumAge: 5000, // Allow 5 second cache for watching
      }
    );
  }, [parseError]);

  // Stop watching location
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Check permission status on mount
  useEffect(() => {
    const savedPermission = localStorage.getItem('geolocationPermission');
    if (savedPermission === 'granted') {
      setState(prev => ({ ...prev, permissionStatus: 'granted' }));
    } else if (savedPermission === 'denied') {
      setState(prev => ({ ...prev, permissionStatus: 'denied' }));
    } else {
      setState(prev => ({ ...prev, permissionStatus: 'prompt' }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    requestLocation,
    watchLocation,
    stopWatching,
  };
};
