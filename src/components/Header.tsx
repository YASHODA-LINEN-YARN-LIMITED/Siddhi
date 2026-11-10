import React, { useState } from 'react';
import {
  Search,
  Bell,
  LogOut,
  LayoutDashboard,
  Monitor,
  FileText,
  Settings,
  Download,
  BarChart3,
  CreditCard,
  Lock,
  UserCheck,
  Building2,
  GitBranch,
  Users,
  Briefcase,
  Clock,
  Calendar,
  Umbrella,
  UserPlus,
  FileSpreadsheet,
  Send,
  RefreshCw,
  Layers,
  MapPin,
  Sliders,
  Database,
  MessageSquare,
  ShieldAlert,
  ChevronDown,
  Globe,
  SlidersHorizontal
} from 'lucide-react';
import type { NavTab } from './Sidebar.tsx';
import type { Role } from '../types.ts';

interface HeaderProps {
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    email: string;
    role: Role;
    departmentId: string;
    branchId: string;
  };
  availableRoles: { role: Role; label: string; empId: string }[];
  onRoleSwitch: (employeeId: string) => void;
  activeBranchName: string;
  onWebPunchSuccess: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  availableRoles,
  onRoleSwitch,
  activeTab,
  onSelectTab,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const handleMenuClick = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleSubItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    setOpenMenu(null);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-2xs z-40 select-none">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-slate-100 bg-white gap-3">
        {/* Left: Brand Logo & License Badge */}
        <div className="flex items-center gap-4">
          {/* Siddhi Brand Logo */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-1.5 cursor-pointer group"
          >
            <div className="flex flex-col items-start leading-none">
              <div className="flex items-center gap-1 font-black tracking-tight text-xl">
                <span className="text-orange-500 font-extrabold font-sans">SIDDHI</span>
              </div>
              <span className="text-[9px] font-semibold text-slate-500 tracking-wider uppercase -mt-0.5">
                Power of Biometrics
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Search, Notifications, User Persona Switcher */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative w-48 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, machine, log..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
            <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button className="relative p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                0
              </span>
            </button>
          </div>

          {/* User Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs transition-colors"
              title="Switch Persona / Log Out"
            >
              <LogOut className="h-4 w-4 text-slate-600" />
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs">
                <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 px-2 mb-1">
                  Switch Siddhi User Persona
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {availableRoles.map((r) => (
                    <button
                      key={r.empId}
                      onClick={() => {
                        onRoleSwitch(r.empId);
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                        currentUser.employeeId === r.empId
                          ? 'bg-orange-500 text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Horizontal Navigation Menu Bar (All 9 Workable Menus) */}
      <nav className="flex items-center gap-0.5 bg-slate-100 border-t border-slate-200 px-3 overflow-x-auto text-xs font-semibold text-slate-700">
        {/* 1. Dashboard */}
        <button
          onClick={() => handleSubItemClick('dashboard')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-orange-500 text-white border-orange-600 shadow-2xs font-bold'
              : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
          }`}
        >
          <LayoutDashboard className={`h-4 w-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-orange-500'}`} />
          <span>Dashboard</span>
        </button>

        {/* 2. Device Setup */}
        <div className="relative group">
          <button
            onClick={() => handleMenuClick('device_setup')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'biometric'
                ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
            }`}
          >
            <Monitor className="h-4 w-4 text-slate-600" />
            <span>Device Setup</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {openMenu === 'device_setup' && (
            <div className="absolute left-0 mt-0 w-56 bg-white border border-slate-200 rounded-b-lg shadow-xl py-1.5 z-50 font-normal">
              <button
                onClick={() => handleSubItemClick('biometric')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-orange-500" />
                <span>Add Edit Machine</span>
              </button>
              <button
                onClick={() => handleSubItemClick('biometric')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Monitor className="h-3.5 w-3.5 text-orange-500" />
                <span>Hardware Setup</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. File */}
        <div className="relative group">
          <button
            onClick={() => handleMenuClick('file')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
              ['organization', 'employees', 'leave', 'onboarding'].includes(activeTab)
                ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
            }`}
          >
            <FileText className="h-4 w-4 text-slate-600" />
            <span>File</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 mt-0 w-56 bg-white border border-slate-200 rounded-b-lg shadow-xl py-1.5 z-50 font-normal">
              <button
                onClick={() => handleSubItemClick('organization')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Building2 className="h-3.5 w-3.5 text-orange-500" />
                <span>Company</span>
              </button>
              <button
                onClick={() => handleSubItemClick('organization')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <GitBranch className="h-3.5 w-3.5 text-orange-500" />
                <span>Branch</span>
              </button>
              <button
                onClick={() => handleSubItemClick('organization')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Users className="h-3.5 w-3.5 text-orange-500" />
                <span>Department</span>
              </button>
              <button
                onClick={() => handleSubItemClick('organization')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Briefcase className="h-3.5 w-3.5 text-orange-500" />
                <span>Designation</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                <span>Office Time Policy</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>Shift Details</span>
              </button>
              <button
                onClick={() => handleSubItemClick('employees')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Users className="h-3.5 w-3.5 text-orange-500" />
                <span>Employee List</span>
              </button>
              <button
                onClick={() => handleSubItemClick('leave')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Umbrella className="h-3.5 w-3.5 text-orange-500" />
                <span>Define Leave</span>
              </button>
              <button
                onClick={() => handleSubItemClick('organization')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>Define Holiday</span>
              </button>
              <button
                onClick={() => handleSubItemClick('onboarding')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <UserPlus className="h-3.5 w-3.5 text-orange-500" />
                <span>Employee Rejoining</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. Transaction */}
        <div className="relative group">
          <button
            onClick={() => handleMenuClick('transaction')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
            }`}
          >
            <Settings className="h-4 w-4 text-slate-600" />
            <span>Transaction</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {openMenu === 'transaction' && (
            <div className="absolute left-0 mt-0 w-60 bg-white border border-slate-200 rounded-b-lg shadow-xl py-1.5 z-50 font-normal">
              <button
                onClick={() => handleSubItemClick('leave')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-orange-500" />
                <span>Leave Opening Entry</span>
              </button>
              <button
                onClick={() => handleSubItemClick('leave')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Send className="h-3.5 w-3.5 text-orange-500" />
                <span>Leave Application</span>
              </button>
              <button
                onClick={() => handleSubItemClick('leave')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <UserCheck className="h-3.5 w-3.5 text-orange-500" />
                <span>Leave Approval</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <RefreshCw className="h-3.5 w-3.5 text-orange-500" />
                <span>Shift Change</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>Generate Shift</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Layers className="h-3.5 w-3.5 text-orange-500" />
                <span>Shift Roaster</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                <span>Manual Punch</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-orange-500" />
                <span>Bulk Manual Punch</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                <span>Approval GPS Punch</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <UserCheck className="h-3.5 w-3.5 text-orange-500" />
                <span>Approval Manual Punch</span>
              </button>
              <button
                onClick={() => handleSubItemClick('attendance')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Sliders className="h-3.5 w-3.5 text-orange-500" />
                <span>Attendance Process</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Data Download */}
        <div className="relative group">
          <button
            onClick={() => handleMenuClick('data_download')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'biometric'
                ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
            }`}
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Data Download</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {openMenu === 'data_download' && (
            <div className="absolute left-0 mt-0 w-60 bg-white border border-slate-200 rounded-b-lg shadow-xl py-1.5 z-50 font-normal">
              <button
                onClick={() => handleSubItemClick('biometric')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Download className="h-3.5 w-3.5 text-orange-500" />
                <span>Download Logs from Device</span>
              </button>
              <button
                onClick={() => handleSubItemClick('biometric')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <FileText className="h-3.5 w-3.5 text-orange-500" />
                <span>Upload AGL File</span>
              </button>
              <button
                onClick={() => handleSubItemClick('biometric')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Globe className="h-3.5 w-3.5 text-orange-500" />
                <span>Third-party API Integration</span>
              </button>
            </div>
          )}
        </div>

        {/* 6. Reports */}
        <div className="relative group">
          <button
            onClick={() => handleMenuClick('reports')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'reports'
                ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
            }`}
          >
            <BarChart3 className="h-4 w-4 text-slate-600" />
            <span>Reports</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {openMenu === 'reports' && (
            <div className="absolute left-0 mt-0 w-60 bg-white border border-slate-200 rounded-b-lg shadow-xl py-1.5 z-50 font-normal">
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <FileText className="h-3.5 w-3.5 text-orange-500" />
                <span>Master Report</span>
              </button>
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>Daily Report</span>
              </button>
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <BarChart3 className="h-3.5 w-3.5 text-orange-500" />
                <span>Monthly Report</span>
              </button>
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                <span>Old Version Monthly</span>
              </button>
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>Yearly Report</span>
              </button>
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                <span>GPS Report</span>
              </button>
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Monitor className="h-3.5 w-3.5 text-orange-500" />
                <span>Desk Attendance Report</span>
              </button>
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Users className="h-3.5 w-3.5 text-orange-500" />
                <span>Staff Log Report With Photo</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. PayRoll */}
        <div className="relative group">
          <button
            onClick={() => handleMenuClick('payroll')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
              ['payroll', 'expenses'].includes(activeTab)
                ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
            }`}
          >
            <CreditCard className="h-4 w-4 text-slate-600" />
            <span>PayRoll</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {openMenu === 'payroll' && (
            <div className="absolute left-0 mt-0 w-56 bg-white border border-slate-200 rounded-b-lg shadow-xl py-1.5 z-50 font-normal">
              <button
                onClick={() => handleSubItemClick('expenses')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <CreditCard className="h-3.5 w-3.5 text-orange-500" />
                <span>Loan/Advance</span>
              </button>
              <button
                onClick={() => handleSubItemClick('payroll')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <CreditCard className="h-3.5 w-3.5 text-orange-500" />
                <span>Bonus Payroll</span>
              </button>
              <button
                onClick={() => handleSubItemClick('expenses')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <FileText className="h-3.5 w-3.5 text-orange-500" />
                <span>Conveyance Approval</span>
              </button>
              <button
                onClick={() => handleSubItemClick('payroll')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Sliders className="h-3.5 w-3.5 text-orange-500" />
                <span>Monthly Pay Process</span>
              </button>
              <button
                onClick={() => handleSubItemClick('payroll')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <BarChart3 className="h-3.5 w-3.5 text-orange-500" />
                <span>Salary Report</span>
              </button>
            </div>
          )}
        </div>

        {/* 8. Access Control */}
        <div className="relative group">
          <button
            onClick={() => handleMenuClick('access_control')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'reports'
                ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
            }`}
          >
            <Lock className="h-4 w-4 text-slate-600" />
            <span>Access Control</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {openMenu === 'access_control' && (
            <div className="absolute left-0 mt-0 w-52 bg-white border border-slate-200 rounded-b-lg shadow-xl py-1.5 z-50 font-normal">
              <button
                onClick={() => handleSubItemClick('reports')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Lock className="h-3.5 w-3.5 text-orange-500" />
                <span>Daily Access Report</span>
              </button>
            </div>
          )}
        </div>

        {/* 9. Admin */}
        <div className="relative group">
          <button
            onClick={() => handleMenuClick('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'admin'
                ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
            }`}
          >
            <UserCheck className="h-4 w-4 text-slate-600" />
            <span>Admin</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {openMenu === 'admin' && (
            <div className="absolute left-0 mt-0 w-52 bg-white border border-slate-200 rounded-b-lg shadow-xl py-1.5 z-50 font-normal">
              <button
                onClick={() => handleSubItemClick('admin')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Users className="h-3.5 w-3.5 text-orange-500" />
                <span>User Manager</span>
              </button>
              <button
                onClick={() => handleSubItemClick('admin')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Lock className="h-3.5 w-3.5 text-orange-500" />
                <span>Change Password</span>
              </button>
              <button
                onClick={() => handleSubItemClick('admin')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                <span>Add Notification</span>
              </button>
              <button
                onClick={() => handleSubItemClick('admin')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                <span>SMS Setting</span>
              </button>
              <button
                onClick={() => handleSubItemClick('admin')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
                <span>View Error Logs</span>
              </button>
              <button
                onClick={() => handleSubItemClick('admin')}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Database className="h-3.5 w-3.5 text-orange-500" />
                <span>Update Database</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
