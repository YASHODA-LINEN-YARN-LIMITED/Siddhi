import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  Company,
  Branch,
  Department,
  Designation,
  Grade,
  Shift,
  Holiday,
  Employee,
  EmployeeDocument,
  RawBiometricPunch,
  BiometricIntegrationSettings,
  DailyAttendance,
  AttendanceCorrectionRequest,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  LeaveLedgerEntry,
  SalaryStructure,
  PayrollPeriod,
  EmployeePayslip,
  JobRequisition,
  Candidate,
  PerformanceCycle,
  PerformanceGoal,
  ExpenseClaim,
  EmployeeLoan,
  AssetRecord,
  OnboardingChecklistItem,
  OffboardingRecord,
  HelpdeskTicket,
  AuditLog,
  StatutoryRuleConfig,
  SocialPost,
  WorkFromHomeRequest,
  TaxDeclaration,
  OneOnOneMeeting,
} from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.resolve(DATA_DIR, 'siddhi_store.json');

export interface DatabaseSchema {
  version: number;
  isFirstRunSetupCompleted: boolean;
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  designations: Designation[];
  grades: Grade[];
  shifts: Shift[];
  holidays: Holiday[];
  employees: Employee[];
  employeeDocuments: EmployeeDocument[];
  rawBiometricPunches: RawBiometricPunch[];
  biometricSettings: BiometricIntegrationSettings;
  dailyAttendance: DailyAttendance[];
  attendanceCorrectionRequests: AttendanceCorrectionRequest[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  leaveLedger: LeaveLedgerEntry[];
  salaryStructures: SalaryStructure[];
  payrollPeriods: PayrollPeriod[];
  employeePayslips: EmployeePayslip[];
  jobRequisitions: JobRequisition[];
  candidates: Candidate[];
  performanceCycles: PerformanceCycle[];
  performanceGoals: PerformanceGoal[];
  expenseClaims: ExpenseClaim[];
  employeeLoans: EmployeeLoan[];
  assets: AssetRecord[];
  onboardingChecklists: OnboardingChecklistItem[];
  offboardingRecords: OffboardingRecord[];
  helpdeskTickets: HelpdeskTicket[];
  auditLogs: AuditLog[];
  statutoryRuleConfig: StatutoryRuleConfig;
  alumniPortalEnabled: boolean;
  socialPosts: SocialPost[];
  wfhRequests: WorkFromHomeRequest[];
  taxDeclarations: TaxDeclaration[];
  oneOnOnes: OneOnOneMeeting[];
}

function getInitialSeed(): DatabaseSchema {
  const companyId = 'comp-101';
  const branchMain = 'br-main';

  const companies: Company[] = [
    {
      id: companyId,
      code: 'YASHODA-LINEN',
      name: 'Yashoda Linen Limited',
      legalName: 'Yashoda Linen Limited',
      taxId: '',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      financialYearStart: '04-01',
      website: '',
      phone: '',
      email: 'admin@siddhi-hrms.local',
      address: 'On-Premises Server',
    },
  ];

  const branches: Branch[] = [
    {
      id: branchMain,
      companyId,
      code: 'MAIN-LOC',
      name: 'Main Organization Branch',
      address: 'On-Premises',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      isHeadquarters: true,
      geofenceEnabled: false,
    },
  ];

  const departments: Department[] = [
    { id: 'dept-gen', companyId, code: 'GEN', name: 'General Operations', costCenterCode: 'CC-GEN' },
  ];

  const designations: Designation[] = [
    { id: 'desig-gen', code: 'EMP', title: 'Staff Member', departmentId: 'dept-gen', gradeLevel: 'L1' },
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

  const employees: Employee[] = [];

  const biometricSettings: BiometricIntegrationSettings = {
    id: 'bio-cfg-01',
    name: 'Realtime Biometric Machine Connector',
    enabled: true,
    apiBaseUrl: '',
    endpoint: '/api/biometric/webhook',
    httpMethod: 'POST',
    authType: 'NONE',
    authCredentials: {
      token: '',
    },
    requestHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    queryParams: {},
    requestBodyTemplate: JSON.stringify({
      from_datetime: '{{START_TIME}}',
      to_datetime: '{{END_TIME}}',
    }, null, 2),
    pollingIntervalMinutes: 5,
    requestTimeoutSeconds: 30,
    lastSyncAt: undefined,
    lastSyncStatus: 'IDLE',
    recordsSyncedLastRun: 0,
    syncCursor: undefined,
    allowCsvFallback: true,
    timezone: 'Asia/Kolkata',
  };

  const rawBiometricPunches: RawBiometricPunch[] = [];

  const dailyAttendance: DailyAttendance[] = [];


  const leaveTypes: LeaveType[] = [
    { id: 'lt-cl', code: 'CL', name: 'Casual Leave', annualQuota: 12, carryForwardMax: 0, isPaid: true, encashmentAllowed: false, probationAllowed: true, requiresAttachment: false },
    { id: 'lt-sl', code: 'SL', name: 'Sick / Medical Leave', annualQuota: 10, carryForwardMax: 5, isPaid: true, encashmentAllowed: false, probationAllowed: true, requiresAttachment: true },
    { id: 'lt-el', code: 'EL', name: 'Earned / Privilege Leave', annualQuota: 18, carryForwardMax: 30, isPaid: true, encashmentAllowed: true, probationAllowed: false, requiresAttachment: false },
    { id: 'lt-ml', code: 'ML', name: 'Maternity Leave', annualQuota: 182, carryForwardMax: 0, isPaid: true, encashmentAllowed: false, probationAllowed: true, requiresAttachment: true },
    { id: 'lt-pl', code: 'PL', name: 'Paternity Leave', annualQuota: 10, carryForwardMax: 0, isPaid: true, encashmentAllowed: false, probationAllowed: true, requiresAttachment: false },
    { id: 'lt-lop', code: 'LOP', name: 'Loss of Pay (Unpaid)', annualQuota: 365, carryForwardMax: 0, isPaid: false, encashmentAllowed: false, probationAllowed: true, requiresAttachment: false },
  ];

  const leaveBalances: LeaveBalance[] = [];
  const leaveRequests: LeaveRequest[] = [];

  const salaryStructures: SalaryStructure[] = [
    {
      id: 'sal-standard',
      name: 'Standard Indian Corporate Salary Structure (FY 2026-27)',
      description: '50% Basic, 40% HRA, PF 12%, ESI eligible under 21k, Standard PT slab',
      basicPercentageOfGross: 50,
      hraPercentageOfBasic: 40,
      daPercentageOfBasic: 10,
      conveyanceMonthly: 1600,
      medicalMonthly: 1250,
      specialAllowancePercentage: 0, // balance remainder
      epfApplicable: true,
      epfEmployerShare: 12,
      epfEmployeeShare: 12,
      epfWageCap: 15000,
      esiApplicable: true,
      esiEmployerShare: 3.25,
      esiEmployeeShare: 0.75,
      esiWageCap: 21000,
      ptApplicable: true,
      ptMonthlySlab: 200,
      tdsApplicable: true,
      lwfMonthly: 20,
    },
  ];

  const payrollPeriods: PayrollPeriod[] = [];
  const employeePayslips: EmployeePayslip[] = [];
  const jobRequisitions: JobRequisition[] = [];
  const candidates: Candidate[] = [];
  const performanceCycles: PerformanceCycle[] = [];
  const performanceGoals: PerformanceGoal[] = [];
  const expenseClaims: ExpenseClaim[] = [];
  const employeeLoans: EmployeeLoan[] = [];
  const assets: AssetRecord[] = [];
  const onboardingChecklists: OnboardingChecklistItem[] = [];
  const offboardingRecords: OffboardingRecord[] = [];
  const helpdeskTickets: HelpdeskTicket[] = [];
  const auditLogs: AuditLog[] = [];

  const statutoryRuleConfig: StatutoryRuleConfig = {
    id: 'stat-in-01',
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
        { minSalary: 0, maxSalary: 14999, taxAmount: 0 },
        { minSalary: 15000, maxSalary: 9999999, taxAmount: 200 },
      ],
      Maharashtra: [
        { minSalary: 0, maxSalary: 7500, taxAmount: 0 },
        { minSalary: 7501, maxSalary: 10000, taxAmount: 175 },
        { minSalary: 10001, maxSalary: 9999999, taxAmount: 200 },
      ],
    },
    adminVerified: true,
    lastVerifiedDate: '2026-10-01',
    verifiedBy: 'emp-admin',
    legalDisclaimer: 'STATUTORY COMPLIANCE NOTICE: Statutory rates and wage ceilings are configurable parameters. Organization administrators must verify prevailing state and national statutory mandates prior to running binding production payroll.',
  };

