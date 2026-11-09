import React, { useState, useEffect } from 'react';
import { LifeBuoy, Plus, MessageSquare, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, HelpdeskTicket } from '../types.ts';

interface HelpdeskViewProps {
  userRole: Role;
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const HelpdeskView: React.FC<HelpdeskViewProps> = ({ userRole, currentUser }) => {
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    category: 'TAX_TDS' as const,
    priority: 'MEDIUM' as const,
    subject: '',
    description: '',
  });

  useEffect(() => {
    loadTickets();
  }, [currentUser]);

  const loadTickets = async () => {
    try {
      const data = await api.getHelpdeskTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitHelpdeskTicket(ticketForm);
      setShowAddModal(false);
      setTicketForm({ category: 'TAX_TDS', priority: 'MEDIUM', subject: '', description: '' });
      notify('Support ticket created', 'success');
      loadTickets();
    } catch (err: any) {
      notify(`Error submitting ticket: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Helpdesk & Inquiries
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{t.subject}</span>
                <span className="font-mono text-2xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  {t.ticketNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                  t.priority === 'HIGH' || t.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {t.priority}
                </span>
                <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                  t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                }`}>
                  {t.status}
                </span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">{t.description}</p>

            {t.resolutionComments && (
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-2xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>HR / Payroll Official Resolution:</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">{t.resolutionComments}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-2xs text-slate-400">
              <span>Category: <strong>{t.category}</strong></span>
              <span>Logged: {t.createdAt.substring(0, 10)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleCreateTicket} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Create HR Support Ticket</h3>
            <div>
              <label className="font-medium text-slate-700">Category</label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              >
                <option value="PAYROLL">Payroll & Salary Breakdown</option>
                <option value="TAX_TDS">Tax Declaration & TDS Deductions</option>
                <option value="LEAVE_ATTENDANCE">Leave & Attendance Discrepancy</option>
                <option value="IT_HARDWARE">IT Hardware & VPN Access</option>
                <option value="HR_POLICY">HR Policy & Benefits Clarification</option>
              </select>
            </div>
            <div>
              <label className="font-medium text-slate-700">Subject</label>
              <input required type="text" placeholder="Summary of question or issue..." value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
            </div>
            <div>
              <label className="font-medium text-slate-700">Detailed Description</label>
              <textarea required rows={3} placeholder="Provide details..." value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Submit Ticket</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
