import React, { useState, useEffect } from 'react';
import {
  Shield,
  Download,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileCode,
  Lock,
  Eye,
  Key,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, AuditLog } from '../types.ts';

interface AdminSettingsViewProps {
  userRole: Role;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ userRole }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'roles' | 'backup' | 'deployment'>('audit');
  const [auditSearch, setAuditSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Restore file state
  const [restoreJson, setRestoreJson] = useState('');

  useEffect(() => {
    loadAudit();
  }, [moduleFilter, auditSearch]);

  const loadAudit = async () => {
    try {
      setLoading(true);
      const logs = await api.getAuditLogs({
        module: moduleFilter || undefined,
        search: auditSearch || undefined,
      });
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/admin/backup';
  };

  const handleRestoreBackup = async () => {
    if (!restoreJson.trim()) return;
    try {
      const parsed = JSON.parse(restoreJson);
      await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      notify('Database restored successfully from snapshot', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      notify(`Restore failed: ${e.message}`, 'error');
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemoDatabase();
      notify('Database reset to clean demo seed', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      notify(`Reset failed: ${e.message}`, 'error');
    }
  };

  const roleMatrix = [
    { module: 'Organization Structure', admin: true, hr: true, payroll: false, mgr: false, emp: false, rec: false, aud: true },
    { module: 'Core HR & Employee Records', admin: true, hr: true, payroll: false, mgr: false, emp: false, rec: false, aud: true },
    { module: 'Biometric Integration & Hardware', admin: true, hr: true, payroll: false, mgr: false, emp: false, rec: false, aud: true },
    { module: 'Attendance & Punch Regularization', admin: true, hr: true, payroll: true, mgr: true, emp: true, rec: false, aud: true },
    { module: 'Leave Approvals & Ledger', admin: true, hr: true, payroll: true, mgr: true, emp: true, rec: false, aud: true },
    { module: 'Payroll Preview & Finalization', admin: true, hr: true, payroll: true, mgr: false, emp: false, rec: false, aud: true },
    { module: 'Recruitment & Candidate Conversion', admin: true, hr: true, payroll: false, mgr: true, emp: false, rec: true, aud: true },
    { module: 'Performance Appraisals', admin: true, hr: true, payroll: false, mgr: true, emp: true, rec: false, aud: true },
    { module: 'Expenses & Assets', admin: true, hr: true, payroll: true, mgr: true, emp: true, rec: false, aud: true },
    { module: 'Searchable Audit Trail', admin: true, hr: false, payroll: false, mgr: false, emp: false, rec: false, aud: true },
    { module: 'Database Backup & Restore', admin: true, hr: false, payroll: false, mgr: false, emp: false, rec: false, aud: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Security & Administration
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Download Database Snapshot</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'roles' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Key className="h-3.5 w-3.5" />
          <span>Role & Permissions Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'backup' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Server className="h-3.5 w-3.5" />
          <span>Backup & Restore (JSON / SQL)</span>
        </button>

        <button
          onClick={() => setActiveTab('deployment')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'deployment' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="h-3.5 w-3.5" />
          <span>Docker & Deployment Guide</span>
        </button>
      </div>

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit actions, actor, affected entity..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full text-xs border-none outline-none bg-transparent placeholder-slate-400"
              />
            </div>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-3 bg-slate-50"
            >
              <option value="">All Modules</option>
              <option value="BIOMETRIC_ATTENDANCE">Biometric Attendance</option>
              <option value="PAYROLL">Payroll & Statutory</option>
              <option value="CORE_HR">Core HR & Roster</option>
              <option value="AUTH">Authentication & Sessions</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2 px-3 font-sans text-slate-900 font-medium">
                      {log.actorName} <span className="text-2xs text-slate-400 block font-mono">({log.actorRole})</span>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-800">{log.action}</td>
                    <td className="py-2 px-3 text-slate-500">{log.module}</td>
                    <td className="py-2 px-3 text-slate-800 font-sans">{log.entityName}</td>
                    <td className="py-2 px-3 text-slate-600 font-sans max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROLES MATRIX TAB */}
      {activeTab === 'roles' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Role-Based Access Control (RBAC) Matrix</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-3">Functional Module</th>
                  <th className="py-2.5 px-3 text-center">Admin</th>
                  <th className="py-2.5 px-3 text-center">HR Mgr</th>
                  <th className="py-2.5 px-3 text-center">Payroll</th>
                  <th className="py-2.5 px-3 text-center">Manager</th>
                  <th className="py-2.5 px-3 text-center">Employee</th>
                  <th className="py-2.5 px-3 text-center">Recruiter</th>
                  <th className="py-2.5 px-3 text-center">Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roleMatrix.map((row) => (
                  <tr key={row.module} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{row.module}</td>
                    <td className="py-2.5 px-3 text-center">{row.admin ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-2.5 px-3 text-center">{row.hr ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-2.5 px-3 text-center">{row.payroll ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-2.5 px-3 text-center">{row.mgr ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-2.5 px-3 text-center">{row.emp ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-2.5 px-3 text-center">{row.rec ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-2.5 px-3 text-center">{row.aud ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BACKUP & RESTORE TAB */}
      {activeTab === 'backup' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Local Database Snapshot & Recovery</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Download className="h-4 w-4 text-slate-700" />
                <span>Export Full Backup</span>
              </h3>
              <button
                onClick={handleDownloadBackup}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                Download Snapshot (.json)
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-slate-700" />
                <span>Reset to Clean Demo State</span>
              </h3>
              <button
                onClick={handleResetDemo}
                className="px-4 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors"
              >
                Reset Database Seed
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-900">Restore from JSON Snapshot Text</h3>
            <textarea
              rows={4}
              value={restoreJson}
              onChange={(e) => setRestoreJson(e.target.value)}
              placeholder="Paste previously downloaded JSON backup content here..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono bg-slate-50"
            />
            <button
              onClick={handleRestoreBackup}
              disabled={!restoreJson.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50"
            >
              Restore Database
            </button>
          </div>
        </div>
      )}

      {/* DEPLOYMENT GUIDE TAB */}
      {activeTab === 'deployment' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Local Server Deployment Architecture</h2>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">1. Launching via Docker Compose</div>
              <pre className="p-2.5 rounded bg-slate-900 text-slate-200 font-mono text-2xs overflow-x-auto">
{`# 1. Clone repository to your local server
git clone git@github.com:your-org/siddhi-hrms.git /opt/siddhi
cd /opt/siddhi

# 2. Copy environment template
cp .env.example .env

# 3. Launch PostgreSQL 16 & Siddhi Web App
docker compose up -d --build`}
              </pre>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">2. Automated PostgreSQL Daily Backup (Cron)</div>
              <pre className="p-2.5 rounded bg-slate-900 text-slate-200 font-mono text-2xs overflow-x-auto">
{`# Daily PostgreSQL Dump script
docker compose exec -T postgres pg_dump -U siddhi_user siddhi_hrms | gzip > /var/backups/siddhi_\$(date +%F).sql.gz`}
              </pre>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">3. Realtime Biometric Attendance Terminal Pairing</div>
              <p className="text-slate-600 text-2xs">
                Configure your Realtime punch clock with a static IP on your office subnet. Enter the device URL and Bearer token in the <strong>Biometric Device</strong> settings tab.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
