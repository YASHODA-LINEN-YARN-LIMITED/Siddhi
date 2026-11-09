import React, { useState, useEffect } from 'react';
import {
  Clock,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Plus,
  Fingerprint,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, DailyAttendance, AttendanceCorrectionRequest, Shift } from '../types.ts';

interface AttendanceViewProps {
  userRole: Role;
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ userRole, currentUser }) => {
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [loading, setLoading] = useState(true);

  // Correction request modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrForm, setCorrForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    requestedFirstIn: '09:00:00',
    requestedLastOut: '18:00:00',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attData, corrData, orgData] = await Promise.all([
        api.getDailyAttendance({ date: selectedDate }),
        api.getAttendanceCorrections(),
        api.getOrganization(),
      ]);
      setAttendance(attData);
      setCorrections(corrData);
      setShifts(orgData.shifts);
    } catch (e) {
      console.error('Failed to load attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitAttendanceCorrection(corrForm);
      setShowCorrectionModal(false);
      setCorrForm({ date: new Date().toISOString().substring(0, 10), requestedFirstIn: '09:00:00', requestedLastOut: '18:00:00', reason: '' });
      notify('Attendance correction request submitted', 'success');
      loadData();
    } catch (err: any) {
      notify(`Error submitting correction: ${err.message}`, 'error');
    }
  };

  const handleApproveCorrection = async (id: string) => {
    try {
      await api.approveAttendanceCorrection(id, 'Approved by Manager');
      notify('Correction approved', 'success');
      loadData();
    } catch (e: any) {
      notify(`Approval error: ${e.message}`, 'error');
    }
  };

  const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'OVERTIME').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE').length;
  const onLeaveCount = attendance.filter((a) => a.status === 'ON_LEAVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Attendance & Shifts
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="h-4 w-4 text-slate-700" />
            <span>Request Punch Correction</span>
          </button>
        </div>
      </div>

      {/* Date Selector & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-center">
          <label className="text-2xs font-semibold text-slate-500 uppercase">Select Attendance Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 text-xs font-mono font-medium rounded-lg border border-slate-300 p-2 text-slate-900 bg-slate-50"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-2xs text-slate-500 uppercase font-medium">On-Time Present</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{presentCount}</div>
          <div className="text-2xs text-slate-400">Within grace period</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-2xs text-slate-500 uppercase font-medium">Late Marks</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{lateCount}</div>
          <div className="text-2xs text-slate-400">Exceeded 15m grace</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-2xs text-slate-500 uppercase font-medium">On Approved Leave</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{onLeaveCount}</div>
          <div className="text-2xs text-slate-400">Sanctioned time off</div>
        </div>
      </div>

      {/* Daily Attendance Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="font-semibold text-xs text-slate-900">
            Attendance Register for <span className="font-mono text-slate-700">{selectedDate}</span>
          </div>
          <span className="text-2xs text-slate-500">Source: Biometric API + Web Clock</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
              <tr>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">First In</th>
                <th className="py-2.5 px-4">Last Out</th>
                <th className="py-2.5 px-4">Punches</th>
                <th className="py-2.5 px-4">Work Hours</th>
                <th className="py-2.5 px-4">Late / OT</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans text-xs">
                    No attendance records for this date. Attendance is recorded live from the Realtime biometric terminal.
                  </td>
                </tr>
              ) : (
                attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-900">{att.employeeName || att.employeeId}</div>
                      <div className="text-2xs text-slate-400 font-mono">{att.employeeCode}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {att.firstIn || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {att.lastOut || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-sans">{att.punchCount}</td>

                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      {att.workHours > 0 ? `${att.workHours} hrs` : '—'}
                    </td>

                    <td className="py-3 px-4 font-sans text-2xs">
                      {att.lateMinutes > 0 && (
                        <span className="text-amber-700 font-medium mr-2">+{att.lateMinutes}m late</span>
                      )}
                      {att.overtimeMinutes > 0 && (
                        <span className="text-emerald-700 font-medium">+{att.overtimeMinutes}m OT</span>
                      )}
                      {!att.lateMinutes && !att.overtimeMinutes && <span className="text-slate-400">—</span>}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                          att.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : att.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : att.status === 'ON_LEAVE'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-500 text-2xs">
                      {att.source} {att.isCorrectionApplied ? '(Corrected)' : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Correction Requests list */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900">Attendance Correction Requests</h2>
        </div>


        {corrections.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No correction requests logged.
          </div>
        ) : (
          <div className="space-y-2">
            {corrections.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span>Date: {c.date}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-2xs text-slate-600">
                      Req: {c.requestedFirstIn} to {c.requestedLastOut}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span
                      className={`text-2xs font-semibold px-1.5 py-0.2 rounded ${
                        c.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5">Reason: {c.reason}</div>
                </div>

                {c.status === 'PENDING' && userRole !== 'EMPLOYEE' && (
                  <button
                    onClick={() => handleApproveCorrection(c.id)}
                    className="px-2.5 py-1 text-2xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors self-start sm:self-center"
                  >
                    Approve Correction
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmitCorrection}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Request Attendance Regularization</h2>
              <button type="button" onClick={() => setShowCorrectionModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Date to Regularize</label>
                <input
                  type="date"
                  required
                  value={corrForm.date}
                  onChange={(e) => setCorrForm({ ...corrForm, date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-slate-700">Actual In Time</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={corrForm.requestedFirstIn}
                    onChange={(e) => setCorrForm({ ...corrForm, requestedFirstIn: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Actual Out Time</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={corrForm.requestedLastOut}
                    onChange={(e) => setCorrForm({ ...corrForm, requestedLastOut: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700">Detailed Reason</label>
                <textarea
                  required
                  rows={3}
                  value={corrForm.reason}
                  onChange={(e) => setCorrForm({ ...corrForm, reason: e.target.value })}
                  placeholder="e.g., Biometric terminal did not register punch due to sensor calibration, confirmed with security log."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
              >
                Submit for Approval
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
