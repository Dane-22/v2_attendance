'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database,
  Download,
  Upload,
  Mail,
  Calendar,
  Settings,
  Play,
  Pause,
  Trash2,
  Clock,
  HardDrive,
  Cloud,
  Shield,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Archive
} from 'lucide-react';
import { BackupSettings as BackupSettingsType, BackupRecord } from '../types';

const BACKUP_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BackupSettings() {
  const { classes } = useTheme();
  const queryClient = useQueryClient();
  const [apiAvailable, setApiAvailable] = useState(true);

  // Check API availability on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(`${BACKUP_API_URL}/backup/stats`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setApiAvailable(response.ok);
      } catch {
        setApiAvailable(false);
      }
    };
    checkApi();
  }, []);

  // State for backup settings
  const [backupSettings, setBackupSettings] = useState<BackupSettingsType>({
    emailDelivery: {
      enabled: true,
      recipients: [],
      subject: '',
      message: ''
    },
    cloudStorage: {
      enabled: false,
      provider: 'GOOGLE_DRIVE',
      config: {}
    },
    schedule: {
      type: 'DATABASE',
      cron: '0 2 * * *', // Daily at 2 AM
      enabled: false,
      retentionDays: 30
    }
  });

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);

  // Fetch backups
  const { data: backupsData, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      try {
        const response = await fetch(`${BACKUP_API_URL}/backup/list?page=1&limit=10`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          console.warn('Backup API not available:', response.status);
          return { backups: [], pagination: { total: 0, pages: 0 } };
        }
        const result = await response.json();
        return result.data || { backups: [], pagination: { total: 0, pages: 0 } };
      } catch (error) {
        console.warn('Failed to fetch backups:', error);
        return { backups: [], pagination: { total: 0, pages: 0 } };
      }
    }
  });

  // Fetch backup stats
  const { data: stats } = useQuery({
    queryKey: ['backup-stats'],
    queryFn: async () => {
      try {
        const response = await fetch(`${BACKUP_API_URL}/backup/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          console.warn('Backup stats API not available:', response.status);
          return { totalBackups: 0, totalSize: 0, recentBackups: 0, lastBackup: null };
        }
        const result = await response.json();
        return result.data || { totalBackups: 0, totalSize: 0, recentBackups: 0, lastBackup: null };
      } catch (error) {
        console.warn('Failed to fetch backup stats:', error);
        return { totalBackups: 0, totalSize: 0, recentBackups: 0, lastBackup: null };
      }
    }
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async ({ type, description }: { type: 'DATABASE' | 'FILES' | 'FULL'; description: string }) => {
      const response = await fetch(`${BACKUP_API_URL}/backup/${type.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          description,
          sendEmail: backupSettings.emailDelivery.enabled
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
      setBackupDescription('');
      setIsCreatingBackup(false);
    },
    onError: (error) => {
      console.error('Backup creation failed:', error);
      setIsCreatingBackup(false);
    }
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: number) => {
      const response = await fetch(`${BACKUP_API_URL}/backup/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
    }
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: number) => {
      const response = await fetch(`${BACKUP_API_URL}/backup/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          backupId,
          confirmPassword: 'RESTORE_CONFIRMED'
        })
      });
      return response.json();
    },
    onSuccess: () => {
      setShowRestoreConfirm(false);
      setSelectedBackup(null);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    }
  });

  const handleCreateBackup = (type: 'DATABASE' | 'FILES' | 'FULL') => {
    setIsCreatingBackup(true);
    createBackupMutation.mutate({ type, description: backupDescription });
  };

  const handleDeleteBackup = (backupId: number) => {
    if (confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      deleteBackupMutation.mutate(backupId);
    }
  };

  const handleDownloadBackup = (backupId: number, filename: string) => {
    window.open(`${BACKUP_API_URL}/backup/download/${backupId}?token=${localStorage.getItem('token')}`, '_blank');
  };

  const handleRestoreBackup = (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = () => {
    if (selectedBackup) {
      restoreBackupMutation.mutate(selectedBackup.id);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'DATABASE': return <Database className="w-4 h-4" />;
      case 'FILES': return <Archive className="w-4 h-4" />;
      case 'FULL': return <HardDrive className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400';
      case 'FAILED': return 'text-red-400';
      case 'PENDING': return 'text-yellow-400';
      case 'IN_PROGRESS': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* API Not Available Warning */}
      {!apiAvailable && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-400 font-medium">Backup API Not Ready</h4>
            <p className="text-yellow-400/80 text-sm mt-1">
              The backup service requires a server restart. Please stop the backend server, run &quot;npx prisma generate&quot; and &quot;npm run build&quot;, then restart with &quot;npm start&quot;.
            </p>
          </div>
        </div>
      )}

      {/* Manual Backup Section */}
      <div className={`${classes.bgCard} rounded-xl ${classes.border} p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-lg ${classes.hoverAccent} ${classes.borderAccent} flex items-center justify-center`}>
            <Database className={`w-5 h-5 ${classes.textAccent}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${classes.text}`}>Manual Backup</h3>
            <p className={`text-sm ${classes.textMuted}`}>Create on-demand backups of your system</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${classes.text} mb-2`}>
              Backup Description
            </label>
            <input
              type="text"
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              placeholder="Optional description for this backup"
              className={`w-full px-3 py-2 ${classes.bgCard} ${classes.border} rounded-lg ${classes.text} placeholder:${classes.textMuted}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleCreateBackup('DATABASE')}
              disabled={isCreatingBackup}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                isCreatingBackup 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Database</span>
              {isCreatingBackup && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            </button>

            <button
              onClick={() => handleCreateBackup('FILES')}
              disabled={isCreatingBackup}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                isCreatingBackup 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Files</span>
            </button>

            <button
              onClick={() => handleCreateBackup('FULL')}
              disabled={isCreatingBackup}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                isCreatingBackup 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Full System</span>
            </button>
          </div>
        </div>
      </div>

      {/* Email Delivery Settings */}
      <div className={`${classes.bgCard} rounded-xl ${classes.border} p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-lg ${classes.hoverAccent} ${classes.borderAccent} flex items-center justify-center`}>
            <Mail className={`w-5 h-5 ${classes.textAccent}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${classes.text}`}>Email Delivery</h3>
            <p className={`text-sm ${classes.textMuted}`}>Configure automatic email delivery of backups</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${classes.text}`}>Enable Email Delivery</label>
            <button
              onClick={() => setBackupSettings(prev => ({
                ...prev,
                emailDelivery: { ...prev.emailDelivery, enabled: !prev.emailDelivery.enabled }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                backupSettings.emailDelivery.enabled 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                backupSettings.emailDelivery.enabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {backupSettings.emailDelivery.enabled && (
            <div>
              <label className={`block text-sm font-medium ${classes.text} mb-2`}>
                Email Recipients
              </label>
              <input
                type="email"
                multiple
                placeholder="admin@example.com, it@example.com"
                className={`w-full px-3 py-2 ${classes.bgCard} ${classes.border} rounded-lg ${classes.text} placeholder:${classes.textMuted}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Backup History */}
      <div className={`${classes.bgCard} rounded-xl ${classes.border} p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-lg ${classes.hoverAccent} ${classes.borderAccent} flex items-center justify-center`}>
            <Clock className={`w-5 h-5 ${classes.textAccent}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${classes.text}`}>Backup History</h3>
            <p className={`text-sm ${classes.textMuted}`}>View and manage your backup files</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`${classes.bgCard} rounded-lg ${classes.border} p-4`}>
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${classes.textAccent}`} />
                <span className={`text-2xl font-bold ${classes.text}`}>{stats.totalBackups}</span>
              </div>
              <p className={`text-sm ${classes.textMuted}`}>Total Backups</p>
            </div>
            <div className={`${classes.bgCard} rounded-lg ${classes.border} p-4`}>
              <div className="flex items-center gap-2">
                <HardDrive className={`w-5 h-5 ${classes.textAccent}`} />
                <span className={`text-2xl font-bold ${classes.text}`}>{formatFileSize(Number(stats.totalSize))}</span>
              </div>
              <p className={`text-sm ${classes.textMuted}`}>Total Size</p>
            </div>
            <div className={`${classes.bgCard} rounded-lg ${classes.border} p-4`}>
              <div className="flex items-center gap-2">
                <Calendar className={`w-5 h-5 ${classes.textAccent}`} />
                <span className={`text-2xl font-bold ${classes.text}`}>{stats.recentBackups}</span>
              </div>
              <p className={`text-sm ${classes.textMuted}`}>Recent (7 days)</p>
            </div>
            <div className={`${classes.bgCard} rounded-lg ${classes.border} p-4`}>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${classes.textAccent}`} />
                <span className={`text-2xl font-bold ${classes.text}`}>{stats.lastBackup ? formatDate(stats.lastBackup.created_at) : 'Never'}</span>
              </div>
              <p className={`text-sm ${classes.textMuted}`}>Last Backup</p>
            </div>
          </div>
        )}

        {isLoadingBackups ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : backupsData?.backups?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${classes.border}`}>
                  <th className={`text-left p-3 ${classes.text}`}>Type</th>
                  <th className={`text-left p-3 ${classes.text}`}>Filename</th>
                  <th className={`text-left p-3 ${classes.text}`}>Size</th>
                  <th className={`text-left p-3 ${classes.text}`}>Created</th>
                  <th className={`text-left p-3 ${classes.text}`}>Status</th>
                  <th className={`text-left p-3 ${classes.text}`}>Downloads</th>
                  <th className={`text-left p-3 ${classes.text}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backupsData.backups.map((backup: BackupRecord) => (
                  <tr key={backup.id} className={`border-b ${classes.border} hover:${classes.bgCardHover}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getBackupTypeIcon(backup.type)}
                        <span className={`text-sm ${classes.text}`}>{backup.type}</span>
                      </div>
                    </td>
                    <td className={`p-3 text-sm ${classes.text}`}>{backup.filename}</td>
                    <td className={`p-3 text-sm ${classes.text}`}>{formatFileSize(Number(backup.size))}</td>
                    <td className={`p-3 text-sm ${classes.text}`}>{formatDate(backup.created_at)}</td>
                    <td className={`p-3`}>
                      <span className={`text-sm ${getStatusColor(backup.status)}`}>
                        {backup.status}
                      </span>
                    </td>
                    <td className={`p-3 text-sm ${classes.text}`}>{backup.download_count}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadBackup(backup.id, backup.filename)}
                          className={`p-1 rounded hover:${classes.hoverAccent} ${classes.text}`}
                          title="Download backup"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRestoreBackup(backup)}
                          className={`p-1 rounded hover:${classes.hoverAccent} ${classes.text}`}
                          title="Restore from backup"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className={`p-1 rounded hover:bg-red-500/20 hover:text-red-400 ${classes.text}`}
                          title="Delete backup"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Archive className={`w-12 h-12 ${classes.textMuted} mx-auto mb-4`} />
            <p className={`${classes.textMuted}`}>No backups found. Create your first backup above.</p>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md ${classes.bgCard} rounded-xl ${classes.border} shadow-2xl overflow-hidden`}>
            <div className={`p-6 border-b ${classes.border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${classes.text}`}>Confirm Restore</h3>
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className={`p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors ${classes.text}`}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <AlertCircle className={`w-12 h-12 text-red-400 mx-auto mb-4`} />
                <h4 className={`text-lg font-semibold ${classes.text} text-center mb-2`}>Warning: System Restore</h4>
                <p className={`${classes.text} text-center mb-4`}>
                  This will restore your system from the backup "<strong>{selectedBackup.filename}</strong>" created on {formatDate(selectedBackup.created_at)}.
                </p>
                <p className={`${classes.textMuted} text-sm text-center`}>
                  This action cannot be undone. All current data will be replaced with the backup data.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className={`flex-1 px-4 py-2 ${classes.bgCard} ${classes.border} rounded-lg ${classes.text} hover:${classes.borderHover} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestore}
                  disabled={restoreBackupMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restoreBackupMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Restoring...</span>
                    </div>
                  ) : (
                    'Restore System'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
