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
    name: 'Siddhi Technologies Private Limited',
    legalName: 'Siddhi Technologies Pvt. Ltd.',
    taxId: 'AAACS1234FST001',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    financialYearStart: '04-01',
    website: 'https://siddhi-hrms.local',
    phone: '+91 80 4123 4567',
    email: 'hr@siddhi-technologies.internal',
    address: 'Tower B, Tech Park Campus, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
  },
];

const branches: Branch[] = [
  {
    id: branchBlr,
    companyId,
    code: 'BLR-HQ',
    name: 'Bengaluru Headquarters',
    address: 'Outer Ring Road, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    postalCode: '560103',
    isHeadquarters: true,
    geofenceEnabled: true,
    latitude: 12.9279,
    longitude: 77.6771,
    radiusMeters: 300,
  },
];

const departments: Department[] = [
  { id: 'dept-eng', companyId, code: 'ENG', name: 'Software Product Engineering', costCenterCode: 'CC-101' },
  { id: 'dept-hr', companyId, code: 'HRD', name: 'Human Resources & People Ops', costCenterCode: 'CC-102' },
  { id: 'dept-fin', companyId, code: 'FIN', name: 'Finance & Accounts', costCenterCode: 'CC-103' },
  { id: 'dept-sales', companyId, code: 'SLS', name: 'Sales & Business Growth', costCenterCode: 'CC-104' },
  { id: 'dept-ops', companyId, code: 'OPS', name: 'Operations & IT Infrastructure', costCenterCode: 'CC-105' },
];

const designations: Designation[] = [
  { id: 'desig-admin', code: 'SYS-ADM', title: 'Principal System Architect & Admin', departmentId: 'dept-ops', gradeLevel: 'L5' },
  { id: 'desig-hr-mgr', code: 'HR-MGR', title: 'Head of People & HR Operations', departmentId: 'dept-hr', gradeLevel: 'M2' },
  { id: 'desig-payroll', code: 'PAY-OFF', title: 'Senior Payroll Specialist', departmentId: 'dept-fin', gradeLevel: 'L3' },
  { id: 'desig-eng-lead', code: 'ENG-LEAD', title: 'Engineering Manager', departmentId: 'dept-eng', gradeLevel: 'M1' },
  { id: 'desig-sr-dev', code: 'SR-DEV', title: 'Senior Software Engineer', departmentId: 'dept-eng', gradeLevel: 'L3' },
];

const grades: Grade[] = [
  { id: 'grd-l1', code: 'L1', name: 'Associate / Trainee', minSalary: 350000, maxSalary: 600000 },
  { id: 'grd-l2', code: 'L2', name: 'Specialist / Intermediate', minSalary: 600000, maxSalary: 1200000 },
  { id: 'grd-l3', code: 'L3', name: 'Senior Professional', minSalary: 1200000, maxSalary: 2200000 },
  { id: 'grd-m1', code: 'M1', name: 'Team Lead / Manager', minSalary: 2000000, maxSalary: 3500000 },
  { id: 'grd-m2', code: 'M2', name: 'Director / Functional Head', minSalary: 3500000, maxSalary: 6000000 },
  { id: 'grd-l5', code: 'L5', name: 'Principal / Staff Architect', minSalary: 4000000, maxSalary: 7500000 },
];

const shifts: Shift[] = [
  {
    id: 'shift-gen',
    code: 'GEN-0918',
    name: 'General Day Shift (9:00 AM - 6:00 PM)',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    halfDayHours: 4,
    fullDayHours: 8,
    breakMinutes: 60,
    isOvernight: false,
    weeklyOffDays: [0, 6],
  },
];

const holidays: Holiday[] = [
  { id: 'hol-1', companyId, name: 'Republic Day', date: '2026-01-26', isRestricted: false, description: 'National Holiday' },
  { id: 'hol-2', companyId, name: 'Independence Day', date: '2026-08-15', isRestricted: false, description: 'National Holiday' },
  { id: 'hol-3', companyId, name: 'Gandhi Jayanti', date: '2026-10-02', isRestricted: false, description: 'National Holiday' },
];

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
  ptSlabsByState: {
    Karnataka: [
      { minSalary: 0, maxSalary: 15000, taxAmount: 0 },
      { minSalary: 15001, maxSalary: 99999999, taxAmount: 200 },
    ],
  },
  adminVerified: true,
  lastVerifiedDate: '2026-04-01',
  legalDisclaimer: 'Statutory compliance rates maintained as per Indian labor ministry guidelines.',
};

