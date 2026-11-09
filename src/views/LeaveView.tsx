import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, LeaveType, LeaveBalance, LeaveRequest } from '../types.ts';

interface LeaveViewProps {
  userRole: Role;
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const LeaveView: React.FC<LeaveViewProps> = ({ userRole, currentUser }) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveTypeId: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    daysCount: 1,
    isHalfDay: false,
    reason: '',
  });

  useEffect(() => {
    loadLeaveData();
  }, [currentUser]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      const [types, bals, reqs] = await Promise.all([
        api.getLeaveTypes(),
        api.getLeaveBalances(currentUser.employeeId),
        api.getLeaveRequests(),
      ]);
      setLeaveTypes(types);
      setBalances(bals);
      setRequests(reqs);

      if (!applyForm.leaveTypeId && types[0]) {
        setApplyForm((prev) => ({ ...prev, leaveTypeId: types[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitLeaveRequest(applyForm);
      setShowApplyModal(false);
      setApplyForm({
        leaveTypeId: leaveTypes[0]?.id || '',
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        daysCount: 1,
        isHalfDay: false,
        reason: '',
      });
      notify('Leave request submitted successfully', 'success');
      loadLeaveData();
    } catch (err: any) {
      notify(`Leave application failed: ${err.message}`, 'error');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveLeaveRequest(id, 'Approved');
      notify('Leave request approved', 'success');
      loadLeaveData();
    } catch (e: any) {
      notify(`Approval error: ${e.message}`, 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectLeaveRequest(id, 'Rejected by Approver');
      notify('Leave request rejected', 'info');
      loadLeaveData();
    } catch (e: any) {
      notify(`Rejection error: ${e.message}`, 'error');
    }
  };

  const filteredRequests =
    filterStatus === 'ALL'
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Leave Management
          </h1>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span>Apply Time Off</span>
        </button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {balances.map((b) => (
          <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <div className="text-2xs font-semibold text-slate-500 uppercase">{b.leaveTypeCode || 'Leave'}</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{b.closingBalance} <span className="text-xs font-normal text-slate-400">days</span></div>
            <div className="text-2xs text-slate-400 mt-1">
              Used: {b.used} · Accrued: {b.accrued}
            </div>
          </div>
        ))}
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="font-semibold text-xs text-slate-900">Leave Requests History</div>

          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-md text-xs">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded text-2xs font-medium transition-colors ${
                  filterStatus === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
              <tr>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Leave Type</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Days</th>
                <th className="py-2.5 px-4">Reason</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {r.employeeName || r.employeeId}
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {r.leaveTypeName || r.leaveTypeId}
                    </td>

                    <td className="py-3 px-4 font-mono text-2xs text-slate-600">
                      {r.startDate} {r.startDate !== r.endDate ? `to ${r.endDate}` : ''}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {r.daysCount} {r.isHalfDay ? '(Half Day)' : ''}
                    </td>

                    <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]">{r.reason}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      {r.status === 'PENDING' && userRole !== 'EMPLOYEE' && (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="px-2.5 py-1 text-2xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="px-2.5 py-1 text-2xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status !== 'PENDING' && <span className="text-2xs text-slate-400">Processed</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleApplyLeave}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Apply for Time Off</h2>
              <button type="button" onClick={() => setShowApplyModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Leave Category</label>
                <select
                  value={applyForm.leaveTypeId}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) - {t.isPaid ? 'Paid' : 'Unpaid (Loss of Pay)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-slate-700">Days Requested</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={applyForm.daysCount}
                    onChange={(e) => setApplyForm({ ...applyForm, daysCount: Number(e.target.value) })}
                    className="mt-1 w-24 rounded-lg border border-slate-300 p-2 text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyForm.isHalfDay}
                    onChange={(e) => setApplyForm({ ...applyForm, isHalfDay: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span>Half Day</span>
                </label>
              </div>

              <div>
                <label className="font-medium text-slate-700">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="State reason for absence..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
              >
                Submit Leave Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
