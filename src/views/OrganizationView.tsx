import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Briefcase,
  Layers,
  Calendar,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Clock,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Company, Branch, Department, Designation, Grade, Shift, Holiday, StatutoryRuleConfig } from '../types.ts';

export const OrganizationView: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [statConfig, setStatConfig] = useState<StatutoryRuleConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // New branch modal
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({
    code: '',
    name: '',
    city: '',
    state: 'Karnataka',
    country: 'India',
    address: '',
    postalCode: '',
    isHeadquarters: false,
    geofenceEnabled: false,
  });

  // New dept modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    costCenterCode: 'CC-101',
  });

  useEffect(() => {
    loadOrg();
  }, []);

  const loadOrg = async () => {
    try {
      setLoading(true);
      const data = await api.getOrganization();
      setCompany(data.companies[0]);
      setBranches(data.branches);
      setDepartments(data.departments);
      setDesignations(data.designations);
      setGrades(data.grades);
      setShifts(data.shifts);
      setHolidays(data.holidays);
      setStatConfig(data.statutoryRuleConfig);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addBranch(branchForm as any);
      setShowBranchModal(false);
      setBranchForm({ code: '', name: '', city: '', state: 'Karnataka', country: 'India', address: '', postalCode: '', isHeadquarters: false, geofenceEnabled: false });
      notify('Branch added successfully', 'success');
      loadOrg();
    } catch (err: any) {
      notify(`Branch creation failed: ${err.message}`, 'error');
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addDepartment(deptForm as any);
      setShowDeptModal(false);
      setDeptForm({ code: '', name: '', costCenterCode: 'CC-101' });
      notify('Department added successfully', 'success');
      loadOrg();
    } catch (err: any) {
      notify(`Department creation failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Organization & Master Data
          </h1>
        </div>
      </div>

      {/* Company Profile Card */}
      {company && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{company.name}</h2>
                <span className="font-mono text-2xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  {company.code}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{company.legalName}</div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-mono">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                {company.timezone}
              </span>
              <span>·</span>
              <span className="font-mono">{company.currency}</span>
              <span>·</span>
              <span>FY Starts: {company.financialYearStart}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div>Tax ID / GSTIN: <span className="font-mono text-slate-900">{company.taxId}</span></div>
            <div>Official Email: <span className="text-slate-900">{company.email}</span></div>
            <div>Contact Phone: <span className="text-slate-900 font-mono">{company.phone}</span></div>
            <div className="sm:col-span-3 text-slate-500">Registered Office: {company.address}</div>
          </div>
        </div>
      )}

      {/* Branches & Locations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Physical Branches & Geo-Fences ({branches.length})</h2>
            <p className="text-2xs text-slate-500">Multi-location enterprise presence with optional GPS perimeter validation</p>
          </div>
          <button
            onClick={() => setShowBranchModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Branch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>{b.name}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-2xs">
                  {b.isHeadquarters && (
                    <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded">HQ</span>
                  )}
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{b.code}</span>
                </div>
              </div>

              <div className="text-slate-600 text-2xs">{b.address}, {b.city}, {b.state} - {b.postalCode}</div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
                <span>Geo-Fencing: <strong className={b.geofenceEnabled ? 'text-emerald-700' : 'text-slate-400'}>{b.geofenceEnabled ? 'Active (300m)' : 'Disabled'}</strong></span>
                <span>Country: {b.country}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments & Designations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Departments ({departments.length})</h2>
              <p className="text-2xs text-slate-500">Functional units & cost centers</p>
            </div>
            <button
              onClick={() => setShowDeptModal(true)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {departments.map((d) => (
              <div key={d.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{d.name}</div>
                  <div className="text-2xs text-slate-400 font-mono">Code: {d.code}</div>
                </div>
                <span className="text-2xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {d.costCenterCode}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Designations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Designations & Grades ({designations.length})</h2>
            <p className="text-2xs text-slate-500">Role titles and compensation bands</p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {designations.map((des) => (
              <div key={des.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{des.title}</div>
                  <div className="text-2xs text-slate-400 font-mono">{des.code}</div>
                </div>
                <span className="text-2xs font-mono font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                  Level {des.gradeLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shifts & Work Calendar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Shift Policies & Work Schedules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {shifts.map((sh) => (
            <div key={sh.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1">
              <div className="font-bold text-slate-900">{sh.name}</div>
              <div className="text-2xs font-mono text-slate-600">
                {sh.startTime} to {sh.endTime} ({sh.fullDayHours} hrs)
              </div>
              <div className="text-2xs text-slate-400">
                Grace: {sh.graceMinutes}m · Break: {sh.breakMinutes}m
              </div>
              {sh.isOvernight && (
                <span className="text-2xs font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded inline-block">
                  Overnight Shift
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals for Branch and Dept */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAddBranch} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add New Branch Location</h3>
            <div>
              <label className="font-medium text-slate-700">Branch Name</label>
              <input required type="text" placeholder="e.g. Pune Tech Center" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700">Code</label>
                <input required type="text" placeholder="PUN-01" value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2 font-mono" />
              </div>
              <div>
                <label className="font-medium text-slate-700">City</label>
                <input required type="text" placeholder="Pune" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
              </div>
            </div>
            <div>
              <label className="font-medium text-slate-700">Address</label>
              <input required type="text" placeholder="Street & area" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowBranchModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Save Branch</button>
            </div>
          </form>
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAddDept} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add Department</h3>
            <div>
              <label className="font-medium text-slate-700">Department Name</label>
              <input required type="text" placeholder="e.g. Legal & Compliance" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700">Code</label>
                <input required type="text" placeholder="LEG" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2 font-mono" />
              </div>
              <div>
                <label className="font-medium text-slate-700">Cost Center</label>
                <input required type="text" placeholder="CC-106" value={deptForm.costCenterCode} onChange={(e) => setDeptForm({ ...deptForm, costCenterCode: e.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2 font-mono" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowDeptModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Save Department</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
