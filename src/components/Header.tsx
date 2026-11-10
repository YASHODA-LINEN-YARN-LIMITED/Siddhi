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

  const handleSubItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    setOpenMenu(null);
  };

  const getSubmenuItemsForCategory = (category: string) => {
    switch (category) {
      case 'device_setup':
        return [
          { label: 'Add Edit Machine', icon: SlidersHorizontal, tab: 'biometric' as NavTab },
          { label: 'Hardware Setup', icon: Monitor, tab: 'biometric' as NavTab },
        ];
      case 'file':
        return [
          { label: 'Company', icon: Building2, tab: 'organization' as NavTab },
          { label: 'Branch', icon: GitBranch, tab: 'organization' as NavTab },
          { label: 'Department', icon: Users, tab: 'organization' as NavTab },
          { label: 'Designation', icon: Briefcase, tab: 'organization' as NavTab },
          { label: 'Office Time Policy', icon: Clock, tab: 'attendance' as NavTab },
          { label: 'Shift Details', icon: Calendar, tab: 'attendance' as NavTab },
          { label: 'Employee List', icon: Users, tab: 'employees' as NavTab },
          { label: 'Define Leave', icon: Umbrella, tab: 'leave' as NavTab },
          { label: 'Define Holiday', icon: Calendar, tab: 'organization' as NavTab },
          { label: 'Employee Rejoining', icon: UserPlus, tab: 'onboarding' as NavTab },
        ];
      case 'transaction':
        return [
          { label: 'Leave Opening Entry', icon: FileSpreadsheet, tab: 'leave' as NavTab },
          { label: 'Leave Application', icon: Send, tab: 'leave' as NavTab },
          { label: 'Leave Approval', icon: UserCheck, tab: 'leave' as NavTab },
          { label: 'Shift Change', icon: RefreshCw, tab: 'attendance' as NavTab },
          { label: 'Generate Shift', icon: Calendar, tab: 'attendance' as NavTab },
          { label: 'Shift Roaster', icon: Layers, tab: 'attendance' as NavTab },
          { label: 'Manual Punch', icon: Clock, tab: 'attendance' as NavTab },
          { label: 'Bulk Manual Punch', icon: FileSpreadsheet, tab: 'attendance' as NavTab },
          { label: 'Approval GPS Punch', icon: MapPin, tab: 'attendance' as NavTab },
          { label: 'Approval Manual Punch', icon: UserCheck, tab: 'attendance' as NavTab },
          { label: 'Attendance Process', icon: Sliders, tab: 'attendance' as NavTab },
        ];
      case 'data_download':
        return [
          { label: 'Download Logs from Device', icon: Download, tab: 'biometric' as NavTab },
          { label: 'Upload AGL File', icon: FileText, tab: 'biometric' as NavTab },
          { label: 'Third-party API Integration', icon: Globe, tab: 'biometric' as NavTab },
        ];
      case 'reports':
        return [
          { label: 'Master Report', icon: FileText, tab: 'reports' as NavTab },
          { label: 'Daily Report', icon: Calendar, tab: 'reports' as NavTab },
          { label: 'Monthly Report', icon: BarChart3, tab: 'reports' as NavTab },
          { label: 'Old Version Monthly', icon: Clock, tab: 'reports' as NavTab },
          { label: 'Yearly Report', icon: Calendar, tab: 'reports' as NavTab },
          { label: 'GPS Report', icon: MapPin, tab: 'reports' as NavTab },
          { label: 'Desk Attendance Report', icon: Monitor, tab: 'reports' as NavTab },
          { label: 'Staff Log Report With Photo', icon: Users, tab: 'reports' as NavTab },
        ];
      case 'payroll':
        return [
          { label: 'Loan/Advance', icon: CreditCard, tab: 'expenses' as NavTab },
          { label: 'Bonus Payroll', icon: CreditCard, tab: 'payroll' as NavTab },
          { label: 'Conveyance Approval', icon: FileText, tab: 'expenses' as NavTab },
          { label: 'Monthly Pay Process', icon: Sliders, tab: 'payroll' as NavTab },
          { label: 'Salary Report', icon: BarChart3, tab: 'payroll' as NavTab },
        ];
      case 'access_control':
        return [
          { label: 'Daily Access Report', icon: Lock, tab: 'reports' as NavTab },
        ];
      case 'admin':
        return [
          { label: 'User Manager', icon: Users, tab: 'admin' as NavTab },
          { label: 'Change Password', icon: Lock, tab: 'admin' as NavTab },
          { label: 'Add Notification', icon: MessageSquare, tab: 'admin' as NavTab },
          { label: 'SMS Setting', icon: MessageSquare, tab: 'admin' as NavTab },
          { label: 'View Error Logs', icon: ShieldAlert, tab: 'admin' as NavTab },
          { label: 'Update Database', icon: Database, tab: 'admin' as NavTab },
        ];
      default:
        return [];
    }
  };

  const activeCategory = openMenu || (
    activeTab === 'biometric' ? 'device_setup' :
    ['organization', 'employees', 'leave', 'onboarding'].includes(activeTab) ? 'file' :
    activeTab === 'attendance' ? 'transaction' :
    activeTab === 'reports' ? 'reports' :
    ['payroll', 'expenses'].includes(activeTab) ? 'payroll' :
    activeTab === 'admin' ? 'admin' : 'file'
  );

  const activeSubmenuList = getSubmenuItemsForCategory(activeCategory);

  const categories = [
    { key: 'device_setup', label: 'Device Setup', icon: Monitor, defaultTab: 'biometric' as NavTab },
    { key: 'file', label: 'File', icon: FileText, defaultTab: 'organization' as NavTab },
    { key: 'transaction', label: 'Transaction', icon: Settings, defaultTab: 'attendance' as NavTab },
    { key: 'data_download', label: 'Data Download', icon: Download, defaultTab: 'biometric' as NavTab },
    { key: 'reports', label: 'Reports', icon: BarChart3, defaultTab: 'reports' as NavTab },
    { key: 'payroll', label: 'PayRoll', icon: CreditCard, defaultTab: 'payroll' as NavTab },
    { key: 'access_control', label: 'Access Control', icon: Lock, defaultTab: 'reports' as NavTab },
    { key: 'admin', label: 'Admin', icon: UserCheck, defaultTab: 'admin' as NavTab },
  ];

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm z-50 select-none">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-slate-100 bg-white gap-3">
        {/* Left: Siddhi Brand Logo */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => {
              onSelectTab('dashboard');
              setOpenMenu(null);
            }}
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
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 text-xs">
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

      {/* Main Horizontal Navigation Menu Bar */}
      <nav className="relative z-40 flex flex-wrap items-center gap-1 bg-slate-100 border-t border-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-700">
        {/* 1. Dashboard */}
        <button
          onClick={() => handleSubItemClick('dashboard')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-orange-500 text-white border-orange-600 shadow-sm font-bold'
              : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
          }`}
        >
          <LayoutDashboard className={`h-4 w-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-orange-500'}`} />
          <span>Dashboard</span>
        </button>

        {/* 2 to 9 Menu Categories */}
        {categories.map((cat) => {
          const Icon = cat.icon;
          const items = getSubmenuItemsForCategory(cat.key);
          const isOpen = openMenu === cat.key;
          const isActive = activeCategory === cat.key;

          return (
            <div
              key={cat.key}
              className="relative group"
              onMouseEnter={() => setOpenMenu(cat.key)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                onClick={() => {
                  setOpenMenu(isOpen ? null : cat.key);
                  onSelectTab(cat.defaultTab);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors shrink-0 ${
                  isActive || isOpen
                    ? 'bg-slate-200 text-orange-600 border-orange-500 font-bold'
                    : 'border-transparent hover:bg-slate-200 hover:text-slate-900 text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4 text-slate-600" />
                <span>{cat.label}</span>
                <ChevronDown
                  className={`h-3 w-3 text-slate-400 group-hover:rotate-180 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Floating Dropdown Submenu */}
              <div
                className={`absolute left-0 top-full mt-0 w-60 bg-white border border-slate-200 rounded-b-xl shadow-2xl py-1.5 z-50 font-normal ${
                  isOpen ? 'block' : 'hidden group-hover:block'
                }`}
              >
                {items.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <button
                      key={sub.label}
                      onClick={() => handleSubItemClick(sub.tab)}
                      className="w-full text-left px-4 py-1.5 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2.5 text-slate-700 font-medium transition-colors"
                    >
                      <SubIcon className="h-3.5 w-3.5 text-orange-500" />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Secondary Quick Submenu Toolbar Bar - ALWAYS Visible for Active Category */}
      {activeSubmenuList.length > 0 && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-1.5 flex items-center gap-1 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mr-2 shrink-0">
            {activeCategory.replace('_', ' ')} Submenu:
          </span>
          {activeSubmenuList.map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.label}
                onClick={() => handleSubItemClick(sub.tab)}
                className="px-2.5 py-1 rounded bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-300 font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Icon className="h-3 w-3 text-orange-500" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
