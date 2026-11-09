import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  LogOut, 
  Fingerprint,
  RefreshCw,
  Bell
} from 'lucide-react';
import { api } from '../api.ts';
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
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  availableRoles,
  onRoleSwitch,
  activeBranchName,
  onWebPunchSuccess,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [punching, setPunching] = useState(false);
  const [punchToast, setPunchToast] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleWebPunch = async () => {
    try {
      setPunching(true);
      const res = await api.webPunch();
      setPunchToast(res.message);
      onWebPunchSuccess();
      setTimeout(() => setPunchToast(null), 4000);
    } catch (e: any) {
      setPunchToast(`Punch error: ${e.message}`);
      setTimeout(() => setPunchToast(null), 4000);
    } finally {
      setPunching(false);
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'System Administrator';
      case 'HR_MANAGER':
        return 'Head of HR & People Ops';
      case 'PAYROLL_OFFICER':
        return 'Senior Payroll Specialist';
      case 'MANAGER':
        return 'Engineering Lead';
      case 'EMPLOYEE':
        return 'Employee Self-Service (ESS)';
      case 'RECRUITER':
        return 'Talent Acquisition Lead';
      case 'AUDITOR':
        return 'Compliance & Audit Analyst';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      {/* Brand & Organization context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-lg shadow-sm">
            <span className="tracking-tighter">सि</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-base tracking-tight">Siddhi</span>
              <span className="text-xs text-slate-400 font-mono">HRMS</span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden md:block" />

        {/* Physical Branch Location Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <MapPin className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-medium text-slate-700">{activeBranchName || 'Bengaluru Headquarters'}</span>
          <span className="text-slate-400">·</span>
          <span className="text-emerald-600 font-medium">On-Premises</span>
        </div>
      </div>

      {/* Right controls: Live Clock, Web Punch, Role Switcher, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live Clock & Web Punch */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-600 font-mono bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{currentTime || '09:00:00 AM'}</span>
          </div>

          <button
            onClick={handleWebPunch}
            disabled={punching}
            title="Log browser attendance punch"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <Fingerprint className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden md:inline">{punching ? 'Recording...' : 'Web Punch In/Out'}</span>
            <span className="md:hidden">Punch</span>
          </button>
        </div>

        {/* Punch Toast */}
        {punchToast && (
          <div className="fixed top-18 right-6 z-50 rounded-lg bg-slate-900 text-white text-xs px-4 py-2.5 shadow-lg border border-slate-700 flex items-center gap-2 animate-bounce">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span>{punchToast}</span>
          </div>
        )}

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Role & User Switcher for Rich Multi-Persona Testing */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 p-1.5 sm:px-3 sm:py-1.5 text-left transition-colors"
            title="Switch Testing Persona & Role"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white font-semibold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                {currentUser.name}
                <span className="text-2xs text-slate-500 font-mono font-normal">({currentUser.employeeCode})</span>
              </div>
              <div className="text-2xs text-slate-500 font-medium truncate max-w-[130px]">
                {getRoleLabel(currentUser.role)}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Persona Switching Dropdown */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                <div className="text-xs font-semibold text-slate-900">Switch Role & User Persona</div>
                <p className="text-2xs text-slate-500">Test granular permissions & ESS workflows</p>
              </div>

              <div className="space-y-0.5 max-h-80 overflow-y-auto">
                {availableRoles.map((item) => {
                  const isCurrent = currentUser.employeeId === item.empId;
                  return (
                    <button
                      key={item.empId}
                      onClick={() => {
                        onRoleSwitch(item.empId);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        isCurrent
                          ? 'bg-slate-900 text-white font-medium'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className={`text-2xs ${isCurrent ? 'text-slate-300' : 'text-slate-400'}`}>
                          Role: {item.role}
                        </div>
                      </div>
                      {isCurrent && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
