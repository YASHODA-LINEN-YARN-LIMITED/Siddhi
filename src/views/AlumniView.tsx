import React, { useState, useEffect } from 'react';
import { GraduationCap, Shield, UserCheck, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, Employee } from '../types.ts';

interface AlumniViewProps {
  userRole: Role;
}

export const AlumniView: React.FC<AlumniViewProps> = ({ userRole }) => {
  const [formerEmployees, setFormerEmployees] = useState<Employee[]>([]);
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    try {
      setLoading(true);
      const data = await api.getAlumniData();
      setFormerEmployees(data.formerEmployees);
      setPortalEnabled(data.portalEnabled);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortal = async () => {
    try {
      const res = await api.toggleAlumniPortal();
      setPortalEnabled(res.portalEnabled);
      notify(`Alumni portal access ${res.portalEnabled ? 'enabled' : 'disabled'}`, 'info');
    } catch (e: any) {
      notify(`Toggle failed: ${e.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Alumni & Exit Records
          </h1>
        </div>

        {userRole === 'ADMIN' && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg text-xs shadow-2xs">
            <span className="text-slate-600 font-medium">Alumni Portal Access:</span>
            <button
              onClick={handleTogglePortal}
              className={`px-3 py-1 rounded text-2xs font-bold transition-colors ${
                portalEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {portalEnabled ? 'Enabled' : 'Disabled (Default)'}
            </button>
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-slate-700" />
          <span>Access Boundary Protection</span>
        </div>
        <p className="text-2xs text-slate-500">
          Alumni portal access is kept strictly isolated from active corporate infrastructure. Former employees cannot view ongoing organizational payrolls, attendance clocks, or internal team rosters.
        </p>
      </div>

      {/* Former employees table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 font-semibold text-xs text-slate-900">
          Former Employee Roster ({formerEmployees.length})
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
            <tr>
              <th className="py-2.5 px-4">Employee</th>
              <th className="py-2.5 px-4">Tenure</th>
              <th className="py-2.5 px-4">Exit Date</th>
              <th className="py-2.5 px-4">Exit Reason</th>
              <th className="py-2.5 px-4">Experience Certificate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {formerEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No former employee exit records recorded yet.
                </td>
              </tr>
            ) : (
              formerEmployees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-2xs">{e.dateOfJoining} to {e.exitDate || '2026-10-31'}</td>
                  <td className="py-3 px-4 font-mono text-2xs text-slate-900">{e.exitDate || '2026-10-31'}</td>
                  <td className="py-3 px-4 text-slate-600">{e.exitReason || 'Resigned for higher studies'}</td>
                  <td className="py-3 px-4">
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                      Issued
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
