'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FaceRegistration from '@/components/FaceRegistration';
import { ArrowLeft, User } from 'lucide-react';

interface Employee {
  id: number;
  employeeCode: string | null;
  firstName: string | null;
  lastName: string | null;
  department: string | null;
  position: string | null;
}

export default function FaceRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const employeeId = searchParams.get('id');
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setError('No employee ID provided');
      setLoading(false);
      return;
    }

    const fetchEmployee = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/employees/${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token || ''}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch employee');
        }

        const data = await response.json();
        if (data.success) {
          setEmployee(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch employee');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch employee');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  const handleRegistrationComplete = () => {
    // Redirect back to employees list after successful registration
    setTimeout(() => {
      router.push('/dashboard/employees');
    }, 2000);
  };

  const handleCancel = () => {
    router.push('/dashboard/employees');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p>Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/employees')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || 'Employee not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard/employees')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            Register Facial Recognition
          </h1>
          <p className="text-gray-600 mt-1">
            Department: {employee.department || 'N/A'} | Position: {employee.position || 'N/A'}
          </p>
        </div>

        <FaceRegistration
          employeeId={employee.id}
          employeeName={`${employee.firstName || ''} ${employee.lastName || ''}`.trim()}
          employeeCode={employee.employeeCode || 'N/A'}
          onRegistrationComplete={handleRegistrationComplete}
          onCancel={handleCancel}
        />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions for Admin:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Ensure the employee is facing the camera directly</li>
            <li>Capture {5} different angles/slight variations</li>
            <li>Ensure good lighting conditions</li>
            <li>Ask the employee to remove glasses if possible</li>
            <li>Make sure the employee gives explicit consent before registering</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
