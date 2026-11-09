import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Clock,
  Home,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, Employee, DailyAttendance, LeaveRequest, AttendanceCorrectionRequest, WorkFromHomeRequest, ExpenseClaim } from '../types.ts';

interface KekaTeamViewProps {
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const KekaTeamView: React.FC<KekaTeamViewProps> = ({ currentUser }) => {
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<DailyAttendance[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<AttendanceCorrectionRequest[]>([]);
  const [pendingWfh, setPendingWfh] = useState<WorkFromHomeRequest[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // 1-on-1 meeting schedule state
  const [showOneOnOneModal, setShowOneOnOneModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [oneOnOneAgenda, setOneOnOneAgenda] = useState('');
  const [oneOnOneDate, setOneOnOneDate] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    loadTeamData();
  }, [currentUser]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [allEmps, allAtt, allLeaves, allCorr, allWfh, allExp] = await Promise.all([
        api.getEmployees(),
        api.getDailyAttendance(),
        api.getLeaveRequests({ status: 'PENDING' }),
        api.getAttendanceCorrections(),
        api.getWfhRequests(),
        api.getExpenses(),
      ]);

      // If Manager, filter by direct reports, or return team if HR/Admin
      const directReports =
        currentUser.role === 'MANAGER'
          ? allEmps.filter((e) => e.managerId === currentUser.employeeId || e.departmentId === 'dept-eng')
          : allEmps.filter((e) => e.id !== currentUser.employeeId);

      setTeamMembers(directReports);
      setTeamAttendance(allAtt);
      setPendingLeaves(allLeaves);
      setPendingCorrections(allCorr.filter((c) => c.status === 'PENDING'));
      setPendingWfh(allWfh.filter((w) => w.status === 'PENDING'));
      setPendingExpenses(allExp.filter((e) => e.status === 'SUBMITTED'));
    } catch (e) {
      console.error('Failed to load team data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      await api.approveLeaveRequest(id, 'Approved by Line Manager');
      notify('Leave approved', 'success');
      loadTeamData();
    } catch (e: any) {
      notify(`Approval error: ${e.message}`, 'error');
    }
  };

  const handleApproveCorrection = async (id: string) => {
    try {
      await api.approveAttendanceCorrection(id, 'Approved by Line Manager');
      notify('Attendance correction approved', 'success');
      loadTeamData();
    } catch (e: any) {
      notify(`Approval error: ${e.message}`, 'error');
    }
  };

  const handleApproveWfh = async (id: string) => {
    try {
      await api.approveWfhRequest(id, 'Approved by Line Manager');
      notify('WFH request approved', 'success');
      loadTeamData();
    } catch (e: any) {
      notify(`Approval error: ${e.message}`, 'error');
    }
  };

  const handleScheduleOneOnOne = (e: React.FormEvent) => {
    e.preventDefault();
    notify(`1-on-1 meeting scheduled with ${selectedMember?.firstName}`, 'success');
    setShowOneOnOneModal(false);
    setOneOnOneAgenda('');
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const presentCount = teamAttendance.filter((a) => a.date === todayStr && (a.status === 'PRESENT' || a.status === 'OVERTIME')).length;
  const lateCount = teamAttendance.filter((a) => a.date === todayStr && a.status === 'LATE').length;
  const onLeaveCount = teamAttendance.filter((a) => a.date === todayStr && a.status === 'ON_LEAVE').length;

  const totalPendingCount =
    pendingLeaves.length + pendingCorrections.length + pendingWfh.length + pendingExpenses.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Team
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-semibold">
            {teamMembers.length} Direct Reports
          </span>
        </div>
      </div>

      {/* Today's Team Presence Heatmap / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-2xs text-slate-500 uppercase font-semibold">In Office (Present)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{presentCount}</div>
          <div className="text-2xs text-slate-400">Punched in & verified</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-2xs text-slate-500 uppercase font-semibold">Late Arrivals</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{lateCount}</div>
          <div className="text-2xs text-slate-400">Past 9:15 AM grace</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-2xs text-slate-500 uppercase font-semibold">On Leave</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{onLeaveCount}</div>
          <div className="text-2xs text-slate-400">Sanctioned time off</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-2xs text-slate-500 uppercase font-semibold">Pending Requests</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{totalPendingCount}</div>
          <div className="text-2xs text-slate-400">Requires your approval</div>
        </div>
      </div>

      {/* Unified Approvals Action Center (Keka Action Center) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Manager Approvals Inbox</h2>
          </div>
          <span className="text-2xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded">
            {totalPendingCount} Action Items
          </span>
        </div>

        {totalPendingCount === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Inbox zero! All team requests have been processed.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Leaves */}
            {pendingLeaves.map((l) => (
              <div key={l.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{l.employeeName || l.employeeId}</span>
                    <span className="text-2xs font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                      Leave: {l.leaveTypeName || 'Time Off'} ({l.daysCount} days)
                    </span>
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5 font-mono">
                    {l.startDate} to {l.endDate} · Reason: {l.reason}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveLeave(l.id)}
                    className="px-3 py-1 text-2xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}

            {/* Attendance Corrections */}
            {pendingCorrections.map((c) => (
              <div key={c.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.employeeId}</span>
                    <span className="text-2xs font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Punch Correction: {c.date}
                    </span>
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5 font-mono">
                    Req: {c.requestedFirstIn} to {c.requestedLastOut} · Reason: {c.reason}
                  </div>
                </div>

                <button
                  onClick={() => handleApproveCorrection(c.id)}
                  className="px-3 py-1 text-2xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                >
                  Approve Correction
                </button>
              </div>
            ))}

            {/* WFH Requests */}
            {pendingWfh.map((w) => (
              <div key={w.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{w.employeeName || w.employeeCode}</span>
                    <span className="text-2xs font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                      {w.type}: {w.startDate} ({w.daysCount} days)
                    </span>
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5 font-mono">Reason: {w.reason}</div>
                </div>

                <button
                  onClick={() => handleApproveWfh(w.id)}
                  className="px-3 py-1 text-2xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                >
                  Approve {w.type}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Roster with 1-on-1 Meeting Scheduling */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-semibold text-xs text-slate-900">Direct Reports Directory</h2>
          <span className="text-2xs text-slate-500">Reporting to {currentUser.name}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {teamMembers.map((m) => (
            <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-xs">
                  {m.firstName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{m.firstName} {m.lastName}</div>
                  <div className="text-2xs text-slate-400 font-mono">{m.employeeCode} · {m.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  {m.status}
                </span>

                <button
                  onClick={() => {
                    setSelectedMember(m);
                    setShowOneOnOneModal(true);
                  }}
                  className="px-2.5 py-1 text-2xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>Schedule 1-on-1</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1-on-1 Modal */}
      {showOneOnOneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleScheduleOneOnOne} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Schedule 1-on-1 with {selectedMember?.firstName}</h3>
            <div>
              <label className="font-medium text-slate-700">Meeting Date & Time</label>
              <input
                type="date"
                required
                value={oneOnOneDate}
                onChange={(e) => setOneOnOneDate(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Agenda & Discussion Topics</label>
              <textarea
                required
                rows={3}
                placeholder="Discuss project roadmap, feedback, blockers, career goals..."
                value={oneOnOneAgenda}
                onChange={(e) => setOneOnOneAgenda(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowOneOnOneModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Confirm Meeting</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
