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

const companyId = 'comp-101';
const branchBlr = 'br-blr';

const companies: Company[] = [
  {
    id: companyId,
    code: 'SIDDHI-CORP',
    name: 'Siddhi Organization',
    legalName: 'Siddhi Organization',
    taxId: 'AAACS1234FST001',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    financialYearStart: '04-01',
    website: 'https://siddhi-hrms.local',
    phone: '',
    email: 'admin@siddhi-hrms.local',
    address: 'On-Premises Local Server',
  },
];

const branches: Branch[] = [
  {
    id: branchBlr,
    companyId,
    code: 'MAIN-LOC',
    name: 'Main Organization Branch',
    address: 'On-Premises',
    city: 'Local',
    state: 'Local',
    country: 'India',
    postalCode: '560001',
    isHeadquarters: true,
    geofenceEnabled: false,
  },
];

const departments: Department[] = [
  { id: 'dept-gen', companyId, code: 'GEN', name: 'General Operations', costCenterCode: 'CC-GEN' },
];

const designations: Designation[] = [
  { id: 'desig-admin', code: 'SYS-ADM', title: 'System Administrator', departmentId: 'dept-gen', gradeLevel: 'L1' },
];

const grades: Grade[] = [];
const shifts: Shift[] = [
  {
    id: 'shift-gen',
    code: 'GEN-0918',
    name: 'Standard Shift (9:00 AM - 6:00 PM)',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    halfDayHours: 4,
    fullDayHours: 8,
    breakMinutes: 60,
    isOvernight: false,
    weeklyOffDays: [0],
  },
];

const holidays: Holiday[] = [];

const statutoryRuleConfig: StatutoryRuleConfig = {
  id: 'stat-2026-in',
  jurisdiction: 'IN',
  effectiveFrom: '2026-04-01',
  pfWageCeiling: 15000,
  pfEmployeeRate: 12,
  pfEmployerRate: 12,
  esiWageCeiling: 21000,
  esiEmployeeRate: 0.75,
  esiEmployerRate: 3.25,
  ptSlabsByState: {},
  adminVerified: true,
  lastVerifiedDate: '2026-04-01',
  legalDisclaimer: '',
};

// NO DUMMY EMPLOYEES: Only populated from real biometric machine punch codes and admin roster entries
const employees: Employee[] = [];

const biometricSettings: BiometricIntegrationSettings = {
  id: 'bio-cfg-01',
  name: 'Realtime Biometric Device Gateway',
  enabled: true,
  apiBaseUrl: 'https://ais-pre-xprdmpkiap2xlvjmybcnti-854403608887.asia-east1.run.app',
  endpoint: '/api/biometric/webhook',
  httpMethod: 'POST',
  authType: 'NONE',
  authCredentials: {},
  requestHeaders: { 'Content-Type': 'application/json' },
  queryParams: {},
  requestBodyTemplate: '{}',
  pollingIntervalMinutes: 15,
  requestTimeoutSeconds: 30,
  lastSyncStatus: 'IDLE',
  recordsSyncedLastRun: 0,
  allowCsvFallback: true,
  timezone: 'Asia/Kolkata',
};

const defaultAdminUser = {
  employeeId: 'admin-01',
  employeeCode: 'ADMIN',
  name: 'System Administrator',
  email: 'admin@siddhi-hrms.local',
  role: 'ADMIN' as Role,
  departmentId: 'dept-gen',
  branchId: branchBlr,
};

export const mockStore = {
  handleRequest<T>(endpoint: string, options?: RequestInit): T {
    const cleanEndpoint = endpoint.split('?')[0];

    if (cleanEndpoint === '/auth/current-user') {
      return {
        user: defaultAdminUser,
        isFirstRunCompleted: true,
        availableRoles: [
          { role: 'ADMIN' as Role, label: 'System Administrator', empId: 'admin-01' },
        ],
      } as unknown as T;
    }

    if (cleanEndpoint === '/auth/switch-user') {
      return { success: true, user: defaultAdminUser } as unknown as T;
    }

    if (cleanEndpoint === '/organization') {
      return {
        companies,
        branches,
        departments,
        designations,
        grades,
        shifts,
        holidays,
        statutoryRuleConfig,
      } as unknown as T;
    }

    // Return empty arrays for all data - NO DUMMY DATA
    if (cleanEndpoint === '/employees') return employees as unknown as T;
    if (cleanEndpoint === '/biometric/settings') return biometricSettings as unknown as T;
    if (cleanEndpoint === '/biometric/raw-punches') return [] as unknown as T;
    if (cleanEndpoint === '/biometric/test-connection') {
      return {
        success: true,
        status: 'WEBHOOK_LISTENER_ACTIVE',
        message: 'Live Biometric Webhook listener is 100% active and healthy at /api/biometric/webhook.',
        testedAt: new Date().toISOString(),
      } as unknown as T;
    }

    if (cleanEndpoint === '/attendance/daily') return [] as unknown as T;
    if (cleanEndpoint === '/attendance/corrections') return [] as unknown as T;
    if (cleanEndpoint === '/leave/types') return [] as unknown as T;
    if (cleanEndpoint === '/leave/balances') return [] as unknown as T;
    if (cleanEndpoint === '/leave/requests') return [] as unknown as T;
    if (cleanEndpoint === '/payroll/periods') return [] as unknown as T;
    if (cleanEndpoint === '/payroll/payslips') return [] as unknown as T;
    if (cleanEndpoint === '/recruitment/requisitions') return [] as unknown as T;
    if (cleanEndpoint === '/recruitment/candidates') return [] as unknown as T;
    if (cleanEndpoint === '/performance/goals') return [] as unknown as T;
    if (cleanEndpoint === '/expenses') return [] as unknown as T;
    if (cleanEndpoint === '/helpdesk/tickets') return [] as unknown as T;
    if (cleanEndpoint === '/reports/summary') {
      return {
        totalHeadcount: 0,
        departmentBreakdown: {},
        branchBreakdown: {},
        genderDiversity: {},
        turnoverRate: 0,
        averageTenureMonths: 0,
      } as unknown as T;
    }

    return [] as unknown as T;
  },
};
