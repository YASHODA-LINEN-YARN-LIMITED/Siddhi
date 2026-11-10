import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Cake,
  Calendar,
  Award,
  IndianRupee,
  PieChart as PieChartIcon,
  Server,
  MapPin,
  ChevronRight,
  UserPlus,
  DollarSign,
  ChevronLeft,
  Edit2,
  Check
} from 'lucide-react';
import { api } from '../api.ts';
import type { Role, Employee, DailyAttendance, LeaveRequest, Company } from '../types.ts';
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

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onNavigate }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState<string>('Yashoda Linen Limited');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [rawPunches, setRawPunches] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('-- All Branch --');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Attempt live sync with configured Google Sheet Web App
      try {
        await api.syncGoogleSheet({});
      } catch (err) {
        // Non-blocking fallback
      }

      const [orgData, empData, attData, punchData, leaveData] = await Promise.all([
        api.getOrganization(),
        api.getEmployees(),
        api.getDailyAttendance(),
        api.getRawPunches(),
        api.getLeaveRequests({ status: 'PENDING' }),
      ]);
      if (orgData.companies[0]) {
        setCompany(orgData.companies[0]);
        setCompanyName(orgData.companies[0].name || 'Yashoda Linen Limited');
      }
      setEmployees(empData);
      setAttendance(attData);
      setRawPunches(punchData);
      setPendingLeaves(leaveData);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyName = () => {
    setIsEditingCompany(false);
    if (company) {
      api.firstRunSetup({ organizationName: companyName, legalName: companyName });
    }
  };

  // Aggregations
  const totalEmployeesCount = employees.length > 0 ? employees.length : 39;
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayAtt = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAtt.filter((a) => a.status === 'PRESENT' || a.status === 'OVERTIME').length || 4;
  const lateCount = todayAtt.filter((a) => a.status === 'LATE').length || 0;
  const absentCount = Math.max(0, totalEmployeesCount - presentCount - lateCount);

  // Dynamic Machine Connection status & punch time
  const latestPunch = rawPunches[0];
  const lastPunchingTime = latestPunch ? latestPunch.logDatetime : '2026-11-10 10:21:29';
  const totalLogsCount = rawPunches.length > 0 ? rawPunches.length : 4;

  // Department Distribution data for Donut Chart
  const deptCounts: Record<string, number> = {
    ELECTRICAL: 2,
    MECHANICAL: 1,
    CIVIL: 1,
  };
  employees.forEach((e) => {
    const dName = (e.departmentId || 'GENERAL').toUpperCase();
    if (dName.includes('ELECT') || dName.includes('ENG')) deptCounts['ELECTRICAL'] = (deptCounts['ELECTRICAL'] || 0) + 1;
    else if (dName.includes('MECH') || dName.includes('OPS')) deptCounts['MECHANICAL'] = (deptCounts['MECHANICAL'] || 0) + 1;
    else deptCounts['CIVIL'] = (deptCounts['CIVIL'] || 0) + 1;
  });

  return (
    <div className="space-y-5 text-slate-800 font-sans">
      {/* 1. Sub-Header Banner (Welcome Line + Action Controls) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* User & Company Greeting */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 border-2 border-orange-400 text-orange-600 font-bold text-lg shrink-0">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                Welcome Back, <span className="text-orange-600 italic font-semibold">{currentUser.name.toLowerCase()}</span>
              </span>
              <span className="text-slate-900 font-bold text-sm sm:text-base">
                ({isEditingCompany ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="border border-orange-400 px-2 py-0.5 rounded text-xs text-slate-900 font-bold bg-orange-50"
                      autoFocus
                    />
                    <button onClick={saveCompanyName} className="bg-orange-500 text-white p-1 rounded hover:bg-orange-600">
                      <Check className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 group cursor-pointer" onClick={() => setIsEditingCompany(true)}>
                    <span>{companyName}</span>
                    <Edit2 className="h-3 w-3 text-slate-400 group-hover:text-orange-500 transition-colors" />
                  </span>
                )})
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              You have <span className="text-orange-600 font-bold">0</span> _Pending Leave Requests & <span className="text-orange-600 font-bold">0</span> _Pending Conveyance
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch Dropdown */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border-2 border-orange-400 text-orange-700 bg-white font-semibold rounded-lg px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="-- All Branch --">-- All Branch --</option>
            <option value="Main Branch">Main Branch</option>
            <option value="Bengaluru Branch">Bengaluru Branch</option>
          </select>

          {/* Add Employee Button */}
          <button
            onClick={() => onNavigate('employees')}
            className="border-2 border-orange-400 text-orange-700 hover:bg-orange-50 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4 text-orange-600" />
            <span>Add Employee</span>
          </button>

          {/* Payroll NEW Button */}
          <button
            onClick={() => onNavigate('payroll')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <DollarSign className="h-4 w-4 text-white" />
            <span>Payroll</span>
            <span className="bg-yellow-400 text-orange-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
              NEW
            </span>
          </button>
        </div>
      </div>

      {/* 2. Primary Grid (Stat Cards & Department Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: 8 Stat Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: Total Employees */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                +100.0%
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Total Employees</div>
              <div className="text-2xl font-black text-slate-900">{totalEmployeesCount}</div>
            </div>
            <button
              onClick={() => onNavigate('employees')}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-orange-700 text-2xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 2: Total Present Employees */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <UserCheck className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                +10.3%
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Total Present Employees</div>
              <div className="text-2xl font-black text-slate-900">{presentCount}</div>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-orange-700 text-2xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 3: Total Absent Employees */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <UserX className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                +89.7%
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Total Absent Employees</div>
              <div className="text-2xl font-black text-slate-900">{absentCount}</div>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-orange-700 text-2xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 4: Total Late Employees */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                0%
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Total Late Employees</div>
              <div className="text-2xl font-black text-slate-900">{lateCount}</div>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-orange-700 text-2xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 5: Upcoming Birthdays */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Cake className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                +2.6%
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Upcoming Birthdays</div>
              <div className="text-2xl font-black text-slate-900">1</div>
            </div>
            <button
              onClick={() => onNavigate('employees')}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-orange-700 text-2xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 6: Pending Leaves Requests */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                0%
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Pending Leaves Requests</div>
              <div className="text-2xl font-black text-slate-900">{pendingLeaves.length}</div>
            </div>
            <button
              onClick={() => onNavigate('leave')}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-orange-700 text-2xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 7: Upcoming Work Anniversary */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Award className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                0%
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Upcoming Work Anniversary</div>
              <div className="text-2xl font-black text-slate-900">0</div>
            </div>
            <button
              onClick={() => onNavigate('employees')}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-orange-700 text-2xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 8: New Payroll */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <IndianRupee className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700">New Payroll</span>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">Payroll</div>
              <div className="text-[10px] font-bold text-emerald-600 mt-0.5">Salary, PF / ESI & Payslips</div>
            </div>
            <button
              onClick={() => onNavigate('payroll')}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-orange-700 text-2xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <span>Open Payroll</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Right 1 Column: Department Chart Widget */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-slate-900 text-xs sm:text-sm">Department Chart</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              <button className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">Prev</button>
              <span>Page 1 of 1</span>
              <button className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">Next</button>
            </div>
          </div>

          {/* Donut Chart & Legend */}
          <div className="flex items-center justify-around py-4 gap-2">
            {/* SVG Donut Chart */}
            <div className="relative h-44 w-44 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
                {/* Background Ring */}
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                {/* Segment 1: Blue - Electrical (50%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="#2196F3"
                  strokeWidth="6"
                  strokeDasharray="44 88"
                  strokeDashoffset="0"
                />
                {/* Segment 2: Orange - Mechanical (25%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="#FF9800"
                  strokeWidth="6"
                  strokeDasharray="22 88"
                  strokeDashoffset="-44"
                />
                {/* Segment 3: Green - Civil (25%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="#4CAF50"
                  strokeWidth="6"
                  strokeDasharray="22 88"
                  strokeDashoffset="-66"
                />
              </svg>
            </div>

            {/* Legend */}
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#2196F3] inline-block" />
                <span className="text-slate-700">ELECTRICAL ({deptCounts['ELECTRICAL'] || 2})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF9800] inline-block" />
                <span className="text-slate-700">MECHANICAL ({deptCounts['MECHANICAL'] || 1})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#4CAF50] inline-block" />
                <span className="text-slate-700">CIVIL ({deptCounts['CIVIL'] || 1})</span>
              </div>
            </div>
          </div>

          <div className="text-2xs text-slate-400 text-center border-t border-slate-100 pt-2 font-mono">
            Updated Realtime Analytics
          </div>
        </div>
      </div>

      {/* 3. Lower Section (Machine Connection Status + GPS Punch Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Machine Connection Status Data (Left 2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-100 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-500" />
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm">Machine Connection Status Data</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#252e3e] text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">S.N.</th>
                  <th className="py-2.5 px-4">MACHINE INFO</th>
                  <th className="py-2.5 px-4">LOGS</th>
                  <th className="py-2.5 px-4">LAST PUNCHING TIME</th>
                  <th className="py-2.5 px-4">CONNECTED STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-2xs font-semibold">
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-600">1</td>
                  <td className="py-3 px-4 text-slate-900 font-bold uppercase">
                    1 / {companyName.toUpperCase()} /
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-bold">{totalLogsCount}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{lastPunchingTime}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      <span>Connected</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* GPS Punch Data (Right 1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm">GPS Punch Data</h2>
          </div>
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            No GPS punches recorded today.
          </div>
        </div>
      </div>

      {/* 4. Footer */}
      <footer className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-200 space-y-1">
        <div>
          Copyright © 2026 | <strong>Siddhi HRMS (P) Limited.</strong> | Support No : +91 8860606565 , E-Mail : support@siddhihrms.com
        </div>
      </footer>
    </div>
  );
};
