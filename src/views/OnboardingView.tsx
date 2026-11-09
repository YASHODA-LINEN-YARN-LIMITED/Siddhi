import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  LogOut,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, Employee, OnboardingChecklistItem } from '../types.ts';

interface OnboardingViewProps {
  userRole: Role;
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ userRole, currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [checklists, setChecklists] = useState<any[]>([]);
  const [offboardingCases, setOffboardingCases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'onboarding' | 'offboarding'>('onboarding');

  // Initiate exit modal
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitEmpId, setExitEmpId] = useState('');
  const [exitDate, setExitDate] = useState(new Date().toISOString().substring(0, 10));
  const [exitReason, setExitReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [emps, alumniData] = await Promise.all([
        api.getEmployees(),
        api.getAlumniData(),
      ]);
      setEmployees(emps);
      setOffboardingCases(alumniData.offboardingCases || []);
      if (emps.length > 0 && !selectedEmpId) {
        setSelectedEmpId(emps[0].id);
        setExitEmpId(emps[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInitiateExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitEmpId) return;
    try {
      await api.changeEmployeeStatus(exitEmpId, {
        action: 'INITIATE_EXIT',
        effectiveDate: exitDate,
        remarks: exitReason,
      });
      setShowExitModal(false);
      notify('Exit and departmental clearance workflow initiated', 'success');
      loadData();
    } catch (err: any) {
      notify(`Exit initiation error: ${err.message}`, 'error');
    }
  };

  const sampleChecklist = [
    { id: '1', title: 'Submit Govt ID Proof (Aadhaar / PAN)', category: 'DOCUMENTATION', owner: 'Employee', due: 'Day 3', done: true },
    { id: '2', title: 'IT Laptop & VPN Security Provisioning', category: 'IT_PROVISIONING', owner: 'System Admin', due: 'Day 1', done: true },
    { id: '3', title: 'HR Policy & Anti-Harassment Induction', category: 'HR_INDUCTION', owner: 'HR Manager', due: 'Day 5', done: true },
    { id: '4', title: 'EPF & ESI Statutory Form 11 / Nomination', category: 'STATUTORY', owner: 'Payroll Officer', due: 'Day 7', done: false },
    { id: '5', title: 'Manager 30-Day Probation Goal Setting', category: 'MANAGER_CHECKIN', owner: 'Engineering Lead', due: 'Day 30', done: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Onboarding & Offboarding
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {userRole !== 'EMPLOYEE' && (
            <button
              onClick={() => setShowExitModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Initiate Employee Exit</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('onboarding')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'onboarding' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          New Hire Onboarding Checklists
        </button>

        <button
          onClick={() => setActiveTab('offboarding')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'offboarding' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Exit Clearance & FnF Workflows ({offboardingCases.length})
        </button>
      </div>

      {activeTab === 'onboarding' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Onboarding Checklist Progress</h2>
              <p className="text-2xs text-slate-500">Structured tasks assigned to HR, IT, Payroll, and Line Manager</p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Employee:</span>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="rounded-lg border border-slate-300 py-1 px-2.5 bg-slate-50 text-xs font-medium text-slate-800"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {sampleChecklist.map((task) => (
              <div key={task.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center ${task.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className={`font-medium ${task.done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </div>
                    <div className="text-2xs text-slate-400 flex items-center gap-2">
                      <span>Owner: {task.owner}</span>
                      <span>·</span>
                      <span>Due: {task.due}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-500">{task.category}</span>
                    </div>
                  </div>
                </div>

                <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${task.done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                  {task.done ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'offboarding' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Active Exit Clearance Workflows</h2>
            <p className="text-2xs text-slate-500">Notice period tracking, departmental sign-offs (HR, IT, Finance, Admin), and Full & Final settlement</p>
          </div>

          {offboardingCases.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No employees currently in notice period or exit clearance.
            </div>
          ) : (
            <div className="space-y-3">
              {offboardingCases.map((c) => {
                const emp = employees.find((e) => e.id === c.employeeId);
                return (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{emp?.firstName} {emp?.lastName} ({emp?.employeeCode})</div>
                        <div className="text-2xs text-slate-500">Last Working Day: {c.lastWorkingDate} · Reason: {c.detailedReason}</div>
                      </div>
                      <span className="text-2xs font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                        Notice Period
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-2xs">
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-slate-500 block">IT Hardware Return:</span>
                        <strong className="text-slate-900">Pending Return</strong>
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-slate-500 block">Finance & Loan:</span>
                        <strong className="text-emerald-700">Clear (₹0 Due)</strong>
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-slate-500 block">Admin Access Revoke:</span>
                        <strong className="text-slate-900">Scheduled on LWD</strong>
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-slate-500 block">FnF Payroll Statement:</span>
                        <strong className="text-slate-900">Draft Prepared</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Exit Initiation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleInitiateExit} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Initiate Employee Offboarding</h3>
            <div>
              <label className="font-medium text-slate-700">Select Employee</label>
              <select
                value={exitEmpId}
                onChange={(e) => setExitEmpId(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-medium text-slate-700">Last Working Date</label>
              <input
                type="date"
                required
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Resignation / Exit Notes</label>
              <textarea
                required
                rows={3}
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder="State formal reason for exit, handover plan, and clearance requirements..."
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowExitModal(false)} className="px-3 py-1.5 text-slate-600">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 text-white bg-rose-600 hover:bg-rose-700 rounded font-semibold">
                Initiate Clearance
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
