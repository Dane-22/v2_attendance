// Geolocation types for the test environment
// These types are separate from production types to avoid conflicts

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

export interface AttendanceWithLocation {
  qrCodeData: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
  branch_code?: string;
}

export interface AttendanceResponseWithLocation {
  success: boolean;
  message: string;
  data?: {
    action: 'clock_in' | 'clock_out';
    employeeId: number;
    employeeName: string;
    attendance: any;
    locationStatus?: 'valid' | 'invalid' | 'error' | 'denied';
    locationMessage?: string;
    distance?: number;
  };
}