const employees: Employee[] = [
  {
    id: 'emp-admin',
    employeeCode: 'E1001',
    firstName: 'Vikram',
    lastName: 'Aditya',
    email: 'admin@siddhi-technologies.internal',
    phone: '+91 98450 11001',
    gender: 'MALE',
    dateOfBirth: '1985-04-12',
    dateOfJoining: '2020-01-15',
    companyId,
    branchId: branchBlr,
    departmentId: 'dept-ops',
    designationId: 'desig-admin',
    gradeId: 'grd-l5',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    probationPeriodMonths: 0,
    confirmationDate: '2020-01-15',
    role: 'ADMIN',
    panNumber: 'ABCPA1234A',
    nationalId: '8912 3456 7890',
    pfNumber: 'KN/BLR/100101/01',
    bankName: 'HDFC Bank',
    bankAccountNumber: '50100234567891',
    bankIfsc: 'HDFC0000240',
    emergencyContactName: 'Ananya Aditya',
    emergencyContactRelation: 'Spouse',
    emergencyContactPhone: '+91 98450 11002',
    address: 'Indiranagar 100ft Road, Bengaluru',
  },
  {
    id: 'emp-hr',
    employeeCode: 'E1002',
    firstName: 'Pooja',
    lastName: 'Sharma',
    email: 'pooja.sharma@siddhi-technologies.internal',
    phone: '+91 98200 22002',
    gender: 'FEMALE',
    dateOfBirth: '1989-08-24',
    dateOfJoining: '2021-03-01',
    companyId,
    branchId: branchBlr,
    departmentId: 'dept-hr',
    designationId: 'desig-hr-mgr',
    gradeId: 'grd-m2',
    managerId: 'emp-admin',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    probationPeriodMonths: 3,
    confirmationDate: '2021-06-01',
    role: 'HR_MANAGER',
    panNumber: 'BQGPS4321B',
    nationalId: '5421 9876 1234',
    pfNumber: 'KN/BLR/100101/02',
    bankName: 'ICICI Bank',
    bankAccountNumber: '002105009876',
    bankIfsc: 'ICIC0000021',
    emergencyContactName: 'Rajesh Sharma',
    emergencyContactRelation: 'Father',
    emergencyContactPhone: '+91 98200 22003',
    address: 'Koramangala 4th Block, Bengaluru',
  },
  {
    id: 'emp-payroll',
    employeeCode: 'E1003',
    firstName: 'Karthik',
    lastName: 'Subramanian',
    email: 'karthik.sub@siddhi-technologies.internal',
    phone: '+91 99000 33003',
    gender: 'MALE',
    dateOfBirth: '1992-11-05',
    dateOfJoining: '2021-08-15',
    companyId,
    branchId: branchBlr,
    departmentId: 'dept-fin',
    designationId: 'desig-payroll',
    gradeId: 'grd-l3',
    managerId: 'emp-admin',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    probationPeriodMonths: 6,
    confirmationDate: '2022-02-15',
    role: 'PAYROLL_OFFICER',
    panNumber: 'CRXPS9876C',
    nationalId: '3210 6543 9870',
    pfNumber: 'KN/BLR/100101/03',
    bankName: 'Axis Bank',
    bankAccountNumber: '918010045678912',
    bankIfsc: 'UTIB0000123',
    emergencyContactName: 'Lakshmi Subramanian',
    emergencyContactRelation: 'Mother',
    emergencyContactPhone: '+91 99000 33004',
    address: 'HSR Layout Sector 2, Bengaluru',
  },
  {
    id: 'emp-mgr',
    employeeCode: 'E1004',
    firstName: 'Rajiv',
    lastName: 'Nambiar',
    email: 'rajiv.nambiar@siddhi-technologies.internal',
    phone: '+91 98451 44004',
    gender: 'MALE',
    dateOfBirth: '1987-06-18',
    dateOfJoining: '2020-06-01',
    companyId,
    branchId: branchBlr,
    departmentId: 'dept-eng',
    designationId: 'desig-eng-lead',
    gradeId: 'grd-m1',
    managerId: 'emp-admin',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    probationPeriodMonths: 0,
    confirmationDate: '2020-06-01',
    role: 'MANAGER',
    panNumber: 'DFGPS5678D',
    nationalId: '1234 5678 9012',
    pfNumber: 'KN/BLR/100101/04',
    bankName: 'State Bank of India',
    bankAccountNumber: '30491029384',
    bankIfsc: 'SBIN0008450',
    emergencyContactName: 'Meera Nambiar',
    emergencyContactRelation: 'Spouse',
    emergencyContactPhone: '+91 98451 44005',
    address: 'Whitefield Main Road, Bengaluru',
  },
  {
    id: 'emp-staff1',
    employeeCode: 'E1023',
    firstName: 'Sneha',
    lastName: 'Rao',
    email: 'sneha.rao@siddhi-technologies.internal',
    phone: '+91 98860 55005',
    gender: 'FEMALE',
    dateOfBirth: '1995-03-30',
    dateOfJoining: '2022-04-11',
    companyId,
    branchId: branchBlr,
    departmentId: 'dept-eng',
    designationId: 'desig-sr-dev',
    gradeId: 'grd-l3',
    managerId: 'emp-mgr',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    probationPeriodMonths: 6,
    confirmationDate: '2022-10-11',
    role: 'EMPLOYEE',
    panNumber: 'EGHPR6789E',
    nationalId: '6543 2109 8765',
    pfNumber: 'KN/BLR/100101/05',
    bankName: 'HDFC Bank',
    bankAccountNumber: '50100456789123',
    bankIfsc: 'HDFC0000240',
    emergencyContactName: 'Girish Rao',
    emergencyContactRelation: 'Brother',
    emergencyContactPhone: '+91 98860 55006',
    address: 'BTM Layout 2nd Stage, Bengaluru',
  },
];

