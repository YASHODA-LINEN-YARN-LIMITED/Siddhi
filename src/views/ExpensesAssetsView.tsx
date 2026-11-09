import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Banknote,
  Laptop,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, ExpenseClaim, EmployeeLoan, AssetRecord } from '../types.ts';

interface ExpensesAssetsViewProps {
  userRole: Role;
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const ExpensesAssetsView: React.FC<ExpensesAssetsViewProps> = ({ userRole, currentUser }) => {
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loans, setLoans] = useState<EmployeeLoan[]>([]);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'loans' | 'assets'>('expenses');
  const [loading, setLoading] = useState(true);

  // New claim modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    category: 'CLIENT_MEETING' as const,
    amount: 1500,
    claimDate: new Date().toISOString().substring(0, 10),
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expData, loanData, assetData] = await Promise.all([
        api.getExpenses(),
        api.getLoans(),
        api.getAssets(),
      ]);
      setExpenses(expData);
      setLoans(loanData);
      setAssets(assetData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitExpense(claimForm);
      setShowClaimModal(false);
      setClaimForm({ category: 'CLIENT_MEETING', amount: 1500, claimDate: new Date().toISOString().substring(0, 10), description: '' });
      notify('Expense claim submitted', 'success');
      loadData();
    } catch (err: any) {
      notify(`Claim error: ${err.message}`, 'error');
    }
  };

  const handleApproveClaim = async (id: string) => {
    try {
      await api.approveExpense(id, 'Approved as per business expense policy');
      notify('Expense claim approved', 'success');
      loadData();
    } catch (e: any) {
      notify(`Approval error: ${e.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Expenses, Loans & Assets
          </h1>
        </div>

        <button
          onClick={() => setShowClaimModal(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span>Submit Expense Claim</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'expenses' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Expense Claims ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'loans' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Banknote className="h-3.5 w-3.5" />
          <span>Salary Advances & Loans ({loans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'assets' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Laptop className="h-3.5 w-3.5" />
          <span>Asset Inventory ({assets.length})</span>
        </button>
      </div>

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No expense claims submitted.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-2xs text-slate-600">{exp.claimDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{exp.category}</td>
                      <td className="py-3 px-4 text-slate-600">{exp.description}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                            exp.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : exp.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {exp.status === 'SUBMITTED' && userRole !== 'EMPLOYEE' && (
                          <button
                            onClick={() => handleApproveClaim(exp.id)}
                            className="px-2.5 py-1 text-2xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                          >
                            Approve Claim
                          </button>
                        )}
                        {exp.status !== 'SUBMITTED' && <span className="text-2xs text-slate-400">Processed</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOANS TAB */}
      {activeTab === 'loans' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Salary Advances & Loan Repayment Ledgers</h2>
            <p className="text-2xs text-slate-500">Monthly EMI deductions automatically applied to payroll pay runs</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loans.map((l) => (
              <div key={l.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{l.loanType}</span>
                  <span className="text-2xs font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                    {l.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-2xs font-mono">
                  <div>Principal: <strong className="block text-slate-900">₹{l.principalAmount.toLocaleString('en-IN')}</strong></div>
                  <div>Monthly EMI: <strong className="block text-slate-900">₹{l.monthlyDeduction.toLocaleString('en-IN')}</strong></div>
                  <div>Balance Due: <strong className="block text-rose-700">₹{l.balanceRemaining.toLocaleString('en-IN')}</strong></div>
                </div>
                <div className="text-2xs text-slate-500 pt-1">
                  Disbursed: {l.disbursedDate} · Auto-Deduct From Payroll: {l.deductFromPayroll ? 'Yes' : 'No'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSETS TAB */}
      {activeTab === 'assets' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
              <tr>
                <th className="py-2.5 px-4">Asset Tag</th>
                <th className="py-2.5 px-4">Equipment Name</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Serial Number</th>
                <th className="py-2.5 px-4">Condition</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((ast) => (
                <tr key={ast.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{ast.assetTag}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{ast.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{ast.category}</td>
                  <td className="py-2.5 px-4 font-mono text-2xs text-slate-500">{ast.serialNumber}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-700">{ast.condition}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                        ast.status === 'ASSIGNED'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {ast.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmitClaim} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Submit Business Expense Claim</h3>
            <div>
              <label className="font-medium text-slate-700">Category</label>
              <select
                value={claimForm.category}
                onChange={(e) => setClaimForm({ ...claimForm, category: e.target.value as any })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              >
                <option value="CLIENT_MEETING">Client Meeting & Commute</option>
                <option value="TRAVEL">Domestic / International Travel</option>
                <option value="MEALS">Meals & Sustenance</option>
                <option value="OFFICE_SUPPLIES">Office Supplies & Stationery</option>
                <option value="TRAINING">Professional Training & Certifications</option>
              </select>
            </div>
            <div>
              <label className="font-medium text-slate-700">Amount (INR)</label>
              <input
                type="number"
                required
                value={claimForm.amount}
                onChange={(e) => setClaimForm({ ...claimForm, amount: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Claim Description</label>
              <textarea
                required
                rows={3}
                value={claimForm.description}
                onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                placeholder="State purpose of expenditure..."
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowClaimModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Submit Claim</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
