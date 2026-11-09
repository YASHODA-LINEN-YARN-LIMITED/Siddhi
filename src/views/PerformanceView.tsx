import React, { useState, useEffect } from 'react';
import { Target, Award, Plus, CheckCircle2, TrendingUp, Star } from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, PerformanceGoal } from '../types.ts';

interface PerformanceViewProps {
  userRole: Role;
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ userRole, currentUser }) => {
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    metric: '',
    targetValue: '',
    currentValue: '',
    weightage: 25,
    progressPercent: 50,
  });

  useEffect(() => {
    loadGoals();
  }, [currentUser]);

  const loadGoals = async () => {
    try {
      const data = await api.getPerformanceGoals();
      setGoals(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addPerformanceGoal({
        ...goalForm,
        employeeId: currentUser.employeeId,
        cycleId: 'perf-fy26',
      });
      setShowAddModal(false);
      setGoalForm({ title: '', description: '', metric: '', targetValue: '', currentValue: '', weightage: 25, progressPercent: 50 });
      notify('Goal added successfully', 'success');
      loadGoals();
    } catch (err: any) {
      notify(`Error adding goal: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Performance Management
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span>Set Key Result / Goal</span>
        </button>
      </div>

      {/* Cycle Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-2xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase font-mono">
            Active Cycle
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Annual Performance Appraisal Cycle FY 2026-27
          </h2>
          <div className="text-2xs text-slate-500 mt-0.5">Timeline: April 1, 2026 to March 31, 2027 · Stage: Self-Review Active</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900 font-mono">87.5%</div>
          <div className="text-2xs text-slate-400">Team Goal Completion</div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => (
          <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{g.title}</h3>
                <p className="text-slate-600 text-2xs mt-1">{g.description}</p>
              </div>
              <span className="text-2xs font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded shrink-0">
                {g.weightage}% Wt
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-2xs text-slate-500 font-mono">
                <span>Progress: {g.currentValue} / {g.targetValue}</span>
                <span>{g.progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${g.progressPercent}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-400">
              <span>Metric: {g.metric}</span>
              <span className="text-emerald-700 font-semibold">{g.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAddGoal} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Define Strategic Goal / OKR</h3>
            <div>
              <label className="font-medium text-slate-700">Goal Title</label>
              <input required type="text" placeholder="e.g. Implement Zero-Downtime Migration" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </div>
            <div>
              <label className="font-medium text-slate-700">Description</label>
              <textarea required rows={2} placeholder="Explain expectations and impact..." value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700">Target Value</label>
                <input required type="text" placeholder="100% test coverage" value={goalForm.targetValue} onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
              </div>
              <div>
                <label className="font-medium text-slate-700">Weightage (%)</label>
                <input type="number" value={goalForm.weightage} onChange={(e) => setGoalForm({ ...goalForm, weightage: Number(e.target.value) })} className="mt-1 w-full rounded border border-slate-300 p-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Save Goal</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
