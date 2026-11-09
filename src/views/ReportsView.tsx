import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Filter,
  Calendar,
  Building2,
  Users,
  Banknote,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api.ts';
import type { Role, Employee, Department, Branch, DailyAttendance, PayrollPeriod, EmployeePayslip, LeaveBalance } from '../types.ts';

interface ReportsViewProps {
  userRole: Role;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ userRole }) => {
  const [reportType, setReportType] = useState<
    'EMPLOYEE_MASTER' | 'ATTENDANCE_SUMMARY' | 'PAYROLL_REGISTER' | 'LEAVE_UTILIZATION' | 'STATUTORY_SUMMARY' | 'BANK_NEFT'
  >('PAYROLL_REGISTER');

  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-11-08');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payslips, setPayslips] = useState<EmployeePayslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, orgData, attData, periodsData] = await Promise.all([
        api.getEmployees(),
        api.getOrganization(),
        api.getDailyAttendance(),
        api.getPayrollPeriods(),
      ]);
      setEmployees(empData);
      setDepartments(orgData.departments);
      setBranches(orgData.branches);
      setAttendance(attData);
      setPayrollPeriods(periodsData);

      if (periodsData.length > 0) {
        const details = await api.getPayrollPeriodDetails(periodsData[0].id);
        setPayslips(details.payslips);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let reportTitle: string = reportType;

    if (reportType === 'PAYROLL_REGISTER') {
      reportTitle = 'Monthly_Payroll_Register';
      headers = ['EmployeeCode', 'Name', 'Department', 'PayableDays', 'Basic', 'HRA', 'GrossEarnings', 'EPF', 'ESI', 'PT', 'TDS', 'TotalDeductions', 'NetSalary'];
      rows = payslips.map((ps) => {
        const emp = employees.find((e) => e.id === ps.employeeId);
        const dept = departments.find((d) => d.id === emp?.departmentId)?.name || '';
        return [
          ps.employeeCode || '',
          `"${ps.employeeName || ''}"`,
          `"${dept}"`,
          String(ps.payableDays),
          String(ps.basic),
          String(ps.hra),
          String(ps.grossEarnings),
          String(ps.epfDeduction),
          String(ps.esiDeduction),
          String(ps.professionalTax),
          String(ps.tdsTax),
          String(ps.totalDeductions),
          String(ps.netSalary),
        ];
      });
    } else if (reportType === 'ATTENDANCE_SUMMARY') {
      reportTitle = 'Attendance_Register';
      headers = ['Date', 'EmployeeCode', 'Name', 'FirstIn', 'LastOut', 'WorkHours', 'Status', 'LateMinutes', 'OvertimeMinutes'];
      rows = attendance.map((a) => [
        a.date,
        a.employeeCode || '',
        `"${a.employeeName || ''}"`,
        a.firstIn || '',
        a.lastOut || '',
        String(a.workHours),
        a.status,
        String(a.lateMinutes),
        String(a.overtimeMinutes),
      ]);
    } else {
      reportTitle = 'Employee_Master_Report';
      headers = ['EmployeeCode', 'FirstName', 'LastName', 'Email', 'Phone', 'JoiningDate', 'Status'];
      rows = employees.map((e) => [
        e.employeeCode,
        `"${e.firstName}"`,
        `"${e.lastName}"`,
        e.email,
        e.phone,
        e.dateOfJoining,
        e.status,
      ]);
    }

    const meta = [
      `# Report: ${reportTitle}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Date Range: ${startDate} to ${endDate}`,
      `# Timezone: Asia/Kolkata (IST)`,
      `# Filter Branch: ${selectedBranch || 'ALL'}, Department: ${selectedDept || 'ALL'}`,
      '',
    ].join('\n');

    const csvContent = meta + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Siddhi_${reportTitle}_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Reports & Analytics
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export CSV Register</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-slate-50 font-medium"
            >
              <option value="PAYROLL_REGISTER">Payroll Register & Earnings Breakdown</option>
              <option value="STATUTORY_SUMMARY">Statutory Deductions (EPF / ESI / PT / TDS)</option>
              <option value="ATTENDANCE_SUMMARY">Daily Attendance & Biometric Exceptions</option>
              <option value="EMPLOYEE_MASTER">Employee Master Headcount Directory</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Branch / Location</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-slate-50"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Explicit Report Metadata Statement */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-2xs text-slate-500 font-mono">
          <div>Report Filter: <strong>{reportType}</strong> · Range: {startDate} to {endDate}</div>
          <div>Timezone: <strong>Asia/Kolkata (IST)</strong> · Currency: <strong>INR (₹)</strong></div>
        </div>
      </div>

      {/* Generated Report Table with Grand Totals */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-900">
            {reportType.replace(/_/g, ' ')}
          </div>
          <span className="text-2xs text-slate-500">Live Calculated Ledger</span>
        </div>

        {reportType === 'PAYROLL_REGISTER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Payable Days</th>
                  <th className="py-2.5 px-3">Basic + DA</th>
                  <th className="py-2.5 px-3">HRA</th>
                  <th className="py-2.5 px-3">Gross Earnings</th>
                  <th className="py-2.5 px-3">EPF (12%)</th>
                  <th className="py-2.5 px-3">ESI</th>
                  <th className="py-2.5 px-3">PT + TDS</th>
                  <th className="py-2.5 px-3">Total Deductions</th>
                  <th className="py-2.5 px-3 font-bold text-slate-900">Net Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-slate-900">{ps.employeeName || ps.employeeId}</div>
                      <div className="text-2xs text-slate-400 font-mono">{ps.employeeCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{ps.payableDays} / {ps.totalDays}</td>
                    <td className="py-2.5 px-3 text-slate-700">₹{(ps.basic + ps.da).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-slate-700">₹{ps.hra.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">₹{ps.grossEarnings.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-slate-600">₹{ps.epfDeduction.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-slate-600">₹{ps.esiDeduction.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-slate-600">₹{(ps.professionalTax + ps.tdsTax).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-rose-700 font-medium">₹{ps.totalDeductions.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800 font-sans text-xs">
                      ₹{ps.netSalary.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Grand Totals Row */}
              <tfoot className="bg-slate-100 font-bold text-slate-900 font-mono text-2xs border-t-2 border-slate-300">
                <tr>
                  <td className="py-3 px-3 uppercase font-sans">Grand Totals</td>
                  <td className="py-3 px-3">—</td>
                  <td className="py-3 px-3">—</td>
                  <td className="py-3 px-3">—</td>
                  <td className="py-3 px-3">
                    ₹{payslips.reduce((s, p) => s + p.grossEarnings, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    ₹{payslips.reduce((s, p) => s + p.epfDeduction, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    ₹{payslips.reduce((s, p) => s + p.esiDeduction, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    ₹{payslips.reduce((s, p) => s + p.professionalTax + p.tdsTax, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-rose-700">
                    ₹{payslips.reduce((s, p) => s + p.totalDeductions, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-emerald-800 text-xs font-sans">
                    ₹{payslips.reduce((s, p) => s + p.netSalary, 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {reportType === 'ATTENDANCE_SUMMARY' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">First In</th>
                  <th className="py-2.5 px-4">Last Out</th>
                  <th className="py-2.5 px-4">Work Hours</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Late Minutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-600">{a.date}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{a.employeeName || a.employeeId}</td>
                    <td className="py-2.5 px-4 text-slate-700">{a.firstIn || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-700">{a.lastOut || '—'}</td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{a.workHours} hrs</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-amber-700 font-medium">
                      {a.lateMinutes > 0 ? `+${a.lateMinutes}m` : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'EMPLOYEE_MASTER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Joining Date</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{e.employeeCode}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{e.firstName} {e.lastName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{e.email}</td>
                    <td className="py-2.5 px-4 font-mono text-2xs text-slate-600">{e.dateOfJoining}</td>
                    <td className="py-2.5 px-4 text-slate-600">{e.role}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