  const socialPosts: SocialPost[] = [];
  const wfhRequests: WorkFromHomeRequest[] = [];
  const taxDeclarations: TaxDeclaration[] = [];
  const oneOnOnes: OneOnOneMeeting[] = [];

  return {
    version: 1,
    isFirstRunSetupCompleted: true,
    companies,
    branches,
    departments,
    designations,
    grades,
    shifts,
    holidays,
    employees,
    employeeDocuments: [],
    rawBiometricPunches,
    biometricSettings,
    dailyAttendance,
    attendanceCorrectionRequests: [],
    leaveTypes,
    leaveBalances,
    leaveRequests,
    leaveLedger: [],
    salaryStructures,
    payrollPeriods,
    employeePayslips,
    jobRequisitions,
    candidates,
    performanceCycles,
    performanceGoals,
    expenseClaims,
    employeeLoans,
    assets,
    onboardingChecklists,
    offboardingRecords,
    helpdeskTickets,
    auditLogs,
    statutoryRuleConfig,
    alumniPortalEnabled: false,
    socialPosts,
    wfhRequests,
    taxDeclarations,
    oneOnOnes,
  };
}

class SiddhiDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const seed = getInitialSeed();
        return {
          ...seed,
          ...parsed,
          socialPosts: parsed.socialPosts || seed.socialPosts,
          wfhRequests: parsed.wfhRequests || seed.wfhRequests,
          taxDeclarations: parsed.taxDeclarations || seed.taxDeclarations,
          oneOnOnes: parsed.oneOnOnes || seed.oneOnOnes,
        };
      }
    } catch (e) {
      console.error('Failed to load database from disk, re-initializing seed:', e);
    }
    const seed = getInitialSeed();
    this.saveDirect(seed);
    return seed;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save() {
    this.saveDirect(this.data);
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public resetToSeed(): DatabaseSchema {
    this.data = getInitialSeed();
    this.save();
    return this.data;
  }

  public restore(backupData: DatabaseSchema): boolean {
    if (!backupData || !backupData.companies || !backupData.employees) {
      throw new Error('Invalid backup schema');
    }
    this.data = backupData;
    this.save();
    return true;
  }

  public logAudit(
    actorId: string,
    actorName: string,
    actorRole: any,
    action: string,
    module: string,
    entityId: string,
    entityName: string,
    details: string,
    ipAddress?: string
  ) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorId,
      actorName,
      actorRole,
      action,
      module,
      entityId,
      entityName,
      details,
      ipAddress,
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return log;
  }
}

export const db = new SiddhiDatabase();
