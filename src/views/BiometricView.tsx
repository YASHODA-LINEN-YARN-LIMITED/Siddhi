import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Download,
  Settings2,
  Clock,
  ShieldAlert,
  Server,
  Layers,
  Check,
  Copy,
  Radio,
  Trash2,
  ExternalLink,
  Play,
  Info,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { BiometricIntegrationSettings, RawBiometricPunch, Employee } from '../types.ts';

export const BiometricView: React.FC = () => {
  const [settings, setSettings] = useState<BiometricIntegrationSettings | null>(null);
  const [rawPunches, setRawPunches] = useState<RawBiometricPunch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'realtime_cloud' | 'punches' | 'settings' | 'quarantine' | 'csv'>('realtime_cloud');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Custom public backend host selection/override for Webhook
  const isGithubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  const devServerUrl = 'https://ais-dev-xprdmpkiap2xlvjmybcnti-854403608887.asia-east1.run.app';
  
  const [selectedHostMode, setSelectedHostMode] = useState<'auto' | 'dev_server' | 'custom'>(
    isGithubPages ? 'dev_server' : 'auto'
  );
  const [customHost, setCustomHost] = useState<string>('');

  // Quarantine resolution modal state
  const [resolvingPunch, setResolvingPunch] = useState<RawBiometricPunch | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // CSV Fallback state
  const [csvContent, setCsvContent] = useState<string>('');
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  // Determine active effective webhook URL
  const getActiveWebhookUrl = () => {
    if (selectedHostMode === 'dev_server') {
      return `${devServerUrl}/api/biometric/webhook`;
    }
    if (selectedHostMode === 'custom' && customHost.trim()) {
      const cleanHost = customHost.trim().replace(/\/$/, '');
      return `${cleanHost}/api/biometric/webhook`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/biometric/webhook`;
    }
    return 'http://localhost:3000/api/biometric/webhook';
  };

  const webhookUrl = getActiveWebhookUrl();

  const sampleCurlCommand = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '[
    {
      "employee_code": "1001",
      "employee_name": "Yashoda Operative",
      "log_datetime": "${new Date().toISOString().replace('T', ' ').substring(0, 19)}",
      "log_date": "${new Date().toISOString().substring(0, 10)}",
      "log_time": "${new Date().toTimeString().substring(0, 8)}",
      "downloaded_at": "${new Date().toISOString().replace('T', ' ').substring(0, 19)}",
      "device_sn": "RT-T502-8849"
    }
  ]'`;

  const handleCopyWebhookUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedUrl(true);
      notify('Webhook URL copied to clipboard', 'success');
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  const handleCopyCurl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sampleCurlCommand);
      setCopiedCurl(true);
      notify('Sample cURL command copied to clipboard', 'success');
      setTimeout(() => setCopiedCurl(false), 3000);
    }
  };

  const handleSimulateWebhookPunch = async () => {
    try {
      setSimulatingWebhook(true);
      const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const dateStr = nowIso.split(' ')[0];
      const timeStr = nowIso.split(' ')[1];

      // Pick an employee code or default to 1001
      const empCode = employees[0]?.employeeCode || '1001';

      const payload = [
        {
          employee_code: empCode,
          employee_name: employees[0] ? `${employees[0].firstName} ${employees[0].lastName}` : 'Yashoda Operative',
          log_datetime: nowIso,
          log_date: dateStr,
          log_time: timeStr,
          downloaded_at: nowIso,
          device_sn: 'REALTIME-CLOUD-T502',
        },
      ];

      const res = await fetch('/api/biometric/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === 'SUCCESS') {
        notify(`Simulated punch ingested! Employee: ${empCode} at ${timeStr}`, 'success');
        await loadData();
        setActiveTab('punches');
      } else {
        notify(`Simulation failed: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (e: any) {
      notify(`Simulation request failed: ${e.message}`, 'error');
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleClearPunches = async () => {
    try {
      setClearing(true);
      const res = await api.clearBiometricPunches();
      notify(`Cleared ${res.deletedPunches} punch(es) and ${res.deletedAttendance} attendance record(s)`, 'success');
      await loadData();
    } catch (e: any) {
      notify(`Clear failed: ${e.message}`, 'error');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sett, punches, emps] = await Promise.all([
        api.getBiometricSettings(),
        api.getRawPunches(),
        api.getEmployees(),
      ]);
      setSettings(sett);
      setRawPunches(punches);
      setEmployees(emps);
    } catch (e) {
      console.error('Failed to load biometric data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.testBiometricConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await api.syncBiometricNow();
      setSyncResult(res);
      await loadData();
    } catch (e: any) {
      setSyncResult({ success: false, message: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateBiometricSettings(settings);
      notify('Biometric settings saved', 'success');
      loadData();
    } catch (err: any) {
      notify(`Save error: ${err.message}`, 'error');
    }
  };

  const handleResolveQuarantine = async () => {
    if (!resolvingPunch || !selectedEmployeeId) return;
    try {
      await api.resolveQuarantinedPunch(resolvingPunch.id, selectedEmployeeId);
      setResolvingPunch(null);
      setSelectedEmployeeId('');
      notify('Punch mapped successfully', 'success');
      loadData();
    } catch (e: any) {
      notify(`Resolution failed: ${e.message}`, 'error');
    }
  };

  const handleUploadCsv = async () => {
    if (!csvContent.trim()) return;
    try {
      const res = await api.uploadBiometricCsv(csvContent);
      setCsvFeedback(res.message);
      setCsvContent('');
      notify('CSV imported successfully', 'success');
      loadData();
    } catch (e: any) {
      setCsvFeedback(`CSV import failed: ${e.message}`);
      notify(`CSV import failed: ${e.message}`, 'error');
    }
  };

  const quarantinedPunches = rawPunches.filter((p) => p.status === 'QUARANTINED');
  const filteredPunches =
    filterStatus === 'ALL'
      ? rawPunches
      : rawPunches.filter((p) => p.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Biometric Attendance Integration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime Machine live push listener & API connector
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateWebhookPunch}
            disabled={simulatingWebhook}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Play className={`h-4 w-4 text-emerald-600 ${simulatingWebhook ? 'animate-spin' : ''}`} />
            <span>{simulatingWebhook ? 'Simulating...' : 'Simulate Webhook Punch'}</span>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Server className={`h-4 w-4 ${testing ? 'animate-spin' : 'text-slate-600'}`} />
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* GitHub Pages Host Warning Banner */}
      {isGithubPages && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>GitHub Pages Endpoint Notice (`github.io`)</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            GitHub Pages (<code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">yashoda-linen-yarn-limited.github.io</code>) serves static frontend assets only. It cannot execute backend code or listen for HTTP POST requests from Realtime Biometric hardware (hence returning 404/405 errors).
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-amber-200 space-y-1.5 font-sans">
            <div className="font-semibold text-slate-900">How to fix your Realtime Biometric Push setup:</div>
            <ul className="list-disc list-inside space-y-1 text-2xs text-slate-700">
              <li>
                <strong>Option A (Live Dev Application):</strong> Point Realtime Cloud to your active server host at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800 font-bold">{devServerUrl}/api/biometric/webhook</code>.
              </li>
              <li>
                <strong>Option B (Local/On-Premises Server):</strong> Run <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">npm run dev</code> on your local server and use Cloudflare Tunnel or ngrok to create an HTTPS URL.
              </li>
              <li>
                <strong>Option C (Instant Webhook Test):</strong> Click the <strong>"Simulate Webhook Punch"</strong> button above to test real punch processing directly!
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Live Webhook Active Status */}
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-semibold text-emerald-900">Realtime Machine Webhook Listener: Active</span>
          <span className="text-slate-400 hidden sm:inline">·</span>
          <span className="text-2xs text-emerald-800 font-mono hidden sm:inline">Endpoint: /api/biometric/webhook</span>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-100/60 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Punches ({rawPunches.length})</span>
        </button>
      </div>

      {/* Test / Sync Result Banner */}
      {testResult && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Connection Test Result
            </span>
            <span className="text-2xs text-slate-400 font-mono">{testResult.testedAt}</span>
          </div>
          <p className="text-2xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
            {testResult.message}
          </p>
        </div>
      )}

      {syncResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Manual Sync Completed</span>
          </div>
          <p className="text-2xs text-emerald-800">{syncResult.message}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('realtime_cloud')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'realtime_cloud' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Radio className="h-3.5 w-3.5 text-emerald-300" />
          <span>Realtime Cloud Machine Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('punches')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'punches' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Raw Punch History ({rawPunches.length})
        </button>

        <button
          onClick={() => setActiveTab('quarantine')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'quarantine' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Quarantine Exceptions</span>
          {quarantinedPunches.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-2xs font-bold">
              {quarantinedPunches.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          API Connector Settings
        </button>

        <button
          onClick={() => setActiveTab('csv')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'csv' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          CSV Offline Fallback
        </button>
      </div>

      {/* TAB: Realtime Cloud Live Sync */}
      {activeTab === 'realtime_cloud' && (
        <div className="space-y-6">
          {/* Webhook Endpoint Card */}
          <div className="bg-white border-2 border-emerald-600/30 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Realtime Machine Live Data Ingestion Gateway</h2>
                  <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                    Live Webhook Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleClearPunches}
                  disabled={clearing}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{clearing ? 'Clearing...' : 'Clear Punch History'}</span>
                </button>
              </div>
            </div>

            {/* Server Webhook Host Selector */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800">Select Target Server Host for Webhook:</label>
                <div className="flex flex-wrap items-center gap-2 text-2xs">
                  <label className="flex items-center gap-1 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="hostMode"
                      checked={selectedHostMode === 'dev_server'}
                      onChange={() => setSelectedHostMode('dev_server')}
                    />
                    <span>Live App Server (Recommended)</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer font-medium text-slate-700 ml-2">
                    <input
                      type="radio"
                      name="hostMode"
                      checked={selectedHostMode === 'auto'}
                      onChange={() => setSelectedHostMode('auto')}
                    />
                    <span>Browser Default</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer font-medium text-slate-700 ml-2">
                    <input
                      type="radio"
                      name="hostMode"
                      checked={selectedHostMode === 'custom'}
                      onChange={() => setSelectedHostMode('custom')}
                    />
                    <span>Custom Host</span>
                  </label>
                </div>
              </div>

              {selectedHostMode === 'custom' && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="https://your-custom-backend-server.com"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                  <p className="text-2xs text-slate-400">Enter your live server domain or Cloudflare Tunnel HTTPS URL</p>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-semibold text-slate-700">Calculated Webhook URL to paste in Realtime Cloud:</label>
                  <span className="text-2xs font-bold text-emerald-700">Ready for POST & GET</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-bold select-all"
                  />
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy Webhook URL'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Test Simulation Box */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <TerminalIcon className="h-4 w-4" />
                  Terminal & Postman Test Command (cURL)
                </span>
                <button
                  onClick={handleCopyCurl}
                  className="px-3 py-1 text-2xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors"
                >
                  {copiedCurl ? 'Copied cURL' : 'Copy cURL Command'}
                </button>
              </div>
              <pre className="text-2xs font-mono bg-black/60 p-3 rounded-lg overflow-x-auto text-emerald-300 border border-slate-800 leading-relaxed">
                {sampleCurlCommand}
              </pre>
            </div>
          </div>

          {/* Configuration Mapping Matrix matching Realtime India Portal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: General Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-2xs">1</span>
                  <span>Realtime Cloud Portal Settings</span>
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">API Type</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">Third Party Api</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Request Method</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">POST (Recommended) or GET</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Authorization Auth Type</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">No Auth</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Content-Type</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">application/json</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Data Sending Format</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">Body</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-emerald-50/70 border border-emerald-200">
                  <span className="text-emerald-950 font-semibold">Active Parallel Third-party API Transfer</span>
                  <span className="text-2xs font-bold text-white bg-emerald-700 px-2 py-0.5 rounded">Checked [✓]</span>
                </div>
              </div>
            </div>

            {/* Right: Parameter Fields */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-2xs">2</span>
                  <span>Realtime Parameter Mapping Checkbox List</span>
                </h3>
              </div>

              <div className="space-y-2">
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">For Emp.Code & Name</div>
                    <div className="text-2xs font-mono text-slate-500">employee_code (Int or String, 8 Digits)</div>
                  </div>
                  <span className="text-emerald-700 font-bold">✓ Checked</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Log Date Time</div>
                    <div className="text-2xs font-mono text-slate-500">log_datetime (Format: yyyy-MM-dd HH:mm:ss)</div>
                  </div>
                  <span className="text-emerald-700 font-bold">✓ Checked</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Log Date & Time</div>
                    <div className="text-2xs font-mono text-slate-500">log_date (yyyy-MM-dd) · log_time (HH:mm:ss)</div>
                  </div>
                  <span className="text-emerald-700 font-bold">✓ Checked</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Download Date Time</div>
                    <div className="text-2xs font-mono text-slate-500">downloaded_at (yyyy-MM-dd HH:mm:ss)</div>
                  </div>
                  <span className="text-emerald-700 font-bold">✓ Checked</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Device Serial No</div>
                    <div className="text-2xs font-mono text-slate-500">device_sn</div>
                  </div>
                  <span className="text-emerald-700 font-bold">✓ Checked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Data Export Step */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-sm text-emerald-400">Step 3: Transfer Historical Machine Data</div>
              <div className="text-slate-300 text-xs">
                In Realtime Cloud, go to <strong>"MANUAL DATA EXPORT IN PARALLEL DATABASE"</strong>, choose your <strong>From Date</strong> and <strong>To Date</strong>, and click the orange <strong>"Upload Data"</strong> button.
              </div>
            </div>
            <button
              onClick={() => setActiveTab('punches')}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shrink-0 shadow-xs"
            >
              View Ingested Punches ({rawPunches.length})
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: Raw Punch Logs */}
      {activeTab === 'punches' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filter Status:</span>
              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-md">
                {['ALL', 'PROCESSED', 'QUARANTINED'].map((st) => (
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

            <div className="text-2xs text-slate-500">
              Last Sync: {settings?.lastSyncAt || 'Never'} · Cursor: {settings?.syncCursor || 'None'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-3">Device Serial</th>
                  <th className="py-2.5 px-3">Employee Code</th>
                  <th className="py-2.5 px-3">Punch Datetime</th>
                  <th className="py-2.5 px-3">Punch Time</th>
                  <th className="py-2.5 px-3">Downloaded At</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Batch ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                {filteredPunches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-sans text-xs">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Radio className="h-5 w-5 text-emerald-600 animate-pulse" />
                        <span className="font-semibold text-slate-700">Waiting for live biometric punches</span>
                        <span className="text-2xs text-slate-400 font-mono">Punches from your Realtime terminal push directly to {webhookUrl}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPunches.map((punch) => (
                    <tr key={punch.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-slate-700 font-medium">{punch.deviceSn}</td>
                      <td className="py-2 px-3 text-slate-900 font-bold">{punch.employeeCode}</td>
                      <td className="py-2 px-3 text-slate-600">{punch.logDatetime}</td>
                      <td className="py-2 px-3 text-slate-600">{punch.logTime}</td>
                      <td className="py-2 px-3 text-slate-400">{punch.downloadedAt || '—'}</td>
                      <td className="py-2 px-3 font-sans">
                        <span
                          className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                            punch.status === 'PROCESSED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {punch.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]">{punch.syncBatchId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Quarantined Punches */}
      {activeTab === 'quarantine' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Quarantine Resolution Hub</h2>
          </div>

          {quarantinedPunches.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              All biometric records are cleanly mapped. No quarantined punches pending.
            </div>
          ) : (
            <div className="space-y-3">
              {quarantinedPunches.map((qp) => (
                <div
                  key={qp.id}
                  className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-950 font-mono text-sm">{qp.employeeCode}</span>
                      <span className="text-2xs text-amber-800 font-medium">Device: {qp.deviceSn}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-2xs text-slate-500 font-mono">{qp.logDatetime}</span>
                    </div>
                    <p className="text-2xs text-amber-800">{qp.quarantineReason}</p>
                  </div>

                  <button
                    onClick={() => {
                      setResolvingPunch(qp);
                      setSelectedEmployeeId(employees[0]?.id || '');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-md transition-colors shadow-2xs self-start sm:self-center"
                  >
                    Resolve & Map
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Resolution Modal */}
          {resolvingPunch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Map Punch to Active Employee
                </h3>
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                  <div>Badge Code: <strong>{resolvingPunch.employeeCode}</strong></div>
                  <div>Punch Time: {resolvingPunch.logDatetime}</div>
                  <div>Device SN: {resolvingPunch.deviceSn}</div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-medium text-slate-700">Select Siddhi Employee:</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.firstName} {emp.lastName} ({emp.departmentId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setResolvingPunch(null)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolveQuarantine}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
                  >
                    Confirm Mapping
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: API Connector Settings */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Realtime Biometric Device Connector Parameters</h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Connector Enabled</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">API Base URL</label>
              <input
                type="text"
                value={settings.apiBaseUrl}
                onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                placeholder="https://vendorapi.com or http://192.168.1.100:8080"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
              <p className="text-2xs text-slate-400">Physical terminal IP or vendor cloud gateway</p>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Attendance Endpoint</label>
              <input
                type="text"
                value={settings.endpoint}
                onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
                placeholder="/attendance"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">HTTP Method</label>
              <select
                value={settings.httpMethod}
                onChange={(e) => setSettings({ ...settings, httpMethod: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                <option value="POST">POST (JSON Payload)</option>
                <option value="GET">GET (Query Parameters)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Authentication Protocol</label>
              <select
                value={settings.authType}
                onChange={(e) => setSettings({ ...settings, authType: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              >
                <option value="BEARER">Bearer Token</option>
                <option value="BASIC">Basic Authentication (Username/Password)</option>
                <option value="API_KEY">API Key in Header</option>
                <option value="OAUTH2">OAuth 2.0 Client Credentials</option>
                <option value="NONE">No Authentication (Open LAN)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Auth Token / Credential (Stored Securely)</label>
              <input
                type="text"
                value={settings.authCredentials?.token || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    authCredentials: { ...settings.authCredentials, token: e.target.value },
                  })
                }
                placeholder="Bearer token or API secret key"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Polling Interval & Timeout</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={settings.pollingIntervalMinutes}
                  onChange={(e) => setSettings({ ...settings, pollingIntervalMinutes: Number(e.target.value) })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  placeholder="Minutes (15)"
                />
                <input
                  type="number"
                  value={settings.requestTimeoutSeconds}
                  onChange={(e) => setSettings({ ...settings, requestTimeoutSeconds: Number(e.target.value) })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  placeholder="Timeout s (30)"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-medium text-slate-700">Request Body Template (JSON)</label>
            <textarea
              rows={4}
              value={settings.requestBodyTemplate}
              onChange={(e) => setSettings({ ...settings, requestBodyTemplate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono bg-slate-50"
            />
            <p className="text-2xs text-slate-400">Tokens available: {'{{START_TIME}}'}, {'{{END_TIME}}'}, {'{{DEVICE_SN}}'}</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Save Connector Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: CSV Offline Fallback */}
      {activeTab === 'csv' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Offline CSV Biometric Fallback</h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700">Paste CSV Contents:</label>
              <button
                onClick={() => setCsvContent('employee_code,log_datetime,log_time,device_sn\n')}
                className="text-2xs text-slate-600 hover:text-slate-900 underline"
              >
                Insert CSV Header
              </button>
            </div>
            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="employee_code,log_datetime,log_time,device_sn"
              className="w-full rounded-lg border border-slate-300 p-3 text-xs font-mono bg-slate-50"
            />
          </div>

          {csvFeedback && (
            <div className="p-3 rounded-lg bg-slate-100 text-xs text-slate-800 font-mono">
              {csvFeedback}
            </div>
          )}

          <button
            onClick={handleUploadCsv}
            disabled={!csvContent.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
          >
            Process & Import CSV Punches
          </button>
        </div>
      )}
    </div>
  );
};

function TerminalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
