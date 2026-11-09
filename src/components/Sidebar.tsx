import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  Clock,
  Fingerprint,
  CalendarDays,
  Banknote,
  Briefcase,
  Target,
  Receipt,
  LifeBuoy,
  GraduationCap,
  FileBarChart,
  Shield,
  ChevronRight,
  Award,
} from 'lucide-react';
import type { Role } from '../types.ts';

export type NavTab =
  | 'dashboard'
  | 'me'
  | 'team'
  | 'engage'
  | 'orgchart'
  | 'organization'
  | 'employees'
  | 'onboarding'
  | 'attendance'
  | 'biometric'
  | 'leave'
  | 'payroll'
  | 'recruitment'
  | 'performance'
  | 'expenses'
  | 'helpdesk'
  | 'alumni'
  | 'reports'
  | 'admin';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: Role;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: Role[];
  badge?: string;
  section: 'EMPLOYEE' | 'CORE' | 'OPERATIONS' | 'FINANCIAL' | 'TALENT' | 'GOVERNANCE';
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, userRole }) => {
  const allRoles: Role[] = ['ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'MANAGER', 'EMPLOYEE', 'RECRUITER', 'AUDITOR'];

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Home Dashboard',
      icon: LayoutDashboard,
      allowedRoles: allRoles,
      section: 'EMPLOYEE',
    },
    {
      id: 'me',
      label: 'Me (Self-Service)',
      icon: Users,
      allowedRoles: allRoles,
      badge: 'ESS',
      section: 'EMPLOYEE',
    },
    {
      id: 'team',
      label: 'My Team',
      icon: Users,
      allowedRoles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'PAYROLL_OFFICER', 'AUDITOR'],
      badge: 'Manager',
      section: 'EMPLOYEE',
    },
    {
      id: 'engage',
      label: 'Engage / Wall',
      icon: Award,
      allowedRoles: allRoles,
      badge: 'Social',
      section: 'EMPLOYEE',
    },
    {
      id: 'orgchart',
      label: 'Org Tree Hierarchy',
      icon: Building2,
      allowedRoles: allRoles,
      section: 'CORE',
    },
    {
      id: 'organization',
      label: 'Organization Master',
      icon: Building2,
      allowedRoles: ['ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'AUDITOR'],
      section: 'CORE',
    },
    {
      id: 'employees',
      label: 'Core HR & Roster',
      icon: Users,
      allowedRoles: allRoles,
      section: 'CORE',
    },
    {
      id: 'onboarding',
      label: 'Onboarding & Exit',
      icon: UserPlus,
      allowedRoles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
      section: 'CORE',
    },
    {
      id: 'attendance',
      label: 'Attendance & Shifts',
      icon: Clock,
      allowedRoles: allRoles,
      section: 'OPERATIONS',
    },
    {
      id: 'biometric',
      label: 'Biometric Device',
      icon: Fingerprint,
      allowedRoles: ['ADMIN', 'HR_MANAGER', 'AUDITOR'],
      badge: 'Realtime',
      section: 'OPERATIONS',
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: CalendarDays,
      allowedRoles: allRoles,
      section: 'OPERATIONS',
    },
    {
      id: 'payroll',
      label: 'Payroll & Statutory',
      icon: Banknote,
      allowedRoles: ['ADMIN', 'PAYROLL_OFFICER', 'HR_MANAGER', 'AUDITOR', 'EMPLOYEE'],
      section: 'FINANCIAL',
    },
    {
      id: 'expenses',
      label: 'Expenses & Assets',
      icon: Receipt,
      allowedRoles: allRoles,
      section: 'FINANCIAL',
    },
    {
      id: 'recruitment',
      label: 'Recruitment (ATS)',
      icon: Briefcase,
      allowedRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'MANAGER'],
      section: 'TALENT',
    },
    {
      id: 'performance',
      label: 'Performance & OKRs',
      icon: Target,
      allowedRoles: allRoles,
      section: 'TALENT',
    },
    {
      id: 'helpdesk',
      label: 'HR Helpdesk',
      icon: LifeBuoy,
      allowedRoles: allRoles,
      section: 'GOVERNANCE',
    },
    {
      id: 'alumni',
      label: 'Alumni & Former Staff',
      icon: GraduationCap,
      allowedRoles: ['ADMIN', 'HR_MANAGER', 'AUDITOR'],
      section: 'GOVERNANCE',
    },
    {
      id: 'reports',
      label: 'Reports & Insights',
      icon: FileBarChart,
      allowedRoles: ['ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER', 'MANAGER', 'AUDITOR'],
      section: 'GOVERNANCE',
    },
    {
      id: 'admin',
      label: 'Admin & Audit Trail',
      icon: Shield,
      allowedRoles: ['ADMIN', 'AUDITOR'],
      section: 'GOVERNANCE',
    },
  ];

  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(userRole));

  const sections: { key: NavItem['section']; title: string }[] = [
    { key: 'EMPLOYEE', title: 'Employee & Manager' },
    { key: 'CORE', title: 'Core People' },
    { key: 'OPERATIONS', title: 'Workforce & Time' },
    { key: 'FINANCIAL', title: 'Compensation' },
    { key: 'TALENT', title: 'Talent & Growth' },
    { key: 'GOVERNANCE', title: 'Compliance & Reports' },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col justify-between overflow-y-auto">
      <div className="p-3 space-y-4">
        {sections.map((sec) => {
          const itemsInSection = visibleItems.filter((item) => item.section === sec.key);
          if (itemsInSection.length === 0) return null;

          return (
            <div key={sec.key} className="space-y-1">
              <div className="px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-slate-600">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {itemsInSection.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-2xs font-semibold px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer system status */}
      <div className="p-3 border-t border-slate-200 bg-white/50 text-2xs text-slate-500">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-700">Siddhi v2.4 LTS</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Local Node
          </span>
        </div>
        <div className="text-slate-600 leading-tight">
          PostgreSQL 16 · Biometric Active
        </div>
      </div>
    </aside>
  );
};
