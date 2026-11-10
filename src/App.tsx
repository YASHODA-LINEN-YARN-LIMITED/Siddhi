/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from './api.ts';
import type { Role, Company, Branch } from './types.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { OrganizationView } from './views/OrganizationView.tsx';
import { EmployeesView } from './views/EmployeesView.tsx';
import { OnboardingView } from './views/OnboardingView.tsx';
import { AttendanceView } from './views/AttendanceView.tsx';
import { BiometricView } from './views/BiometricView.tsx';
import { LeaveView } from './views/LeaveView.tsx';
import { PayrollView } from './views/PayrollView.tsx';
import { RecruitmentView } from './views/RecruitmentView.tsx';
import { PerformanceView } from './views/PerformanceView.tsx';
import { ExpensesAssetsView } from './views/ExpensesAssetsView.tsx';
import { HelpdeskView } from './views/HelpdeskView.tsx';
import { AlumniView } from './views/AlumniView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { AdminSettingsView } from './views/AdminSettingsView.tsx';
import { KekaMeView } from './views/KekaMeView.tsx';
import { KekaTeamView } from './views/KekaTeamView.tsx';
import { KekaEngageView } from './views/KekaEngageView.tsx';
import { KekaOrgChartView } from './views/KekaOrgChartView.tsx';
import { Menu, X, ShieldAlert } from 'lucide-react';
import { ToastContainer } from './components/ToastContainer.tsx';
import { notify } from './utils/notify.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{
    employeeId: string;
    employeeCode: string;
    name: string;
    email: string;
    role: Role;
    departmentId: string;
    branchId: string;
  } | null>(null);

  const [availableRoles, setAvailableRoles] = useState<{ role: Role; label: string; empId: string }[]>([]);
  const [isFirstRunCompleted, setIsFirstRunCompleted] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeBranchName, setActiveBranchName] = useState<string>('Bengaluru Headquarters');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // First-run setup modal state
  const [showFirstRunModal, setShowFirstRunModal] = useState(false);
  const [firstRunForm, setFirstRunForm] = useState({
    organizationName: 'Siddhi Organization',
    legalName: 'Siddhi Organization',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    adminName: 'System Administrator',
    adminEmail: 'admin@siddhi-hrms.local',
  });

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      setLoading(true);
      const authData = await api.getCurrentUser();
      setCurrentUser(authData.user);
      setAvailableRoles(authData.availableRoles);
      setIsFirstRunCompleted(authData.isFirstRunCompleted);

      if (!authData.isFirstRunCompleted) {
        setShowFirstRunModal(true);
      }

      const orgData = await api.getOrganization();
      if (orgData.branches[0]) {
        setActiveBranchName(orgData.branches[0].name);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
      setCurrentUser({
        employeeId: 'admin-01',
        employeeCode: 'ADMIN',
        name: 'System Administrator',
        email: 'admin@siddhi-hrms.local',
        role: 'ADMIN',
        departmentId: 'dept-gen',
        branchId: 'br-blr',
      });
      setAvailableRoles([
        { role: 'ADMIN', label: 'System Administrator', empId: 'admin-01' },
      ]);
      setIsFirstRunCompleted(true);
      setActiveBranchName('Main Organization Branch');
    } finally {
      setLoading(false);
    }


  };

  const handleRoleSwitch = async (empId: string) => {
    try {
      await api.switchUser(empId);
      await loadSession();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFirstRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.firstRunSetup(firstRunForm);
      setShowFirstRunModal(false);
      setIsFirstRunCompleted(true);
      notify('Organization initialized successfully', 'success');
      loadSession();
    } catch (err: any) {
      notify(`Setup error: ${err.message}`, 'error');
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400" />
          <div className="text-sm font-semibold tracking-wider font-mono">INITIALIZING SIDDHI HRMS...</div>
          <div className="text-2xs text-slate-400">Loading self-hosted relational database</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        availableRoles={availableRoles}
        onRoleSwitch={handleRoleSwitch}
        activeBranchName={activeBranchName}
        onWebPunchSuccess={loadSession}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Area: Scrollable View (No Sidebar) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Scrollable View Container - Full Width */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100 w-full">
          <div className="w-full max-w-[1600px] mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                userRole={currentUser.role}
                currentUser={currentUser}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'me' && (
              <KekaMeView currentUser={currentUser} onWebPunchSuccess={loadSession} />
            )}
            {activeTab === 'team' && (
              <KekaTeamView currentUser={currentUser} />
            )}
            {activeTab === 'engage' && (
              <KekaEngageView currentUser={currentUser} />
            )}
            {activeTab === 'orgchart' && (
              <KekaOrgChartView />
            )}
            {activeTab === 'organization' && <OrganizationView />}
            {activeTab === 'employees' && <EmployeesView userRole={currentUser.role} />}
            {activeTab === 'onboarding' && (
              <OnboardingView userRole={currentUser.role} currentUser={currentUser} />
            )}
            {activeTab === 'attendance' && (
              <AttendanceView userRole={currentUser.role} currentUser={currentUser} />
            )}
            {activeTab === 'biometric' && <BiometricView />}
            {activeTab === 'leave' && (
              <LeaveView userRole={currentUser.role} currentUser={currentUser} />
            )}
            {activeTab === 'payroll' && (
              <PayrollView userRole={currentUser.role} currentUser={currentUser} />
            )}
            {activeTab === 'recruitment' && <RecruitmentView userRole={currentUser.role} />}
            {activeTab === 'performance' && (
              <PerformanceView userRole={currentUser.role} currentUser={currentUser} />
            )}
            {activeTab === 'expenses' && (
              <ExpensesAssetsView userRole={currentUser.role} currentUser={currentUser} />
            )}
            {activeTab === 'helpdesk' && (
              <HelpdeskView userRole={currentUser.role} currentUser={currentUser} />
            )}
            {activeTab === 'alumni' && <AlumniView userRole={currentUser.role} />}
            {activeTab === 'reports' && <ReportsView userRole={currentUser.role} />}
            {activeTab === 'admin' && <AdminSettingsView userRole={currentUser.role} />}
          </div>
        </main>
      </div>

      {/* First-Run Setup Wizard Modal */}
      {showFirstRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleFirstRunSubmit}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Organization Setup
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Organization Name</label>
                <input
                  required
                  type="text"
                  value={firstRunForm.organizationName}
                  onChange={(e) => setFirstRunForm({ ...firstRunForm, organizationName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Legal Entity Name</label>
                <input
                  required
                  type="text"
                  value={firstRunForm.legalName}
                  onChange={(e) => setFirstRunForm({ ...firstRunForm, legalName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Currency</label>
                  <select
                    value={firstRunForm.currency}
                    onChange={(e) => setFirstRunForm({ ...firstRunForm, currency: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs bg-slate-50"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Default Timezone</label>
                  <select
                    value={firstRunForm.timezone}
                    onChange={(e) => setFirstRunForm({ ...firstRunForm, timezone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs bg-slate-50"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Administrator Name</label>
                  <input
                    required
                    type="text"
                    value={firstRunForm.adminName}
                    onChange={(e) => setFirstRunForm({ ...firstRunForm, adminName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Administrator Email</label>
                  <input
                    required
                    type="email"
                    value={firstRunForm.adminEmail}
                    onChange={(e) => setFirstRunForm({ ...firstRunForm, adminEmail: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
            >
              Complete Setup & Initialize Roster
            </button>
          </form>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
