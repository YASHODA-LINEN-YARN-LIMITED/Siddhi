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
  FileCode,
  Zap,
  Send,
  Link2,
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
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [pushingToSheet, setPushingToSheet] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'google_sheets' | 'punches' | 'settings' | 'quarantine' | 'csv'>('google_sheets');
  const [copiedGsScript, setCopiedGsScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedApiUrl, setCopiedApiUrl] = useState(false);

  // Live Server Webhook API URL for Biometric Device
  const webhookApiUrl = 'https://ais-dev-xprdmpkiap2xlvjmybcnti-854403608887.asia-east1.run.app/api/biometric/webhook';

  // User's Configured Google Apps Script Web App URL
  const userWebUrl = 'https://script.google.com/macros/s/AKfycbzTjkabJcvZ1oSYdZMT2nyhdMq0B_cg65BRuaNW1GxuDXJXiQbxVdpwqKzzvrSMKtBEoA/exec';
  const [googleWebAppUrl, setGoogleWebAppUrl] = useState<string>(userWebUrl);

  // Quarantine resolution modal state
  const [resolvingPunch, setResolvingPunch] = useState<RawBiometricPunch | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // CSV Fallback state
  const [csvContent, setCsvContent] = useState<string>('');
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  const appsScriptCode = `/**
 * SIDDHI HRMS & REALTIME BIOMETRIC GOOGLE APPS SCRIPT (Code.gs)
 * Webhook API URL: ${webhookApiUrl}
 */

// 1. Automatically adds a custom menu in Google Sheets when opened!
function onOpen() {
  setupAutoSheets();
  SpreadsheetApp.getUi()
    .createMenu('🚀 Siddhi HRMS')
    .addItem('1. Initialize All Sheets & Headers', 'setupAutoSheets')
    .addItem('2. Pull Live Biometric Punches Now', 'pullBiometricDeviceDataToSheet')
    .addItem('3. Enable 30-Min Auto Sync Trigger', 'create30MinSyncTrigger')
    .addToUi();
}

// 2. Creates all 4 sheets automatically with colored headers
function setupAutoSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: Raw_Punches
  let punchSheet = ss.getSheetByName('Raw_Punches');
  if (!punchSheet) {
    punchSheet = ss.insertSheet('Raw_Punches');
  }
  if (punchSheet.getLastRow() === 0) {
    punchSheet.appendRow([
      'Punch_ID', 'Employee_Code', 'Employee_Name', 'Log_Datetime', 
      'Log_Date', 'Log_Time', 'Device_Serial', 'Downloaded_At', 'Status', 'Received_At'
    ]);
    punchSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#E8F5E9');
  }

  // Sheet 2: Employees
  let empSheet = ss.getSheetByName('Employees');
  if (!empSheet) {
    empSheet = ss.insertSheet('Employees');
  }
  if (empSheet.getLastRow() === 0) {
    empSheet.appendRow([
      'Employee_Code', 'First_Name', 'Last_Name', 'Department', 'Designation', 'Status'
    ]);
    empSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#E3F2FD');
  }

  // Sheet 3: Daily_Attendance
  let attSheet = ss.getSheetByName('Daily_Attendance');
  if (!attSheet) {
    attSheet = ss.insertSheet('Daily_Attendance');
  }
  if (attSheet.getLastRow() === 0) {
    attSheet.appendRow([
      'Date', 'Employee_Code', 'Employee_Name', 'First_In', 'Last_Out', 'Work_Hours', 'Status'
    ]);
    attSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#FFF8E1');
  }

  // Sheet 4: Sync_Logs
  let logSheet = ss.getSheetByName('Sync_Logs');
  if (!logSheet) {
    logSheet = ss.insertSheet('Sync_Logs');
  }
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(['Timestamp', 'Punches_Received', 'Status', 'Response_Details']);
    logSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#F3E5F5');
  }
}

// 3. Pulls live punches from Siddhi HRMS API and writes to Google Sheet
function pullBiometricDeviceDataToSheet() {
  setupAutoSheets();
  const webhookUrl = '${webhookApiUrl}';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const punchSheet = ss.getSheetByName('Raw_Punches');
  const ui = (typeof SpreadsheetApp.getUi === 'function') ? SpreadsheetApp.getUi() : null;

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'get',
      headers: { 'Accept': 'application/json' },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    if (statusCode === 200) {
      const text = response.getContentText();
      let punches = [];
      try {
        punches = JSON.parse(text);
      } catch (e) {}

      if (Array.isArray(punches) && punches.length > 0) {
        const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
        for (let i = 0; i < punches.length; i++) {
          const p = punches[i];
          punchSheet.appendRow([
            'P-' + Date.now() + '-' + i,
            p.employee_code || p.emp_code || '',
            p.employee_name || '',
            p.log_datetime || '',
            p.log_date || '',
            p.log_time || '',
            p.device_sn || 'REALTIME-DEVICE',
            p.downloaded_at || nowStr,
            p.status || 'PROCESSED',
            nowStr
          ]);
        }
        if (ui) ui.alert('Success: Fetched & added ' + punches.length + ' biometric punch(es) to Google Sheet!');
      } else {
        if (ui) ui.alert('Connected to Siddhi HRMS API successfully! No punches pending.');
      }
    } else {
      if (ui) ui.alert('API Response Error: Status code ' + statusCode);
    }
  } catch (err) {
    if (ui) ui.alert('Error pulling data: ' + err.toString());
  }
}

// 4. Receives direct POST payloads from Biometric Hardware or HRMS
function doPost(e) {
  try {
    setupAutoSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const punchSheet = ss.getSheetByName('Raw_Punches');
    
    let contents = [];
    if (e && e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      contents = Array.isArray(data) ? data : [data];
    }

    const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    let addedCount = 0;

    for (let i = 0; i < contents.length; i++) {
      const p = contents[i];
      const empCode = String(p.employee_code || p.emp_code || p.UserId || '').trim();
      if (!empCode) continue;

      const empName = String(p.employee_name || p.UserName || '').trim();
      const logDt = String(p.log_datetime || p.LogDateTime || nowStr).trim();
      const logDate = String(p.log_date || logDt.split(' ')[0] || '').trim();
      const logTime = String(p.log_time || logDt.split(' ')[1] || '').trim();
      const deviceSn = String(p.device_sn || p.DeviceSN || 'REALTIME-DEVICE').trim();
      const downloadedAt = String(p.downloaded_at || nowStr).trim();
      const punchId = 'P-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      punchSheet.appendRow([
        punchId, empCode, empName, logDt, logDate, logTime, deviceSn, downloadedAt, 'PROCESSED', nowStr
      ]);
      addedCount++;
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'SUCCESS',
      code: 200,
      message: 'Ingested ' + addedCount + ' punch(es) into Google Sheet',
      receivedAt: nowStr
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      code: 500,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 5. Handles GET requests
function doGet(e) {
  setupAutoSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const punchSheet = ss.getSheetByName('Raw_Punches');
  const data = punchSheet.getDataRange().getValues();

  const punches = [];
  for (let r = 1; r < data.length; r++) {
    punches.push({
      employee_code: String(data[r][1]),
      employee_name: String(data[r][2]),
      log_datetime: String(data[r][3]),
      log_date: String(data[r][4]),
      log_time: String(data[r][5]),
      device_sn: String(data[r][6]),
      downloaded_at: String(data[r][7]),
      status: String(data[r][8])
    });
  }

  return ContentService.createTextOutput(JSON.stringify(punches))
    .setMimeType(ContentService.MimeType.JSON);
}

// 6. Configures recurring 30-minute auto sync trigger
function create30MinSyncTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'pullBiometricDeviceDataToSheet') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('pullBiometricDeviceDataToSheet')
    .timeBased()
    .everyMinutes(30)
    .create();
  
  const ui = (typeof SpreadsheetApp.getUi === 'function') ? SpreadsheetApp.getUi() : null;
  if (ui) ui.alert('30-Minute Auto Sync Trigger created! Google Sheet will pull punches automatically every 30 minutes.');
}`;

  const handleCopyGsScript = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appsScriptCode);
      setCopiedGsScript(true);
      notify('Code.gs Google Apps Script copied to clipboard!', 'success');
      setTimeout(() => setCopiedGsScript(false), 3000);
    }
  };

  const handleCopyWebUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(googleWebAppUrl);
      setCopiedUrl(true);
      notify('Google Apps Script Web App URL copied!', 'success');
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  const handleCopyApiUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(webhookApiUrl);
      setCopiedApiUrl(true);
      notify('Biometric Device Webhook API URL copied!', 'success');
      setTimeout(() => setCopiedApiUrl(false), 3000);
    }
  };

  const handleSyncGoogleSheet = async () => {
    if (!googleWebAppUrl.trim()) {
      notify('Please enter your Google Apps Script Web App URL', 'error');
      return;
    }
    try {
      setSyncingSheet(true);
      const res = await api.syncGoogleSheet({ webAppUrl: googleWebAppUrl });
      notify(res.message, 'success');
      await loadData();
      setActiveTab('punches');
    } catch (err: any) {
      notify(`Google Sheet sync failed: ${err.message}`, 'error');
    } finally {
      setSyncingSheet(false);
    }
  };

  const handlePushToGoogleSheet = async () => {
    if (!googleWebAppUrl.trim()) {
      notify('Please enter your Google Apps Script Web App URL', 'error');
      return;
    }
    try {
      setPushingToSheet(true);
      const res = await api.pushToGoogleSheet({ webAppUrl: googleWebAppUrl });
      notify(res.message, 'success');
      await loadData();
    } catch (err: any) {
      notify(`Push to Google Sheet failed: ${err.message}`, 'error');
    } finally {
      setPushingToSheet(false);
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
      const res = await api.syncGoogleSheet({ webAppUrl: googleWebAppUrl });
      setTestResult({
        success: true,
        testedAt: new Date().toISOString(),
        message: `Successfully connected to Google Apps Script Web App! ${res.punchesCount || 0} punch(es) checked.`,
      });
      notify('Google Apps Script connection verified!', 'success');
    } catch (e: any) {
      setTestResult({ success: false, message: `Connection test failed: ${e.message}`, testedAt: new Date().toISOString() });
      notify(`Connection failed: ${e.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await api.syncGoogleSheet({ webAppUrl: googleWebAppUrl });
      setSyncResult(res);
      notify(res.message, 'success');
      await loadData();
    } catch (e: any) {
      setSyncResult({ success: false, message: e.message });
      notify(`Sync failed: ${e.message}`, 'error');
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

  const [simulatingPunch, setSimulatingPunch] = useState(false);

  const handleSimulatePunch = async () => {
    try {
      setSimulatingPunch(true);
      const res = await api.simulateMachinePunch({
        employeeCode: employees[0]?.employeeCode || '1001',
        deviceSn: 'REALTIME-T502-01',
      });
      notify(res.message, 'success');
      await loadData();
    } catch (err: any) {
      notify(`Machine punch simulation failed: ${err.message}`, 'error');
    } finally {
      setSimulatingPunch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Biometric Attendance Integration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Biometric Device Webhook API & Google Sheets Automated Sync Connector
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulatePunch}
            disabled={simulatingPunch}
            className="px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Zap className={`h-4 w-4 text-amber-700 ${simulatingPunch ? 'animate-spin' : ''}`} />
            <span>{simulatingPunch ? 'Sending Punch...' : 'Send Live Test Punch to Google Sheet'}</span>
          </button>

          <button
            onClick={handlePushToGoogleSheet}
            disabled={pushingToSheet}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Send className={`h-4 w-4 text-emerald-700 ${pushingToSheet ? 'animate-spin' : ''}`} />
            <span>{pushingToSheet ? 'Populating...' : 'Populate Google Sheet Tabs'}</span>
          </button>

          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-200 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Google Sheet Now'}</span>
          </button>
        </div>
      </div>

      {/* Webhook API Banner */}
      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-2xs text-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-emerald-600" />
            <span>Biometric Device Webhook API Endpoint:</span>
          </div>
          <button
            onClick={handleCopyApiUrl}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-2xs"
          >
            {copiedApiUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedApiUrl ? 'Copied Webhook API' : 'Copy Webhook API URL'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={webhookApiUrl}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 select-all"
          />
        </div>
        <p className="text-2xs text-slate-500">
          Paste this URL into your <strong>Biometric Device / Realtime Cloud Third-Party API URL</strong> setting. Device punches push directly to this API, and Code.gs pulls them into your Google Sheet!
        </p>
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-950 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Google Sheet Sync Completed</span>
          </div>
          <p className="text-2xs text-emerald-800">{syncResult.message}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('google_sheets')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'google_sheets' ? 'bg-emerald-800 text-white shadow-xs' : 'text-emerald-900 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100'
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-300" />
          <span>Google Sheets & Apps Script Connector</span>
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

      {/* TAB: Google Sheets & Apps Script Connector */}
      {activeTab === 'google_sheets' && (
        <div className="space-y-6">
          {/* Card 1: Active Web App URL & Automatic Data Population */}
          <div className="bg-white border-2 border-emerald-600/40 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <span>Google Apps Script Web App Endpoint</span>
                </h2>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Biometric devices push to your Webhook API URL, and Code.gs pulls live punches directly into your Google Sheet.
                </p>
              </div>
              <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase shrink-0">
                Active Integration Endpoint
              </span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-800">Your Google Apps Script Web App URL:</label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  type="text"
                  value={googleWebAppUrl}
                  onChange={(e) => setGoogleWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 select-all"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyWebUrl}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    {copiedUrl ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>

                  <button
                    onClick={handlePushToGoogleSheet}
                    disabled={pushingToSheet || !googleWebAppUrl.trim()}
                    className="px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs justify-center"
                  >
                    <Send className={`h-4 w-4 text-emerald-700 ${pushingToSheet ? 'animate-spin' : ''}`} />
                    <span>{pushingToSheet ? 'Populating...' : 'Populate Google Sheet Tabs Now'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Callout */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs space-y-2.5">
              <div className="font-bold text-emerald-900 flex items-center gap-2 text-xs">
                <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>3 Ways Machine Punches Reach Your Google Sheet:</span>
              </div>
              <ul className="text-2xs text-emerald-800 space-y-1.5 leading-relaxed list-disc pl-4">
                <li>
                  <strong>Realtime Machine Auto-Forward:</strong> When your biometric terminal pushes to <code className="bg-white px-1 py-0.5 rounded font-mono font-bold text-slate-900">{webhookApiUrl}</code>, HRMS automatically forwards the punch to your Google Sheet in real time.
                </li>
                <li>
                  <strong>Direct Button in HRMS:</strong> Click <strong className="bg-white px-1.5 py-0.5 rounded font-bold text-slate-900">Send Live Test Punch to Google Sheet</strong> or <strong className="bg-white px-1.5 py-0.5 rounded font-bold text-slate-900">Populate Google Sheet Tabs Now</strong> above to send sample & live punches instantly into your sheet!
                </li>
                <li>
                  <strong>Google Sheets Custom Menu:</strong> Open your Google Sheet and click top menu <strong className="bg-white px-1.5 py-0.5 rounded font-bold text-slate-900">🚀 Siddhi HRMS &gt; 2. Pull Live Biometric Punches Now</strong> or <strong className="bg-white px-1.5 py-0.5 rounded font-bold text-slate-900">3. Enable 30-Min Auto Sync Trigger</strong>.
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Code.gs Script Generator */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-sm space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  <span>Google Apps Script Code (`Code.gs`)</span>
                </div>
                <p className="text-2xs text-slate-400 mt-0.5">
                  Your Google Apps Script automatically pulls from Webhook API URL and populates all 4 Google Sheet tabs.
                </p>
              </div>
              <button
                onClick={handleCopyGsScript}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
              >
                {copiedGsScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedGsScript ? 'Copied Code.gs!' : 'Copy Code.gs Script'}</span>
              </button>
            </div>

            <pre className="text-2xs font-mono bg-black/70 p-4 rounded-lg overflow-x-auto text-emerald-300 border border-slate-800 max-h-[260px] leading-relaxed select-all">
              {appsScriptCode}
            </pre>
          </div>

          {/* Card 3: Direct Navigation */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-sm text-emerald-400">View Synced Biometric Records</div>
              <div className="text-slate-300 text-xs">
                All punches received from your Google Sheet Web App are processed and logged in real-time under Raw Punch History.
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

            <div className="flex items-center gap-2">
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
                        <FileSpreadsheet className="h-6 w-6 text-emerald-600 animate-pulse" />
                        <span className="font-semibold text-slate-700">Waiting for Google Sheet biometric punches</span>
                        <span className="text-2xs text-slate-400 font-mono">Click "Sync Sheet Now" above to pull punches directly from your Google Sheet</span>
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
