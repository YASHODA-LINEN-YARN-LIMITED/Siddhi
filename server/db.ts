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
  const branchBlr = 'br-blr';
  const branchMum = 'br-mum';

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
    {
      id: branchMum,
      companyId,
      code: 'MUM-RO',
      name: 'Mumbai Regional Office',
      address: 'Bandra Kurla Complex (BKC), Bandra East',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400051',
      isHeadquarters: false,
      geofenceEnabled: false,
      latitude: 19.0662,
      longitude: 72.8687,
      radiusMeters: 250,
    },
  ];

  const departments: Department[] = [
    { id: 'dept-eng', companyId, code: 'ENG', name: 'Engineering & Product', costCenterCode: 'CC-101' },
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
    { id: 'desig-qa', code: 'QA-ENG', title: 'Quality Assurance Specialist', departmentId: 'dept-eng', gradeLevel: 'L2' },
    { id: 'desig-recruiter', code: 'TAL-ACQ', title: 'Lead Technical Recruiter', departmentId: 'dept-hr', gradeLevel: 'L2' },
    { id: 'desig-auditor', code: 'INT-AUD', title: 'Internal Audit & Compliance Analyst', departmentId: 'dept-fin', gradeLevel: 'L3' },
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
      weeklyOffDays: [0, 6], // Sun, Sat
    },
    {
      id: 'shift-morn',
      code: 'MORN-0615',
      name: 'Early Morning Operations (6:00 AM - 2:30 PM)',
      startTime: '06:00',
      endTime: '14:30',
      graceMinutes: 10,
      halfDayHours: 4,
      fullDayHours: 8,
      breakMinutes: 30,
      isOvernight: false,
      weeklyOffDays: [0], // Sun
    },
    {
      id: 'shift-night',
      code: 'NIGHT-2206',
      name: 'Overnight Tech Support (10:00 PM - 6:30 AM)',
      startTime: '22:00',
      endTime: '06:30',
      graceMinutes: 15,
      halfDayHours: 4,
      fullDayHours: 8,
      breakMinutes: 30,
      isOvernight: true,
      weeklyOffDays: [0],
    },
  ];

  const holidays: Holiday[] = [
    { id: 'hol-1', companyId, name: 'Republic Day', date: '2026-01-26', isRestricted: false, description: 'National Holiday' },
    { id: 'hol-2', companyId, name: 'Ugadi / Gudi Padwa', date: '2026-03-20', isRestricted: false, description: 'Regional New Year' },
    { id: 'hol-3', companyId, name: 'May Day (Worker Day)', date: '2026-05-01', isRestricted: false, description: 'Labor Day' },
    { id: 'hol-4', companyId, name: 'Independence Day', date: '2026-08-15', isRestricted: false, description: 'National Holiday' },
    { id: 'hol-5', companyId, name: 'Gandhi Jayanti', date: '2026-10-02', isRestricted: false, description: 'National Holiday' },
    { id: 'hol-6', companyId, name: 'Deepavali / Diwali', date: '2026-11-08', isRestricted: false, description: 'Festival of Lights' },
    { id: 'hol-7', companyId, name: 'Christmas Day', date: '2026-12-25', isRestricted: false, description: 'Christmas' },
  ];

  const employees: Employee[] = [
    {
      id: "admin-01",
      employeeCode: "ADMIN",
      firstName: "System",
      lastName: "Administrator",
      email: "admin@siddhi-hrms.local",
      phone: "",
      gender: "OTHER",
      dateOfBirth: "1990-01-01",
      dateOfJoining: "2026-01-01",
      companyId,
      branchId: branchBlr,
      departmentId: "dept-ops",
      designationId: "desig-admin",
      gradeId: "grd-l5",
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      probationPeriodMonths: 0,
      confirmationDate: "2026-01-01",
      role: "ADMIN",
      panNumber: "",
      nationalId: "",
      pfNumber: "",
      bankName: "",
      bankAccountNumber: "",
      bankIfsc: "",
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
      address: "On-Premises Local Server",
      currentSalaryStructureId: "sal-standard",
    },
  ];

  const biometricSettings: BiometricIntegrationSettings = {
    id: 'bio-cfg-01',
    name: 'Realtime Biometric Device Connector',
    enabled: true,
    apiBaseUrl: 'https://vendorapi.com', // Representative sample endpoint as specified
    endpoint: '/attendance',
    httpMethod: 'POST',
    authType: 'BEARER',
    authCredentials: {
      token: 'demo_biometric_bearer_token_securely_stored',
    },
    requestHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    queryParams: {
      limit: '500',
    },
    requestBodyTemplate: JSON.stringify({
      from_datetime: '{{START_TIME}}',
      to_datetime: '{{END_TIME}}',
      device_sn: 'SN-009128',
    }, null, 2),
    pollingIntervalMinutes: 15,
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
