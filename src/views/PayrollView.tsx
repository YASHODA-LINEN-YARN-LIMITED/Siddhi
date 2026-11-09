import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Calculator,
  Lock,
  Unlock,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, PayrollPeriod, EmployeePayslip, StatutoryRuleConfig, Employee, Company } from '../types.ts';

interface PayrollViewProps {
  userRole: Role;
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const PayrollView: React.FC<PayrollViewProps> = ({ userRole, currentUser }) => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [payslips, setPayslips] = useState<EmployeePayslip[]>([]);
  const [statConfig, setStatConfig] = useState<StatutoryRuleConfig | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Payslip detail modal
  const [viewingPayslip, setViewingPayslip] = useState<EmployeePayslip | null>(null);
  const [payslipEmployee, setPayslipEmployee] = useState<Employee | null>(null);

  // Calculation parameters
  const now = new Date();
  const [calcYear, setCalcYear] = useState(now.getFullYear());
  const [calcMonth, setCalcMonth] = useState(now.getMonth() + 1);

  // Unlock reversal modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  useEffect(() => {
    loadPayrollData();
  }, []);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      const [periodsData, orgData] = await Promise.all([
        api.getPayrollPeriods(),
        api.getOrganization(),
      ]);
      setPeriods(periodsData);
      setStatConfig(orgData.statutoryRuleConfig);
      setCompany(orgData.companies[0]);

      if (periodsData.length > 0) {
        selectPeriod(periodsData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectPeriod = async (periodId: string) => {
    try {
      const details = await api.getPayrollPeriodDetails(periodId);
      setSelectedPeriod(details.period);
      setPayslips(details.payslips);
    } catch (e: any) {
      notify(`Failed to load period: ${e.message}`, 'error');
    }
  };

  const handleCalculatePreview = async () => {
    try {
      setCalculating(true);
      const res = await api.calculatePayrollPreview(calcYear, calcMonth);
      setSelectedPeriod(res.period);
      setPayslips(res.payslips);
      const updatedPeriods = await api.getPayrollPeriods();
      setPeriods(updatedPeriods);
      notify(`Payroll calculation preview generated for ${res.period.monthName}`, 'success');
    } catch (err: any) {
      notify(`Calculation error: ${err.message}`, 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleFinalizePayroll = async () => {
    if (!selectedPeriod) return;
    try {
      const res = await api.finalizePayroll(selectedPeriod.id);
      notify(res.message, 'success');
      loadPayrollData();
    } catch (err: any) {
      notify(`Finalization error: ${err.message}`, 'error');
    }
  };

  const handleUnlockReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriod || !unlockReason.trim()) return;
    try {
      const res = await api.unlockPayrollReversal(selectedPeriod.id, unlockReason);
      setShowUnlockModal(false);
      setUnlockReason('');
      notify(res.message, 'info');
      loadPayrollData();
    } catch (err: any) {
      notify(`Reversal error: ${err.message}`, 'error');
    }
  };

  const handleOpenPayslip = async (ps: EmployeePayslip) => {
    try {
      const res = await api.getPayslip(ps.id);
      setViewingPayslip(res.payslip);
      setPayslipEmployee(res.employee);
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Payroll & Statutory Processing
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedPeriod && (
            <a
              href={`/api/payroll/export-bank-csv/${selectedPeriod.id}`}
              download
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export NEFT Bank CSV</span>
            </a>
          )}

          {selectedPeriod?.status !== 'LOCKED_FINALIZED' && userRole !== 'EMPLOYEE' && (
            <button
              onClick={handleFinalizePayroll}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Finalize & Lock Pay Run</span>
            </button>
          )}

          {selectedPeriod?.status === 'LOCKED_FINALIZED' && userRole === 'ADMIN' && (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Unlock className="h-4 w-4 text-amber-700" />
              <span>Unlock / Reversal Workflow</span>
            </button>
          )}
        </div>
      </div>

      {/* Statutory Parameters Notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span>Active Statutory Configuration (Republic of India)</span>
          </div>
          <span className="text-2xs font-mono text-emerald-700 font-medium">Verified for FY 2026-27</span>
        </div>
        <p className="text-2xs text-slate-500 leading-relaxed">
          {statConfig?.legalDisclaimer ||
            'Notice: Statutory wage ceilings and contribution percentages are configurable rules. Compliance officers must verify current state and central parameters prior to running binding production payroll.'}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-2xs pt-1 border-t border-slate-200 font-mono">
          <span>EPF: 12% (Ceiling: ₹{statConfig?.pfWageCeiling || 15000})</span>
          <span>ESI: 0.75% Emp / 3.25% Er (Ceiling: ₹{statConfig?.esiWageCeiling || 21000})</span>
          <span>PT: State Slabs (₹200/mo)</span>
        </div>
      </div>

      {/* Pay Runs Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">Select Pay Run:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedPeriod?.id === p.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{p.monthName}</span>
                {p.status === 'LOCKED_FINALIZED' ? (
                  <Lock className="h-3 w-3 text-emerald-400" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Trigger */}
        {userRole !== 'EMPLOYEE' && (
          <div className="flex items-center gap-2">
            <select
              value={calcMonth}
              onChange={(e) => setCalcMonth(Number(e.target.value))}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-slate-50"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={calcYear}
              onChange={(e) => setCalcYear(Number(e.target.value))}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-slate-50 font-mono"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
            <button
              onClick={handleCalculatePreview}
              disabled={calculating}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs font-semibold disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" />
              <span>{calculating ? 'Computing...' : 'Calculate Preview'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Period Summary Cards */}
      {selectedPeriod && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="text-2xs text-slate-500 uppercase font-medium">Total Gross Earnings</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              ₹{selectedPeriod.totalGrossPay.toLocaleString('en-IN')}
            </div>
            <div className="text-2xs text-slate-400">{selectedPeriod.totalEmployees} Employees Processed</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="text-2xs text-slate-500 uppercase font-medium">Statutory & Other Deductions</div>
            <div className="text-xl font-bold text-rose-700 mt-1">
              ₹{selectedPeriod.totalDeductions.toLocaleString('en-IN')}
            </div>
            <div className="text-2xs text-slate-400">EPF, ESI, PT, TDS, Loans</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="text-2xs text-slate-500 uppercase font-medium">Net Disbursed Payout</div>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              ₹{selectedPeriod.totalNetPay.toLocaleString('en-IN')}
            </div>
            <div className="text-2xs text-slate-400">Direct Bank Transfer (NEFT)</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="text-2xs text-slate-500 uppercase font-medium">Period Lock Status</div>
            <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              {selectedPeriod.status === 'LOCKED_FINALIZED' ? (
                <>
                  <Lock className="h-4 w-4 text-emerald-600" />
                  <span>Locked & Finalized</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 text-amber-600" />
                  <span>Calculation Preview</span>
                </>
              )}
            </div>
            <div className="text-2xs text-slate-400">
              {selectedPeriod.finalizedAt ? `Locked on ${selectedPeriod.finalizedAt.substring(0, 10)}` : 'Awaiting lock'}
            </div>
          </div>
        </div>
      )}

      {/* Itemized Employee Payslips Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="font-semibold text-xs text-slate-900">
            Employee Calculation Breakdown · {selectedPeriod?.monthName}
          </div>
          <span className="text-2xs text-slate-500">Values calculated based on attendance days & salary structure</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Payable Days</th>
                <th className="py-2.5 px-3">Basic + DA</th>
                <th className="py-2.5 px-3">HRA</th>
                <th className="py-2.5 px-3">Special Allw</th>
                <th className="py-2.5 px-3">Gross Earnings</th>
                <th className="py-2.5 px-3">EPF</th>
                <th className="py-2.5 px-3">PT + TDS</th>
                <th className="py-2.5 px-3">Total Deductions</th>
                <th className="py-2.5 px-3">Net Salary</th>
                <th className="py-2.5 px-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {payslips.map((ps) => (
                <tr key={ps.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-slate-900">{ps.employeeName || ps.employeeId}</div>
                    <div className="text-2xs text-slate-400 font-mono">{ps.employeeCode}</div>
                  </td>

                  <td className="py-2.5 px-3 text-slate-700">
                    {ps.payableDays} / {ps.totalDays}
                    {ps.unpaidDays > 0 && <span className="text-rose-600 block text-2xs">({ps.unpaidDays}d unpaid)</span>}
                  </td>

                  <td className="py-2.5 px-3 text-slate-700">₹{(ps.basic + ps.da).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-slate-700">₹{ps.hra.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-slate-700">₹{ps.specialAllowance.toLocaleString('en-IN')}</td>

                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    ₹{ps.grossEarnings.toLocaleString('en-IN')}
                  </td>

                  <td className="py-2.5 px-3 text-slate-600">₹{ps.epfDeduction.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-slate-600">₹{(ps.professionalTax + ps.tdsTax).toLocaleString('en-IN')}</td>

                  <td className="py-2.5 px-3 text-rose-700 font-medium">
                    ₹{ps.totalDeductions.toLocaleString('en-IN')}
                  </td>

                  <td className="py-2.5 px-3 font-bold text-emerald-800 font-sans text-xs">
                    ₹{ps.netSalary.toLocaleString('en-IN')}
                  </td>

                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => handleOpenPayslip(ps)}
                      className="px-2.5 py-1 text-2xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Payslip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Payslip Modal */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Official Employee Payslip</span>
                <span className="text-2xs text-slate-500 font-mono">({viewingPayslip.monthName})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button onClick={() => setViewingPayslip(null)} className="text-slate-400 hover:text-slate-700">
                  ✕
                </button>
              </div>
            </div>

            {/* Payslip Document Body */}
            <div className="border border-slate-300 rounded-lg p-5 space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{company?.legalName || 'Siddhi Technologies Pvt Ltd'}</h3>
                  <p className="text-2xs text-slate-500 max-w-sm mt-0.5">{company?.address}</p>
                  <div className="text-2xs text-slate-500 font-mono mt-1">Tax ID / GSTIN: {company?.taxId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Payslip for the month of</div>
                  <div className="text-sm font-extrabold text-slate-800 font-mono">{viewingPayslip.monthName}</div>
                </div>
              </div>

              {/* Employee Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded border border-slate-200 text-2xs">
                <div>
                  <span className="text-slate-500 block">Employee Code:</span>
                  <span className="font-bold font-mono text-slate-900">{viewingPayslip.employeeCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Name:</span>
                  <span className="font-bold text-slate-900">{viewingPayslip.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payable Days:</span>
                  <span className="font-bold text-slate-900">{viewingPayslip.payableDays} / {viewingPayslip.totalDays}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bank Account:</span>
                  <span className="font-mono text-slate-900">{payslipEmployee?.bankAccountNumber || '50100234567891'}</span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings Table */}
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-800 text-2xs uppercase">Earnings</div>
                  <div className="p-2.5 space-y-1.5 text-2xs font-mono">
                    <div className="flex justify-between"><span>Basic Salary:</span><span>₹{viewingPayslip.basic.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>House Rent Allowance (HRA):</span><span>₹{viewingPayslip.hra.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Dearness Allowance (DA):</span><span>₹{viewingPayslip.da.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Conveyance Allowance:</span><span>₹{viewingPayslip.conveyance.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Medical Reimbursement:</span><span>₹{viewingPayslip.medical.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Special Allowance:</span><span>₹{viewingPayslip.specialAllowance.toLocaleString('en-IN')}</span></div>
                    {viewingPayslip.overtimePay > 0 && (
                      <div className="flex justify-between text-emerald-700"><span>Overtime Pay:</span><span>₹{viewingPayslip.overtimePay.toLocaleString('en-IN')}</span></div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                      <span>Gross Earnings:</span>
                      <span>₹{viewingPayslip.grossEarnings.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-800 text-2xs uppercase">Deductions</div>
                  <div className="p-2.5 space-y-1.5 text-2xs font-mono">
                    <div className="flex justify-between"><span>Provident Fund (EPF):</span><span>₹{viewingPayslip.epfDeduction.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>ESI Contribution:</span><span>₹{viewingPayslip.esiDeduction.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Professional Tax:</span><span>₹{viewingPayslip.professionalTax.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>TDS / Income Tax:</span><span>₹{viewingPayslip.tdsTax.toLocaleString('en-IN')}</span></div>
                    {viewingPayslip.loanDeduction > 0 && (
                      <div className="flex justify-between text-rose-700"><span>Loan Recovery EMI:</span><span>₹{viewingPayslip.loanDeduction.toLocaleString('en-IN')}</span></div>
                    )}
                    <div className="flex justify-between"><span>Labor Welfare Fund (LWF):</span><span>₹{viewingPayslip.otherDeductions.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-rose-800">
                      <span>Total Deductions:</span>
                      <span>₹{viewingPayslip.totalDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Highlight */}
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-emerald-950">Net Take-Home Salary:</div>
                  <div className="text-2xs text-emerald-800">Direct Deposit to {payslipEmployee?.bankName || 'HDFC Bank'}</div>
                </div>
                <div className="text-lg font-black text-emerald-900 font-mono">
                  ₹{viewingPayslip.netSalary.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="text-2xs text-slate-400 text-center pt-2">
                This is a computer-generated document processed on local server. No physical signature required.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reversal / Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleUnlockReversal} className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Unlock Finalized Payroll Period</h2>
              <button type="button" onClick={() => setShowUnlockModal(false)} className="text-slate-400">✕</button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Reason for Reversal / Correction:</label>
              <textarea
                required
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="e.g., Audit discovered 2 retroactive leave adjustments for engineering department."
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowUnlockModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs">
                Confirm & Unlock Period
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
