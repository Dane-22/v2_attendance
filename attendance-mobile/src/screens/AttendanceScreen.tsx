import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { attendanceApi } from '../api/attendanceApi';
import { branchApi } from '../api/branchApi';
import { employeeApi, SearchEmployee } from '../api/employeeApi';
import { AppHeader } from '../components/AppHeader';
import { GlassCard } from '../components/GlassCard';
import { GradientBackdrop } from '../components/GradientBackdrop';
import { useAppSelector } from '../hooks/useAppSelector';
import { useScreenReveal } from '../hooks/useScreenReveal';
import { AttendanceAuditRecord, BranchEmployee, BranchSummary } from '../types';

type FilterTab = 'Available' | 'Present' | 'Absent' | 'Late';

const FILTER_TABS: FilterTab[] = ['Available', 'Present', 'Absent', 'Late'];

export default function AttendanceScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [employees, setEmployees] = useState<BranchEmployee[]>([]);
  const [auditRecords, setAuditRecords] = useState<AttendanceAuditRecord[]>([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    currentlyPresent: 0,
    completedShifts: 0,
    absent: 0,
    present: 0,
    late: 0,
  });
  const [activeTab, setActiveTab] = useState<FilterTab>('Available');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchEmployee[]>([]);
  const [actingId, setActingId] = useState<number | null>(null);
  const reveal = useScreenReveal(8);

  const branchScoped = Boolean(user?.branch_code);

  const loadBranches = async () => {
    const branchList = branchScoped
      ? [
          {
            id: user?.branch_code || 'current',
            code: user?.branch_code || '',
            name: user?.branch_name || user?.branch_code || '',
            shortName: user?.branch_name || user?.branch_code || '',
            description: user?.branch_name || user?.branch_code || '',
          },
        ]
      : await branchApi.getAll();

    setBranches(branchList);
    if (!selectedBranch && branchList.length > 0) {
      setSelectedBranch(branchList[0].code);
    }
  };

  const loadBranchData = async (branchCode: string) => {
    const [branchEmployees, audit] = await Promise.all([
      branchApi.getEmployees(branchCode),
      attendanceApi.getAudit({ branch_code: branchCode }),
    ]);
    setEmployees(branchEmployees);
    setAuditRecords(audit.records);
    setStats(audit.stats);
  };

  const loadData = async (branchOverride?: string) => {
    setLoading(true);
    try {
      await loadBranches();
      const nextBranch = branchOverride || selectedBranch || user?.branch_code || '';
      if (nextBranch) {
        await loadBranchData(nextBranch);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadBranchData(selectedBranch).catch(() => undefined);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (search.trim().length < 2 || branchScoped) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const result = await employeeApi.getAll({ search: search.trim(), limit: 20 });
        setSearchResults(result.data || []);
      } catch {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [search, branchScoped]);

  const displayedEmployees = useMemo(() => {
    const baseList = search.trim().length >= 2 && !branchScoped
      ? mergeSearchResults(employees, searchResults)
      : employees;

    return baseList.filter((employee) => {
      if (activeTab === 'Available') return true;
      if (activeTab === 'Present') return employee.timeIn !== null && employee.timeOut === null;
      if (activeTab === 'Absent') return employee.status === 'absent';
      if (activeTab === 'Late') return employee.status === 'late';
      return true;
    });
  }, [employees, searchResults, search, branchScoped, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData(selectedBranch);
    } finally {
      setRefreshing(false);
    }
  };

  const runAction = async (employeeId: number, action: () => Promise<any>, successMessage?: string) => {
    setActingId(employeeId);
    try {
      await action();
      if (successMessage) {
        Alert.alert('Attendance updated', successMessage);
      }
      await loadBranchData(selectedBranch);
    } catch (error: any) {
      Alert.alert('Action failed', error?.response?.data?.message || 'Unable to complete attendance action.');
    } finally {
      setActingId(null);
    }
  };

  const handleTimeIn = async (employee: BranchEmployee) => {
    if (employee.branchCode && employee.branchCode !== selectedBranch && !branchScoped) {
      Alert.alert(
        'Different branch',
        `${employee.name} belongs to ${employee.branchName}. Transfer and clock in to ${selectedBranch}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Transfer',
            onPress: () =>
              runAction(
                employee.id,
                () => attendanceApi.manualClockInWithTransfer(employee.id, selectedBranch),
                `${employee.name} was transferred and clocked in.`
              ),
          },
        ]
      );
      return;
    }

    await runAction(
      employee.id,
      () => attendanceApi.manualClockIn(employee.id, selectedBranch),
      `${employee.name} was clocked in.`
    );
  };

  const handleTimeOut = async (employee: BranchEmployee) => {
    await runAction(employee.id, () => attendanceApi.manualClockOut(employee.id), `${employee.name} was clocked out.`);
  };

  const handleMarkAbsent = async (employee?: BranchEmployee) => {
    if (employee) {
      await runAction(
        employee.id,
        () => attendanceApi.markIndividualAbsent(employee.id),
        `${employee.name} was marked absent.`
      );
      return;
    }

    setActingId(-1);
    try {
      const result = await attendanceApi.markAbsent(selectedBranch);
      Alert.alert('Marked absent', `${result.markedCount} employees marked absent.`);
      await loadBranchData(selectedBranch);
    } catch (error: any) {
      Alert.alert('Action failed', error?.response?.data?.message || 'Unable to mark absent.');
    } finally {
      setActingId(null);
    }
  };

  const summary = useMemo(
    () => [
      { label: 'Present', value: stats.present },
      { label: 'Late', value: stats.late },
      { label: 'Absent', value: stats.absent },
    ],
    [stats]
  );

  return (
    <GradientBackdrop>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7ef0d4" />}
      >
        <Animated.View style={reveal.containerStyle}>
          <AppHeader
            title="Attendance"
            subtitle={selectedBranch ? `Branch ${selectedBranch} employee actions` : 'Attendance monitoring'}
          />

          <Animated.View style={reveal.itemStyle(0)}>
            <GlassCard>
              <Text style={styles.sectionTitle}>Project / branch</Text>
              <View style={styles.branchWrap}>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    style={[styles.branchChip, selectedBranch === branch.code && styles.branchChipActive]}
                    onPress={() => setSelectedBranch(branch.code)}
                  >
                    <Text style={[styles.branchChipText, selectedBranch === branch.code && styles.branchChipTextActive]}>
                      {branch.shortName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View style={reveal.itemStyle(1)}>
            <View style={styles.statsRow}>
              {summary.map((item) => (
                <GlassCard key={item.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={reveal.itemStyle(2)}>
            <GlassCard>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Search and actions</Text>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleMarkAbsent()}>
                  <Text style={styles.actionButtonText}>{actingId === -1 ? 'Working...' : 'Mark all absent'}</Text>
                </TouchableOpacity>
              </View>
              {!branchScoped ? (
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search employee by name or code"
                  placeholderTextColor="#7d8ca4"
                />
              ) : (
                <Text style={styles.caption}>Branch scanners are scoped to their assigned branch employee list.</Text>
              )}
            </GlassCard>
          </Animated.View>

          <Animated.View style={reveal.itemStyle(3)}>
            <GlassCard>
              <View style={styles.tabRow}>
                {FILTER_TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View style={reveal.itemStyle(4)}>
            <GlassCard>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Employees</Text>
                <Text style={styles.caption}>{auditRecords.length} audit rows today</Text>
              </View>
              {loading ? <ActivityIndicator color="#7ef0d4" /> : null}
              {!loading && displayedEmployees.length === 0 ? (
                <Text style={styles.emptyText}>No employees match this branch/filter combination.</Text>
              ) : null}
              {!loading &&
                displayedEmployees.map((employee, index) => {
                  const present = employee.timeIn !== null && employee.timeOut === null;
                  const completed = employee.timeIn !== null && employee.timeOut !== null;
                  const canClockIn = !present && employee.status !== 'absent';

                  return (
                    <Animated.View key={`${employee.id}-${index}`} style={[styles.employeeCard, reveal.itemStyle(Math.min(index + 5, 7))]}>
                      <View style={styles.employeeHeader}>
                        <View style={styles.employeeIdentity}>
                          <Text style={styles.employeeName}>{employee.name}</Text>
                          <Text style={styles.employeeMeta}>
                            {employee.employeeCode || '--'} • {employee.department} • {employee.branchName}
                          </Text>
                        </View>
                        <Text style={styles.employeeStatus}>
                          {present ? 'Present' : completed ? 'Completed' : employee.status === 'absent' ? 'Absent' : employee.status || 'Available'}
                        </Text>
                      </View>

                      <View style={styles.employeeStats}>
                        <Text style={styles.employeeSmall}>In: {employee.timeIn || '--'}</Text>
                        <Text style={styles.employeeSmall}>Out: {employee.timeOut || '--'}</Text>
                        <Text style={styles.employeeSmall}>Hours: {employee.totalHours || '0.00'}</Text>
                      </View>

                      <View style={styles.employeeActions}>
                        <TouchableOpacity
                          style={[styles.smallAction, canClockIn ? styles.clockInAction : styles.disabledAction]}
                          disabled={!canClockIn || actingId === employee.id}
                          onPress={() => handleTimeIn(employee)}
                        >
                          <Text style={styles.smallActionText}>{actingId === employee.id ? '...' : 'Time In'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.smallAction, present ? styles.clockOutAction : styles.disabledAction]}
                          disabled={!present || actingId === employee.id}
                          onPress={() => handleTimeOut(employee)}
                        >
                          <Text style={styles.smallActionText}>{actingId === employee.id ? '...' : 'Time Out'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.smallAction, !present && !completed ? styles.absentAction : styles.disabledAction]}
                          disabled={present || completed || actingId === employee.id}
                          onPress={() => handleMarkAbsent(employee)}
                        >
                          <Text style={styles.smallActionText}>{actingId === employee.id ? '...' : 'Absent'}</Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  );
                })}
            </GlassCard>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </GradientBackdrop>
  );
}

function mergeSearchResults(employees: BranchEmployee[], searchResults: SearchEmployee[]): BranchEmployee[] {
  const existing = new Map(employees.map((employee) => [employee.id, employee]));
  const merged = [...employees];

  searchResults.forEach((item) => {
    if (!existing.has(item.id)) {
      merged.push({
        id: item.id,
        name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
        avatar: `${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`.toUpperCase(),
        profileImage: item.profileImage,
        employeeCode: item.employeeCode,
        department: item.department || 'General',
        position: item.position || 'Worker',
        branchName: item.branchName || '',
        branchCode: item.branchCode,
        timeIn: null,
        timeOut: null,
        totalHours: '0.00',
        status: null,
        attendanceId: null,
      });
    }
  });

  return merged;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120, gap: 16 },
  sectionTitle: { color: '#f7fbff', fontSize: 18, fontWeight: '700' },
  branchWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  branchChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  branchChipActive: { backgroundColor: '#7ef0d4' },
  branchChipText: { color: '#dce6f8', fontSize: 12, fontWeight: '700' },
  branchChipTextActive: { color: '#07111f' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1 },
  statValue: { color: '#ffb86c', fontSize: 28, fontWeight: '800' },
  statLabel: { color: 'rgba(230,238,255,0.72)', fontSize: 12, marginTop: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  actionButton: { backgroundColor: '#7ef0d4', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  actionButtonText: { color: '#07111f', fontWeight: '800', fontSize: 12 },
  caption: { color: 'rgba(230,238,255,0.72)', marginTop: 10, fontSize: 13, lineHeight: 20 },
  searchInput: {
    marginTop: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f7fbff',
    paddingHorizontal: 14,
  },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterTab: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterTabActive: { backgroundColor: 'rgba(126,240,212,0.2)' },
  filterTabText: { color: '#c6d2e5', fontSize: 12, fontWeight: '700' },
  filterTabTextActive: { color: '#7ef0d4' },
  emptyText: { color: 'rgba(230,238,255,0.72)', marginTop: 16 },
  employeeCard: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  employeeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  employeeIdentity: { flex: 1 },
  employeeName: { color: '#f7fbff', fontSize: 15, fontWeight: '700' },
  employeeMeta: { color: 'rgba(230,238,255,0.72)', fontSize: 12, marginTop: 6 },
  employeeStatus: { color: '#7ef0d4', fontSize: 12, fontWeight: '700' },
  employeeStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  employeeSmall: { color: 'rgba(230,238,255,0.72)', fontSize: 12 },
  employeeActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  smallAction: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  clockInAction: { backgroundColor: '#7ef0d4' },
  clockOutAction: { backgroundColor: '#ffb86c' },
  absentAction: { backgroundColor: '#ff7b7b' },
  disabledAction: { backgroundColor: 'rgba(255,255,255,0.08)' },
  smallActionText: { color: '#07111f', fontWeight: '800', fontSize: 12 },
});
