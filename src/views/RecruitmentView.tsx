import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Star,
  FileText,
  UserCheck,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, JobRequisition, Candidate, Department } from '../types.ts';

interface RecruitmentViewProps {
  userRole: Role;
}

export const RecruitmentView: React.FC<RecruitmentViewProps> = ({ userRole }) => {
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'requisitions'>('pipeline');
  const [loading, setLoading] = useState(true);

  // New Candidate modal
  const [showAddCandModal, setShowAddCandModal] = useState(false);
  const [candForm, setCandForm] = useState({
    requisitionId: '',
    fullName: '',
    email: '',
    phone: '',
    currentDesignation: '',
    currentCompany: '',
    experienceYears: 3,
    currentCtc: 1200000,
    expectedCtc: 1600000,
    noticePeriodDays: 30,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, cands, orgData] = await Promise.all([
        api.getJobRequisitions(),
        api.getCandidates(),
        api.getOrganization(),
      ]);
      setRequisitions(reqs);
      setCandidates(cands);
      setDepartments(orgData.departments);

      if (reqs.length > 0 && !candForm.requisitionId) {
        setCandForm((prev) => ({ ...prev, requisitionId: reqs[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCandidate(candForm as any);
      setShowAddCandModal(false);
      setCandForm({ requisitionId: requisitions[0]?.id || '', fullName: '', email: '', phone: '', currentDesignation: '', currentCompany: '', experienceYears: 3, currentCtc: 1200000, expectedCtc: 1600000, noticePeriodDays: 30 });
      notify('Candidate added to pipeline', 'success');
      loadData();
    } catch (err: any) {
      notify(`Error adding candidate: ${err.message}`, 'error');
    }
  };

  const handleStageChange = async (candidateId: string, stage: string) => {
    try {
      await api.updateCandidateStage(candidateId, stage);
      notify('Candidate stage updated', 'success');
      loadData();
    } catch (e: any) {
      notify(`Stage update error: ${e.message}`, 'error');
    }
  };

  const handleConvertToEmployee = async (candidateId: string) => {
    try {
      const res = await api.convertCandidateToEmployee(candidateId);
      notify(`Candidate converted to employee (${res.employee.employeeCode})`, 'success');
      loadData();
    } catch (e: any) {
      notify(`Conversion error: ${e.message}`, 'error');
    }
  };

  const stages = [
    { key: 'APPLIED', label: 'Applied' },
    { key: 'SCREENING', label: 'Screening' },
    { key: 'INTERVIEW_ROUND_1', label: 'Round 1 Tech' },
    { key: 'INTERVIEW_ROUND_2', label: 'Round 2 Manager' },
    { key: 'OFFERED', label: 'Offer Released' },
    { key: 'HIRED', label: 'Hired' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Recruitment & Hiring Pipeline
          </h1>
        </div>

        <button
          onClick={() => setShowAddCandModal(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Requisitions Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {requisitions.map((req) => {
          const dept = departments.find((d) => d.id === req.departmentId)?.name || 'General';
          return (
            <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900">{req.title}</div>
                <span className="text-2xs font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                  {req.vacancies} Vacancies
                </span>
              </div>
              <div className="text-slate-600 text-2xs">Department: {dept} · Budget: ₹{(req.budgetMin / 100000).toFixed(1)}L - ₹{(req.budgetMax / 100000).toFixed(1)}L</div>
              <p className="text-slate-500 text-2xs">{req.justification}</p>
            </div>
          );
        })}
      </div>

      {/* Candidate Pipeline Kanban / Columns */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Hiring Pipeline Stages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((st) => {
            const inStage = candidates.filter((c) => c.stage === st.key);
            return (
              <div key={st.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3 flex flex-col justify-between min-h-[300px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                    <span>{st.label}</span>
                    <span className="text-2xs text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {inStage.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {inStage.map((cand) => (
                      <div key={cand.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                        <div className="font-semibold text-slate-900 leading-tight">{cand.fullName}</div>
                        <div className="text-2xs text-slate-500">{cand.currentDesignation} ({cand.experienceYears}y exp)</div>
                        <div className="text-2xs font-mono text-slate-400">Exp CTC: ₹{(cand.expectedCtc / 100000).toFixed(1)}L</div>

                        {cand.stage === 'OFFERED' && (
                          <button
                            onClick={() => handleConvertToEmployee(cand.id)}
                            className="w-full mt-2 py-1 text-2xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>Convert to Employee</span>
                          </button>
                        )}

                        {cand.stage !== 'HIRED' && (
                          <div className="pt-1 flex items-center justify-between text-2xs text-slate-400">
                            <span>Move:</span>
                            <select
                              value={cand.stage}
                              onChange={(e) => handleStageChange(cand.id, e.target.value)}
                              className="text-2xs border border-slate-200 rounded bg-slate-50 py-0.5 px-1"
                            >
                              {stages.map((s) => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddCandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAddCandidate} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add Candidate to Pipeline</h3>
            <div>
              <label className="font-medium text-slate-700">Full Name</label>
              <input required type="text" placeholder="e.g. Tanvi Joshi" value={candForm.fullName} onChange={(e) => setCandForm({ ...candForm, fullName: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700">Email</label>
                <input required type="email" placeholder="tanvi@example.com" value={candForm.email} onChange={(e) => setCandForm({ ...candForm, email: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
              </div>
              <div>
                <label className="font-medium text-slate-700">Phone</label>
                <input required type="text" placeholder="+91 98000 00000" value={candForm.phone} onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700">Current Role</label>
                <input type="text" placeholder="Frontend Developer" value={candForm.currentDesignation} onChange={(e) => setCandForm({ ...candForm, currentDesignation: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
              </div>
              <div>
                <label className="font-medium text-slate-700">Experience (Years)</label>
                <input type="number" step="0.5" value={candForm.experienceYears} onChange={(e) => setCandForm({ ...candForm, experienceYears: Number(e.target.value) })} className="mt-1 w-full rounded border border-slate-300 p-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddCandModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Add Candidate</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
