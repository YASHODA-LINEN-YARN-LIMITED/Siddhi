import type {
  Role,
  Company,
  Branch,
  Department,
  Designation,
  Grade,
  Shift,
  Holiday,
  Employee,
  DailyAttendance,
  AttendanceCorrectionRequest,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  PayrollPeriod,
  EmployeePayslip,
  BiometricIntegrationSettings,
  RawBiometricPunch,
  JobRequisition,
  Candidate,
  PerformanceGoal,
  ExpenseClaim,
  EmployeeLoan,
  AssetRecord,
  OnboardingChecklistItem,
  HelpdeskTicket,
  AuditLog,
  StatutoryRuleConfig,
  SocialPost,
  WorkFromHomeRequest,
  TaxDeclaration,
} from './types.ts';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `API Error ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Session & Auth
  getCurrentUser: () =>
    request<{
      user: {
        employeeId: string;
        employeeCode: string;
        name: string;
        email: string;
        role: Role;
        departmentId: string;
        branchId: string;
      };
      isFirstRunCompleted: boolean;
      availableRoles: { role: Role; label: string; empId: string }[];
    }>('/auth/current-user'),

  switchUser: (employeeId: string) =>
    request<{ success: boolean; user: any }>('/auth/switch-user', {
      method: 'POST',
      body: JSON.stringify({ employeeId }),
    }),

  firstRunSetup: (data: any) =>
    request<{ success: boolean; message: string }>('/auth/first-run-setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Organization
  getOrganization: () =>
    request<{
      companies: Company[];
      branches: Branch[];
      departments: Department[];
      designations: Designation[];
      grades: Grade[];
      shifts: Shift[];
      holidays: Holiday[];
      statutoryRuleConfig: StatutoryRuleConfig;
    }>('/organization'),

  addBranch: (branch: Partial<Branch>) =>
    request<{ success: boolean; branch: Branch }>('/organization/branches', {
      method: 'POST',
      body: JSON.stringify(branch),
    }),

  addDepartment: (dept: Partial<Department>) =>
    request<{ success: boolean; department: Department }>('/organization/departments', {
      method: 'POST',
      body: JSON.stringify(dept),
    }),

  updateStatutoryConfig: (config: Partial<StatutoryRuleConfig>) =>
    request<{ success: boolean; statutoryRuleConfig: StatutoryRuleConfig }>('/organization/statutory-config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  // Employees
  getEmployees: (params?: { departmentId?: string; branchId?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<Employee[]>(`/employees${q ? `?${q}` : ''}`);
  },

  getEmployee: (id: string) => request<Employee>(`/employees/${id}`),

  createEmployee: (emp: Partial<Employee>) =>
    request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(emp),
    }),

  updateEmployee: (id: string, emp: Partial<Employee>) =>
    request<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(emp),
    }),

  changeEmployeeStatus: (id: string, payload: { action: string; effectiveDate?: string; remarks?: string }) =>
    request<{ success: boolean; employee: Employee }>(`/employees/${id}/status-change`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateLetter: (payload: { employeeId: string; letterType: string }) =>
    request<{
      letterTitle: string;
      letterBody: string;
      company: Company;
      employee: Employee;
      generatedDate: string;
    }>('/employees/generate-letter', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bulkImportEmployees: (csvText: string) =>
    request<{
      totalRows: number;
      importedCount: number;
      failedCount: number;
      errors: { row: number; error: string }[];
    }>('/employees/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ csvText }),
    }),

  // Biometric
  getBiometricSettings: () => request<BiometricIntegrationSettings>('/biometric/settings'),

  updateBiometricSettings: (settings: Partial<BiometricIntegrationSettings>) =>
    request<{ success: boolean; message: string }>('/biometric/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  testBiometricConnection: () =>
    request<{
      success: boolean;
      status: string;
      message: string;
      testedAt: string;
      configUsed: any;
    }>('/biometric/test-connection', { method: 'POST' }),

  syncBiometricNow: () =>
    request<{
      success: boolean;
      summary: any;
      message: string;
    }>('/biometric/sync-now', { method: 'POST' }),

  getRawPunches: (params?: { status?: string; employeeCode?: string; date?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<RawBiometricPunch[]>(`/biometric/raw-punches${q ? `?${q}` : ''}`);
  },

  clearBiometricPunches: () =>
    request<{ success: boolean; message: string; deletedPunches: number; deletedAttendance: number }>(
      '/biometric/clear-punches',
      { method: 'POST' }
    ),

  resolveQuarantinedPunch: (punchId: string, employeeId: string) =>
    request<{ success: boolean; message: string }>('/biometric/resolve-quarantine', {
      method: 'POST',
      body: JSON.stringify({ punchId, employeeId }),
    }),

  uploadBiometricCsv: (csvText: string) =>
    request<{ success: boolean; message: string; result: any }>('/biometric/csv-upload', {
      method: 'POST',
      body: JSON.stringify({ csvText }),
    }),

  // Attendance
  getDailyAttendance: (params?: { date?: string; employeeId?: string; departmentId?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<DailyAttendance[]>(`/attendance/daily${q ? `?${q}` : ''}`);
  },

  webPunch: () =>
    request<{ success: boolean; message: string; attendance?: DailyAttendance }>('/attendance/web-punch', {
      method: 'POST',
    }),

  getAttendanceCorrections: () => request<AttendanceCorrectionRequest[]>('/attendance/corrections'),

  submitAttendanceCorrection: (payload: { date: string; requestedFirstIn: string; requestedLastOut: string; reason: string }) =>
    request<AttendanceCorrectionRequest>('/attendance/corrections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  approveAttendanceCorrection: (id: string, comments?: string) =>
    request<{ success: boolean; correction: AttendanceCorrectionRequest; attendance: DailyAttendance }>(
      `/attendance/corrections/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ comments }),
      }
    ),

  // Leave
  getLeaveTypes: () => request<LeaveType[]>('/leave/types'),
  getLeaveBalances: (employeeId?: string) =>
    request<LeaveBalance[]>(`/leave/balances${employeeId ? `?employeeId=${employeeId}` : ''}`),
  getLeaveRequests: (params?: { employeeId?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<LeaveRequest[]>(`/leave/requests${q ? `?${q}` : ''}`);
  },
  submitLeaveRequest: (payload: { leaveTypeId: string; startDate: string; endDate: string; daysCount: number; isHalfDay?: boolean; reason: string }) =>
    request<LeaveRequest>('/leave/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approveLeaveRequest: (id: string, comments?: string) =>
    request<{ success: boolean; leaveRequest: LeaveRequest }>(`/leave/requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    }),
  rejectLeaveRequest: (id: string, comments?: string) =>
    request<{ success: boolean; leaveRequest: LeaveRequest }>(`/leave/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    }),

  // Payroll
  getPayrollPeriods: () => request<PayrollPeriod[]>('/payroll/periods'),
  getPayrollPeriodDetails: (id: string) =>
    request<{ period: PayrollPeriod; payslips: EmployeePayslip[] }>(`/payroll/periods/${id}`),
  calculatePayrollPreview: (year: number, month: number) =>
    request<{ period: PayrollPeriod; payslips: EmployeePayslip[] }>('/payroll/calculate-preview', {
      method: 'POST',
      body: JSON.stringify({ year, month }),
    }),
  finalizePayroll: (id: string) =>
    request<{ success: boolean; period: PayrollPeriod; message: string }>(`/payroll/finalize/${id}`, {
      method: 'POST',
    }),
  unlockPayrollReversal: (id: string, reason: string) =>
    request<{ success: boolean; period: PayrollPeriod; message: string }>(`/payroll/unlock-reversal/${id}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getPayslip: (id: string) =>
    request<{
      payslip: EmployeePayslip;
      employee: Employee;
      company: Company;
      departmentName?: string;
      designationTitle?: string;
    }>(`/payroll/payslip/${id}`),

  // Recruitment
  getJobRequisitions: () => request<JobRequisition[]>('/recruitment/requisitions'),
  createJobRequisition: (reqData: Partial<JobRequisition>) =>
    request<JobRequisition>('/recruitment/requisitions', {
      method: 'POST',
      body: JSON.stringify(reqData),
    }),
  getCandidates: () => request<Candidate[]>('/recruitment/candidates'),
  createCandidate: (candData: Partial<Candidate>) =>
    request<Candidate>('/recruitment/candidates', {
      method: 'POST',
      body: JSON.stringify(candData),
    }),
  updateCandidateStage: (id: string, stage: string, feedback?: string, rating?: number) =>
    request<Candidate>(`/recruitment/candidates/${id}/stage`, {
      method: 'POST',
      body: JSON.stringify({ stage, interviewFeedback: feedback, rating }),
    }),
  convertCandidateToEmployee: (id: string) =>
    request<{ success: boolean; employee: Employee }>(`/recruitment/candidates/${id}/convert-to-employee`, {
      method: 'POST',
    }),

  // Performance
  getPerformanceGoals: (employeeId?: string) =>
    request<PerformanceGoal[]>(`/performance/goals${employeeId ? `?employeeId=${employeeId}` : ''}`),
  addPerformanceGoal: (goal: Partial<PerformanceGoal>) =>
    request<PerformanceGoal>('/performance/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    }),

  // Expenses, Loans, Assets
  getExpenses: () => request<ExpenseClaim[]>('/expenses'),
  submitExpense: (claim: Partial<ExpenseClaim>) =>
    request<ExpenseClaim>('/expenses', {
      method: 'POST',
      body: JSON.stringify(claim),
    }),
  approveExpense: (id: string, remarks?: string) =>
    request<ExpenseClaim>(`/expenses/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    }),
  getLoans: () => request<EmployeeLoan[]>('/loans'),
  getAssets: () => request<AssetRecord[]>('/assets'),

  // Helpdesk
  getHelpdeskTickets: () => request<HelpdeskTicket[]>('/helpdesk/tickets'),
  submitHelpdeskTicket: (ticket: Partial<HelpdeskTicket>) =>
    request<HelpdeskTicket>('/helpdesk/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    }),

  // Alumni
  getAlumniData: () =>
    request<{
      portalEnabled: boolean;
      formerEmployees: Employee[];
      offboardingCases: any[];
    }>('/alumni'),
  toggleAlumniPortal: () => request<{ success: boolean; portalEnabled: boolean }>('/alumni/toggle-portal', { method: 'POST' }),

  // Admin & Audit
  getAuditLogs: (params?: { module?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<AuditLog[]>(`/admin/audit${q ? `?${q}` : ''}`);
  },
  resetDemoDatabase: () => request<{ success: boolean; message: string }>('/admin/reset-demo', { method: 'POST' }),

  // Keka Engage / Social
  getSocialPosts: () => request<SocialPost[]>('/social/posts'),
  createSocialPost: (post: Partial<SocialPost>) =>
    request<SocialPost>('/social/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    }),
  likeSocialPost: (id: string) =>
    request<{ success: boolean; likes: number }>(`/social/posts/${id}/like`, { method: 'POST' }),

  // Keka Time / WFH & On Duty
  getWfhRequests: () => request<WorkFromHomeRequest[]>('/wfh/requests'),
  submitWfhRequest: (reqData: Partial<WorkFromHomeRequest>) =>
    request<WorkFromHomeRequest>('/wfh/requests', {
      method: 'POST',
      body: JSON.stringify(reqData),
    }),
  approveWfhRequest: (id: string, comments?: string) =>
    request<{ success: boolean; request: WorkFromHomeRequest }>(`/wfh/requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    }),

  // Keka Payroll / Tax Declarations
  getTaxDeclaration: (employeeId: string = 'me') =>
    request<TaxDeclaration>(`/tax/declarations/${employeeId}`),
  saveTaxDeclaration: (decl: Partial<TaxDeclaration>) =>
    request<{ success: boolean; declaration: TaxDeclaration }>('/tax/declarations', {
      method: 'POST',
      body: JSON.stringify(decl),
    }),

  // Keka Org Tree
  getOrgTree: () => request<any>('/org/tree'),
};
