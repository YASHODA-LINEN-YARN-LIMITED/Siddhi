import React, { useState, useEffect } from 'react';
import {
  Clock,
  CalendarCheck,
  CalendarDays,
  Banknote,
  FileText,
  Target,
  Award,
  Home,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  Coffee,
  Check,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, Employee, DailyAttendance, LeaveBalance, LeaveRequest, EmployeePayslip, WorkFromHomeRequest, TaxDeclaration, PerformanceGoal } from '../types.ts';

interface KekaMeViewProps {
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    email: string;
    role: Role;
    departmentId: string;
    branchId: string;
  };
  onWebPunchSuccess: () => void;
}

export const KekaMeView: React.FC<KekaMeViewProps> = ({ currentUser, onWebPunchSuccess }) => {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'leave' | 'pay' | 'tax' | 'documents' | 'performance'>('attendance');

  // Data states
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<DailyAttendance[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payslips, setPayslips] = useState<EmployeePayslip[]>([]);
  const [wfhRequests, setWfhRequests] = useState<WorkFromHomeRequest[]>([]);
  const [taxDecl, setTaxDecl] = useState<TaxDeclaration | null>(null);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Web Clock / Break state
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimerSeconds, setBreakTimerSeconds] = useState(0);

  // WFH Request Modal
  const [showWfhModal, setShowWfhModal] = useState(false);
  const [wfhForm, setWfhForm] = useState({
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    daysCount: 1,
    type: 'WFH' as 'WFH' | 'ON_DUTY',
    reason: '',
  });

  // Tax declaration edit state
  const [taxForm, setTaxForm] = useState({
    selectedRegime: 'NEW' as 'NEW' | 'OLD',
    section80C: 150000,
    section80D: 25000,
    hraAnnualRent: 180000,
    homeLoanInterest: 0,
    nps80CCD: 50000,
  });

  useEffect(() => {
    loadMeData();
  }, [currentUser]);

  useEffect(() => {
    let interval: any = null;
    if (isOnBreak) {
      interval = setInterval(() => {
        setBreakTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnBreak]);

  const loadMeData = async () => {
    try {
      setLoading(true);
      const [emp, att, bals, reqs, payPeriods, wfh, tax, perfGoals] = await Promise.all([
        api.getEmployee(currentUser.employeeId),
        api.getDailyAttendance({ employeeId: currentUser.employeeId }),
        api.getLeaveBalances(currentUser.employeeId),
        api.getLeaveRequests({ employeeId: currentUser.employeeId }),
        api.getPayrollPeriods(),
        api.getWfhRequests(),
        api.getTaxDeclaration(currentUser.employeeId),
        api.getPerformanceGoals(currentUser.employeeId),
      ]);

      setEmployee(emp);
      setAttendanceLogs(att);
      setLeaveBalances(bals);
      setLeaveRequests(reqs);
      setWfhRequests(wfh.filter((w) => w.employeeId === currentUser.employeeId));
      setTaxDecl(tax);
      setGoals(perfGoals);

      if (tax) {
        setTaxForm({
          selectedRegime: tax.selectedRegime,
          section80C: tax.section80C,
          section80D: tax.section80D,
          hraAnnualRent: tax.hraAnnualRent,
          homeLoanInterest: tax.homeLoanInterest,
          nps80CCD: tax.nps80CCD,
        });
      }

      if (payPeriods.length > 0) {
        const p1 = await api.getPayrollPeriodDetails(payPeriods[0].id);
        const myPayslips = p1.payslips.filter((p) => p.employeeId === currentUser.employeeId);
        setPayslips(myPayslips);
      }
    } catch (e) {
      console.error('Failed to load Me data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleWfhSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitWfhRequest(wfhForm);
      setShowWfhModal(false);
      setWfhForm({
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        daysCount: 1,
        type: 'WFH',
        reason: '',
      });
      notify('Request submitted successfully', 'success');
      loadMeData();
    } catch (err: any) {
      notify(`Submission error: ${err.message}`, 'error');
    }
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.saveTaxDeclaration(taxForm);
      setTaxDecl(res.declaration);
      notify('Income Tax declaration saved', 'success');
    } catch (err: any) {
      notify(`Tax save error: ${err.message}`, 'error');
    }
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const todayAttendance = attendanceLogs.find((a) => a.date === todayStr);

  return (
    <div className="space-y-6">
      {/* Top Banner: Employee Profile Identity & Quick Clock Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white font-extrabold text-2xl shadow-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
              <span className="font-mono text-2xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                {currentUser.employeeCode}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
              <span>{employee?.status || 'Active Full-Time'}</span>
              <span>·</span>
              <span>{currentUser.email}</span>
              <span>·</span>
              <span className="text-emerald-700 font-medium">Self-Service Workspace</span>
            </div>
          </div>
        </div>

        {/* Live Attendance Clock-In Widget (Keka Style) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center gap-4 text-xs">
          <div>
            <div className="text-2xs text-slate-500 font-semibold uppercase">Today's Shift: General (9:00 - 18:00)</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {todayAttendance?.firstIn ? `Punched In at ${todayAttendance.firstIn}` : 'Not Punched In Yet'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOnBreak(!isOnBreak);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isOnBreak
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Coffee className="h-3.5 w-3.5" />
              <span>{isOnBreak ? `On Break (${Math.floor(breakTimerSeconds / 60)}m)` : 'Take Break'}</span>
            </button>

            <button
              onClick={() => setShowWfhModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-2xs flex items-center gap-1"
            >
              <Home className="h-3.5 w-3.5" />
              <span>WFH / On Duty</span>
            </button>
          </div>
        </div>
      </div>

      {/* Me Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {[
          { key: 'attendance', label: 'Attendance & Timings' },
          { key: 'leave', label: 'Leave & Holidays' },
          { key: 'pay', label: 'Salary & Payslips' },
          { key: 'tax', label: 'IT Declarations & Regime' },
          { key: 'performance', label: 'My Goals & Performance' },
          { key: 'documents', label: 'Documents & Letters' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === tab.key
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: ATTENDANCE & PUNCHES */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-2xs text-slate-500 uppercase font-semibold">Days Present This Month</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">21</div>
              <div className="text-2xs text-emerald-700 font-medium">98% Punctuality rate</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-2xs text-slate-500 uppercase font-semibold">Late Arrivals</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">1</div>
              <div className="text-2xs text-slate-400">Within monthly 3-late threshold</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-2xs text-slate-500 uppercase font-semibold">Average Work Hours</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">8h 42m</div>
              <div className="text-2xs text-slate-400">Target: 8h 00m / day</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-2xs text-slate-500 uppercase font-semibold">Work From Home Days</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{wfhRequests.filter((w) => w.status === 'APPROVED').length}</div>
              <div className="text-2xs text-slate-400">Approved remote logs</div>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-900">Recent Attendance Logs</span>
              <span className="text-2xs text-slate-500">Includes Biometric Sync & Web Punch</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Shift</th>
                  <th className="py-2.5 px-4">First In</th>
                  <th className="py-2.5 px-4">Last Out</th>
                  <th className="py-2.5 px-4">Work Hours</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {attendanceLogs.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-700">{a.date}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans">General Day Shift</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{a.firstIn || '—'}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{a.lastOut || '—'}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-800">{a.workHours} hrs</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                        a.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LEAVE & TIME OFF */}
      {activeSubTab === 'leave' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {leaveBalances.map((b) => (
              <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
                <div className="text-2xs font-bold text-slate-500 uppercase">{b.leaveTypeName || b.leaveTypeCode}</div>
                <div className="text-2xl font-black text-slate-900 font-mono">{b.closingBalance} <span className="text-xs font-normal text-slate-400">days left</span></div>
                <div className="text-2xs text-slate-400">Used: {b.used} · Accrued: {b.accrued}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900">My Leave Applications</h3>
            <div className="divide-y divide-slate-100">
              {leaveRequests.map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{r.leaveTypeName || r.leaveTypeCode} ({r.daysCount} days)</div>
                    <div className="text-2xs text-slate-400 font-mono">{r.startDate} to {r.endDate} · {r.reason}</div>
                  </div>
                  <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                    r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SALARY & PAYSLIPS */}
      {activeSubTab === 'pay' && (
        <div className="space-y-6">
          {/* CTC Breakup Card (Keka Style) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cost to Company (CTC) Annual Structure</h3>
                <p className="text-2xs text-slate-500">Effective from April 1, 2026 · Standard Corporate Compensation Plan</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900 font-mono">₹18,00,000</div>
                <div className="text-2xs text-slate-400">Annual Gross CTC</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-2xs">Basic Salary (50%):</span>
                <strong className="font-mono text-slate-900">₹75,000 / mo</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-2xs">House Rent Allowance (HRA):</span>
                <strong className="font-mono text-slate-900">₹30,000 / mo</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-2xs">Special Allowance:</span>
                <strong className="font-mono text-slate-900">₹32,750 / mo</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-2xs">EPF Employer Share:</span>
                <strong className="font-mono text-slate-900">₹1,800 / mo</strong>
              </div>
            </div>
          </div>

          {/* Payslips List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 font-semibold text-xs text-slate-900">
              Download Official Monthly Payslips
            </div>
            <div className="divide-y divide-slate-100">
              {payslips.map((ps) => (
                <div key={ps.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/70">
                  <div>
                    <div className="font-bold text-slate-900">{ps.monthName}</div>
                    <div className="text-2xs text-slate-400 font-mono">
                      Payable: {ps.payableDays} days · Deductions: ₹{ps.totalDeductions.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-800 font-mono">
                      ₹{ps.netSalary.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: IT DECLARATIONS & REGIME SIMULATOR */}
      {activeSubTab === 'tax' && (
        <form onSubmit={handleSaveTax} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Income Tax Regime Selector & IT Declarations (FY 2026-27)</h3>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setTaxForm({ ...taxForm, selectedRegime: 'NEW' })}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                taxForm.selectedRegime === 'NEW'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">New Tax Regime</span>
                {taxDecl?.recommendedRegime === 'NEW' && (
                  <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                    Recommended (Saves More)
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-2">
                ₹{taxDecl?.estimatedNewRegimeTax.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/ year</span>
              </div>
            </div>

            <div
              onClick={() => setTaxForm({ ...taxForm, selectedRegime: 'OLD' })}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                taxForm.selectedRegime === 'OLD'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Old Tax Regime</span>
                {taxDecl?.recommendedRegime === 'OLD' && (
                  <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                    Recommended (Saves More)
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-2">
                ₹{taxDecl?.estimatedOldRegimeTax.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/ year</span>
              </div>
            </div>
          </div>

          {/* Investment Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Section 80C (PPF, ELSS, EPF)</label>
              <input
                type="number"
                max={150000}
                value={taxForm.section80C}
                onChange={(e) => setTaxForm({ ...taxForm, section80C: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
              />
              <span className="text-2xs text-slate-400">Max limit: ₹1,50,000</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Section 80D (Health Insurance)</label>
              <input
                type="number"
                max={50000}
                value={taxForm.section80D}
                onChange={(e) => setTaxForm({ ...taxForm, section80D: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
              />
              <span className="text-2xs text-slate-400">Max limit: ₹25,000 / ₹50,000</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Annual HRA Rent Paid (INR)</label>
              <input
                type="number"
                value={taxForm.hraAnnualRent}
                onChange={(e) => setTaxForm({ ...taxForm, hraAnnualRent: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
              />
              <span className="text-2xs text-slate-400">Subject to Landlord PAN verification</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Save Declaration & Recompute Tax
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 5: MY PERFORMANCE & GOALS */}
      {activeSubTab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">My OKRs & Objectives (FY 2026-27)</h3>
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{g.title}</span>
                    <span className="font-mono text-emerald-700">{g.progressPercent}% Completed</span>
                  </div>
                  <p className="text-2xs text-slate-600">{g.description}</p>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${g.progressPercent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: DOCUMENTS & LETTERS */}
      {activeSubTab === 'documents' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Official Company Documents & Letters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Employment Appointment Letter</div>
                <div className="text-2xs text-slate-400">Signed on {employee?.dateOfJoining}</div>
              </div>
              <button
                onClick={() => notify('Appointment letter certificate verified', 'info')}
                className="text-2xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200"
              >
                View
              </button>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Employee Digital ID Badge</div>
                <div className="text-2xs text-slate-400">Barcode: {employee?.employeeCode}</div>
              </div>
              <button
                onClick={() => notify(`Employee ID Card ${employee?.employeeCode} ready`, 'info')}
                className="text-2xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WFH Modal */}
      {showWfhModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleWfhSubmit} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Request Work From Home / On Duty</h3>
            <div>
              <label className="font-medium text-slate-700">Type</label>
              <select
                value={wfhForm.type}
                onChange={(e) => setWfhForm({ ...wfhForm, type: e.target.value as any })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              >
                <option value="WFH">Work From Home (Remote)</option>
                <option value="ON_DUTY">On Duty (Client Location / Off-Site)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  value={wfhForm.startDate}
                  onChange={(e) => setWfhForm({ ...wfhForm, startDate: e.target.value, endDate: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700">Days</label>
                <input
                  type="number"
                  min="1"
                  value={wfhForm.daysCount}
                  onChange={(e) => setWfhForm({ ...wfhForm, daysCount: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-medium text-slate-700">Reason</label>
              <textarea
                required
                rows={3}
                placeholder="State reason and deliverables..."
                value={wfhForm.reason}
                onChange={(e) => setWfhForm({ ...wfhForm, reason: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowWfhModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Submit Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
