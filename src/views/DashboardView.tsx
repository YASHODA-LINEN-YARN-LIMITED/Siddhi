import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Clock,
  Banknote,
  Fingerprint,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CalendarDays,
  FileText,
  Briefcase,
  HelpCircle,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api.ts';
import type { Role, Employee, DailyAttendance, LeaveBalance, LeaveRequest, PayrollPeriod, BiometricIntegrationSettings } from '../types.ts';
import type { NavTab } from '../components/Sidebar.tsx';

interface DashboardViewProps {
  userRole: Role;
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ userRole, currentUser, onNavigate }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [bioSettings, setBioSettings] = useState<BiometricIntegrationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [empData, attData, balData, reqData, payData, bioData] = await Promise.all([
        api.getEmployees(),
        api.getDailyAttendance(),
        api.getLeaveBalances(currentUser.employeeId),
        api.getLeaveRequests({ status: 'PENDING' }),
        api.getPayrollPeriods(),
        api.getBiometricSettings(),
      ]);
      setEmployees(empData);
      setAttendance(attData);
      setLeaveBalances(balData);
      setPendingLeaves(reqData);
      setPayrollPeriods(payData);
      setBioSettings(bioData);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'OVERTIME').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'LATE').length;
  const onLeaveCount = todayAttendance.filter((a) => a.status === 'ON_LEAVE').length;

  const activeEmployees = employees.filter((e) => e.status !== 'TERMINATED' && e.status !== 'RESIGNED');
  const attendanceRate = activeEmployees.length > 0 ? Math.round(((presentCount + lateCount) / activeEmployees.length) * 100) : 0;

  const latestPayroll = payrollPeriods[0];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome context */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Namaste, {currentUser.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {userRole !== 'EMPLOYEE' && (
            <button
              onClick={() => onNavigate('biometric')}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Fingerprint className="h-4 w-4 text-emerald-400" />
              <span>Biometric Sync ({bioSettings?.recordsSyncedLastRun ?? 0} latest)</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('leave')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CalendarDays className="h-4 w-4 text-slate-900" />
            <span>Apply / Manage Leave</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Total Active Headcount</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeEmployees.length}</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>2 Branches</span>
            <span aria-hidden="true">·</span>
            <span>5 Departments</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Today's Attendance Rate</span>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{attendanceRate}%</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="text-emerald-700 font-medium">{presentCount + lateCount} Present</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-600 font-medium">{lateCount} Late</span>
            <span aria-hidden="true">·</span>
            <span>{onLeaveCount} Leave</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Pending Approvals</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingLeaves.length}</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>Leave Requests awaiting action</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Latest Payroll Run</span>
            <Banknote className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {latestPayroll ? latestPayroll.monthName : 'November 2026'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">₹{latestPayroll?.totalNetPay?.toLocaleString('en-IN') || '7,02,600'} Net</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">{latestPayroll?.status || 'Finalized'}</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Role-specific Workflows & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Operations & Quick Launcher */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Launcher Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick Operations & Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigate('employees')}
                className="flex flex-col items-start p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <Users className="h-5 w-5 text-slate-700 mb-2" />
                <span className="text-xs font-semibold text-slate-900">Employee Directory</span>
              </button>

              <button
                onClick={() => onNavigate('attendance')}
                className="flex flex-col items-start p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <Clock className="h-5 w-5 text-slate-700 mb-2" />
                <span className="text-xs font-semibold text-slate-900">Daily Attendance</span>
              </button>

              <button
                onClick={() => onNavigate('biometric')}
                className="flex flex-col items-start p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <Fingerprint className="h-5 w-5 text-emerald-700 mb-2" />
                <span className="text-xs font-semibold text-slate-900">Biometric Connector</span>
              </button>

              <button
                onClick={() => onNavigate('payroll')}
                className="flex flex-col items-start p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <Banknote className="h-5 w-5 text-slate-700 mb-2" />
                <span className="text-xs font-semibold text-slate-900">Payroll & Payslips</span>
              </button>

              <button
                onClick={() => onNavigate('recruitment')}
                className="flex flex-col items-start p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <Briefcase className="h-5 w-5 text-slate-700 mb-2" />
                <span className="text-xs font-semibold text-slate-900">Recruitment ATS</span>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="flex flex-col items-start p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <FileText className="h-5 w-5 text-slate-700 mb-2" />
                <span className="text-xs font-semibold text-slate-900">Reports Hub</span>
              </button>
            </div>
          </div>

          {/* Pending Leave Requests table for Managers/HR/Admin */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Pending Leave Approvals</h2>
              </div>
              <button
                onClick={() => onNavigate('leave')}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No leave requests pending approval at this time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                    <tr>
                      <th className="py-2 px-3">Employee</th>
                      <th className="py-2 px-3">Leave Type</th>
                      <th className="py-2 px-3">Dates</th>
                      <th className="py-2 px-3">Days</th>
                      <th className="py-2 px-3">Reason</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingLeaves.slice(0, 3).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{r.employeeName || r.employeeId}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.leaveTypeName || 'Leave'}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-2xs">
                          {r.startDate} {r.startDate !== r.endDate ? `to ${r.endDate}` : ''}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{r.daysCount}</td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-[150px]">{r.reason}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onNavigate('leave')}
                            className="px-2 py-1 text-2xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Leave Balances & Statutory Compliance Notice */}
        <div className="space-y-6">
          {/* ESS Leave Balance Quotas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">My Leave Quota ({new Date().getFullYear()})</h2>
            <div className="space-y-3">
              {leaveBalances.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{b.leaveTypeName || b.leaveTypeCode}</div>
                    <div className="text-2xs text-slate-400">Used: {b.used} · Pending: {b.pendingApproval}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900">{b.closingBalance}</div>
                    <div className="text-2xs text-slate-400">Available Days</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('leave')}
              className="mt-4 w-full py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
            >
              Request Time Off
            </button>
          </div>

          {/* Statutory & Biometric System Integrity Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
              <span>System & Data Status</span>
            </div>
            <div className="flex items-center justify-between text-2xs pt-1">
              <span className="font-mono text-slate-500">Storage: Local PostgreSQL</span>
              <span className="text-emerald-700 font-medium">Biometric Sync: Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