const biometricSettings: BiometricIntegrationSettings = {
  id: 'bio-cfg-01',
  name: 'Realtime Biometric Device Connector',
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



let currentActiveEmpId = 'emp-admin';

export const mockStore = {
  handleRequest<T>(endpoint: string, options?: RequestInit): T {
    const cleanEndpoint = endpoint.split('?')[0];

    if (cleanEndpoint === '/auth/current-user') {
      const emp = employees.find((e) => e.id === currentActiveEmpId) || employees[0];
      return {
        user: {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.email,
          role: emp.role,
          departmentId: emp.departmentId,
          branchId: emp.branchId,
        },
        isFirstRunCompleted: true,
        availableRoles: [
          { role: 'ADMIN', label: 'System Administrator (Vikram Aditya)', empId: 'emp-admin' },
          { role: 'HR_MANAGER', label: 'HR Manager (Pooja Sharma)', empId: 'emp-hr' },
          { role: 'PAYROLL_OFFICER', label: 'Payroll Specialist (Karthik Subramanian)', empId: 'emp-payroll' },
          { role: 'MANAGER', label: 'Engineering Manager (Rajiv Nambiar)', empId: 'emp-mgr' },
          { role: 'EMPLOYEE', label: 'Standard Employee (Sneha Rao)', empId: 'emp-staff1' },
        ],
      } as unknown as T;
    }

    if (cleanEndpoint === '/auth/switch-user') {
      if (options?.body) {
        try {
          const body = JSON.parse(options.body as string);
          if (body.employeeId) currentActiveEmpId = body.employeeId;
        } catch {}
      }
      return { success: true, user: employees.find((e) => e.id === currentActiveEmpId) } as unknown as T;
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

    if (cleanEndpoint === '/employees') {
      return employees as unknown as T;
    }

    if (cleanEndpoint === '/biometric/settings') {
      return biometricSettings as unknown as T;
    }

    if (cleanEndpoint === '/biometric/raw-punches') {
      return [] as unknown as T;
    }

    if (cleanEndpoint === '/biometric/test-connection') {
      return {
        success: true,
        status: 'WEBHOOK_LISTENER_ACTIVE',
        message: 'Live Biometric Webhook listener is 100% active and healthy at /api/biometric/webhook.',
        testedAt: new Date().toISOString(),
      } as unknown as T;
    }

    if (cleanEndpoint === '/attendance/daily') {
      return [] as unknown as T;
    }

    if (cleanEndpoint === '/attendance/corrections') {
      return [] as unknown as T;
    }

    if (cleanEndpoint === '/leave/types') {
      return [
        { id: 'lt-cl', code: 'CL', name: 'Casual Leave', annualQuota: 12, carryForwardMax: 0, isPaid: true, encashmentAllowed: false, probationAllowed: true, requiresAttachment: false },
        { id: 'lt-sl', code: 'SL', name: 'Sick / Medical Leave', annualQuota: 10, carryForwardMax: 5, isPaid: true, encashmentAllowed: false, probationAllowed: true, requiresAttachment: true },
        { id: 'lt-el', code: 'EL', name: 'Earned / Privilege Leave', annualQuota: 18, carryForwardMax: 30, isPaid: true, encashmentAllowed: true, probationAllowed: false, requiresAttachment: false },
      ] as unknown as T;
    }

    if (cleanEndpoint === '/leave/balances') {
      return [] as unknown as T;
    }

    if (cleanEndpoint === '/leave/requests') {
      return [] as unknown as T;
    }

    if (cleanEndpoint === '/payroll/periods') {
      return [] as unknown as T;
    }

    if (cleanEndpoint === '/payroll/payslips') {
      return [] as unknown as T;
    }

    if (cleanEndpoint === '/reports/summary') {
      return {
        totalHeadcount: employees.length,
        departmentBreakdown: {},
        branchBreakdown: {},
        genderDiversity: {},
        turnoverRate: 0,
        averageTenureMonths: 24,
      } as unknown as T;
    }

    // Default safe response
    return [] as unknown as T;
  },
};
