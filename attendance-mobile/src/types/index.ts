export interface User {
  id: number;
  employee_code: string;
  name: string;
  department: string;
  position: string;
  branch: string;
}

export interface Admin {
  id: number;
  username: string;
  role: string;
  branch_code?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: 'employee' | 'admin' | null;
  user: User | Admin | null;
  token: string | null;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: 'present' | 'late' | 'absent' | 'available';
  location?: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
}
