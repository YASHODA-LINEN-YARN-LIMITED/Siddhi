import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  FileText,
  Upload,
  Download,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  Printer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, Employee, Department, Branch, Designation, Grade } from '../types.ts';

interface EmployeesViewProps {
  userRole: Role;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ userRole }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [letterType, setLetterType] = useState('APPOINTMENT');
  const [generatedLetter, setGeneratedLetter] = useState<any>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkResult, setBulkResult] = useState<any>(null);

  // Add form state
  const [newEmp, setNewEmp] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dateOfBirth: '1995-05-15',
    dateOfJoining: new Date().toISOString().substring(0, 10),
    departmentId: '',
    branchId: '',
    designationId: '',
    gradeId: '',
    status: 'ACTIVE',
    panNumber: '',
    nationalId: '',
    bankName: 'HDFC Bank',
    bankAccountNumber: '',
    bankIfsc: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    loadAll();
  }, [deptFilter, statusFilter, search]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [empList, orgData] = await Promise.all([
        api.getEmployees({
          departmentId: deptFilter || undefined,
          status: statusFilter || undefined,
          search: search || undefined,
        }),
        api.getOrganization(),
      ]);
      setEmployees(empList);
      setDepartments(orgData.departments);
      setBranches(orgData.branches);
      setDesignations(orgData.designations);
      setGrades(orgData.grades);

      if (!newEmp.departmentId && orgData.departments[0]) {
        setNewEmp((prev) => ({
          ...prev,
          departmentId: orgData.departments[0].id,
          branchId: orgData.branches[0]?.id || '',
          designationId: orgData.designations[0]?.id || '',
          gradeId: orgData.grades[0]?.id || '',
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee(newEmp as any);
      setShowAddModal(false);
      notify('Employee onboarded successfully', 'success');
      loadAll();
    } catch (err: any) {
      notify(`Error creating employee: ${err.message}`, 'error');
    }
  };

  const handleGenerateLetter = async () => {
    if (!selectedEmp) return;
    try {
      const res = await api.generateLetter({ employeeId: selectedEmp.id, letterType });
      setGeneratedLetter(res);
      notify('Letter generated successfully', 'success');
    } catch (err: any) {
      notify(`Letter error: ${err.message}`, 'error');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkCsvText.trim()) return;
    try {
      const res = await api.bulkImportEmployees(bulkCsvText);
      setBulkResult(res);
      notify('Bulk import completed', 'success');
      loadAll();
    } catch (err: any) {
      notify(`Bulk import error: ${err.message}`, 'error');
    }
  };

  const exportEmployeesCsv = () => {
    const headers = ['EmployeeCode', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Status', 'DateOfJoining'];
    const rows = employees.map((e) => {
      const dName = departments.find((d) => d.id === e.departmentId)?.name || '';
      const desigName = designations.find((d) => d.id === e.designationId)?.title || '';
      return [
        e.employeeCode,
        `"${e.firstName} ${e.lastName}"`,
        e.email,
        e.phone,
        `"${dName}"`,
        `"${desigName}"`,
        e.status,
        e.dateOfJoining,
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Siddhi_Employee_Directory_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Employee Directory
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportEmployeesCsv}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {(userRole === 'ADMIN' || userRole === 'HR_MANAGER') && (
            <>
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="h-4 w-4 text-slate-500" />
                <span>Bulk Import</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="h-4 w-4 text-emerald-400" />
                <span>Add Employee</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, employee code, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border-none outline-none focus:ring-0 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-slate-50 text-slate-700"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-slate-50 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="NOTICE">Notice Period</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Branch Location</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No employees matching the search filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId)?.name || 'General';
                  const desig = designations.find((d) => d.id === emp.designationId)?.title || 'Specialist';
                  const branch = branches.find((b) => b.id === emp.branchId)?.name || 'HQ';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-semibold text-xs">
                            {emp.firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-2xs text-slate-500 font-mono">{emp.employeeCode}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{desig}</div>
                        <div className="text-2xs text-slate-500">{dept}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{branch}</td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800">{emp.email}</div>
                        <div className="text-2xs text-slate-400">{emp.phone}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 text-2xs">{emp.dateOfJoining}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : emp.status === 'PROBATION'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedEmp(emp)}
                          className="px-2.5 py-1 text-2xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detail Drawer / Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-base">
                  {selectedEmp.firstName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedEmp.firstName} {selectedEmp.lastName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{selectedEmp.employeeCode}</span>
                    <span>·</span>
                    <span>{selectedEmp.role}</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-semibold">{selectedEmp.status}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedEmp(null);
                  setGeneratedLetter(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕ Close
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900">Employment Details</h3>
                <div className="space-y-1 text-slate-600">
                  <div>Date of Joining: <span className="font-mono text-slate-900">{selectedEmp.dateOfJoining}</span></div>
                  <div>Department: <span className="text-slate-900">{departments.find((d) => d.id === selectedEmp.departmentId)?.name}</span></div>
                  <div>Designation: <span className="text-slate-900">{designations.find((d) => d.id === selectedEmp.designationId)?.title}</span></div>
                  <div>Employment Type: <span className="text-slate-900">{selectedEmp.employmentType}</span></div>
                  <div>Probation Period: <span className="text-slate-900">{selectedEmp.probationPeriodMonths} months</span></div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900">Statutory & Bank Verification</h3>
                <div className="space-y-1 text-slate-600">
                  <div>PAN / Tax ID: <span className="font-mono text-slate-900">{selectedEmp.panNumber || 'ABCPA1234A'}</span></div>
                  <div>Aadhaar / National ID: <span className="font-mono text-slate-900">{selectedEmp.nationalId || 'XXXX-XXXX-1234'}</span></div>
                  <div>Bank Name: <span className="text-slate-900">{selectedEmp.bankName || 'HDFC Bank'}</span></div>
                  <div>Account No: <span className="font-mono text-slate-900">{selectedEmp.bankAccountNumber || '50100987654321'}</span></div>
                  <div>IFSC Code: <span className="font-mono text-slate-900">{selectedEmp.bankIfsc || 'HDFC0000240'}</span></div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 md:col-span-2">
                <h3 className="font-semibold text-slate-900">Emergency Contact</h3>
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <div>Contact Name: <span className="text-slate-900 font-medium">{selectedEmp.emergencyContactName || 'Family Contact'}</span></div>
                  <div>Relationship: <span className="text-slate-900">{selectedEmp.emergencyContactRelation || 'Parent/Spouse'}</span></div>
                  <div>Phone: <span className="font-mono text-slate-900">{selectedEmp.emergencyContactPhone || '+91 98450 11002'}</span></div>
                </div>
              </div>
            </div>

            {/* Letter Generator for this employee */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-600" />
                  Official Employment Letters
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={letterType}
                  onChange={(e) => setLetterType(e.target.value)}
                  className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-slate-50"
                >
                  <option value="APPOINTMENT">Letter of Appointment</option>
                  <option value="CONFIRMATION">Probation Confirmation Letter</option>
                  <option value="EXPERIENCE">Relieving & Experience Certificate</option>
                  <option value="SALARY_PROOF">Salary Verification Certificate</option>
                </select>

                <button
                  onClick={handleGenerateLetter}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Generate Letter
                </button>
              </div>

              {generatedLetter && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">{generatedLetter.letterTitle}</span>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-2xs font-semibold"
                    >
                      <Printer className="h-3 w-3" />
                      Print / PDF
                    </button>
                  </div>
                  <div
                    className="prose prose-xs text-slate-700 leading-relaxed font-serif"
                    dangerouslySetInnerHTML={{ __html: generatedLetter.letterBody }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreateEmployee}
            className="w-full max-w-xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Onboard New Employee</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">First Name</label>
                <input
                  required
                  type="text"
                  value={newEmp.firstName}
                  onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Last Name</label>
                <input
                  required
                  type="text"
                  value={newEmp.lastName}
                  onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Official Email</label>
                <input
                  required
                  type="email"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Phone</label>
                <input
                  required
                  type="text"
                  value={newEmp.phone}
                  onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Department</label>
                <select
                  value={newEmp.departmentId}
                  onChange={(e) => setNewEmp({ ...newEmp, departmentId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700">Designation</label>
                <select
                  value={newEmp.designationId}
                  onChange={(e) => setNewEmp({ ...newEmp, designationId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                >
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700">Branch Location</label>
                <select
                  value={newEmp.branchId}
                  onChange={(e) => setNewEmp({ ...newEmp, branchId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700">Date of Joining</label>
                <input
                  type="date"
                  value={newEmp.dateOfJoining}
                  onChange={(e) => setNewEmp({ ...newEmp, dateOfJoining: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
              >
                Save & Initialize Onboarding
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Bulk Employee CSV Import</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <p className="text-2xs text-slate-500">
              CSV Format: <code className="text-slate-900 font-mono">employee_code,first_name,last_name,email,phone</code>
            </p>

            <textarea
              rows={6}
              value={bulkCsvText}
              onChange={(e) => setBulkCsvText(e.target.value)}
              placeholder="employee_code,first_name,last_name,email,phone&#10;E1050,Rohan,Sharma,rohan.s@company.com,+91 98111 22233"
              className="w-full rounded-lg border border-slate-300 p-3 text-xs font-mono bg-slate-50"
            />

            {bulkResult && (
              <div className="p-3 rounded-lg bg-slate-100 text-xs text-slate-800 font-mono space-y-1">
                <div>Imported: <strong>{bulkResult.importedCount}</strong> records</div>
                <div>Failed/Duplicate: <strong>{bulkResult.failedCount}</strong></div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Close
              </button>
              <button
                onClick={handleBulkImport}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
              >
                Run Validation & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
