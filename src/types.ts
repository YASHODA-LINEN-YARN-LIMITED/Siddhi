export type Role = 
  | 'ADMIN' 
  | 'HR_MANAGER' 
  | 'PAYROLL_OFFICER' 
  | 'MANAGER' 
  | 'EMPLOYEE' 
  | 'RECRUITER' 
  | 'AUDITOR';

export interface Company {
  id: string;
  code: string;
  name: string;
  legalName: string;
  taxId: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  financialYearStart: string;
  website: string;
  phone: string;
  email: string;
  address: string;
}

export interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isHeadquarters: boolean;
  geofenceEnabled: boolean;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export interface Department {
  id: string;
  companyId: string;
  code: string;
  name: string;
  headOfDepartmentId?: string;
  parentDepartmentId?: string;
  costCenterCode: string;
}

export interface Designation {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  gradeLevel: string;
}

export interface Grade {
  id: string;
  code: string;
  name: string;
  minSalary: number;
  maxSalary: number;
}

export interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  breakMinutes: number;
  isOvernight: boolean;
  weeklyOffDays: number[];
}

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  date: string;
  isRestricted: boolean;
  description: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  dateOfJoining: string;
  companyId: string;
  branchId: string;
  departmentId: string;
  designationId: string;
  gradeId: string;
  managerId?: string;
  status: 'ACTIVE' | 'PROBATION' | 'NOTICE' | 'TERMINATED' | 'RESIGNED' | 'RETIRED';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  probationPeriodMonths: number;
  confirmationDate?: string;
  role: Role;
  panNumber?: string;
  nationalId?: string;
  pfNumber?: string;
  esiNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  address?: string;
  avatarUrl?: string;
  exitDate?: string;
  exitReason?: string;
}

export interface RawBiometricPunch {
  id: string;
  employeeCode: string;
  logDatetime: string;
  logTime: string;
  downloadedAt?: string;
  deviceSn: string;
  syncBatchId: string;
  createdAt: string;
  status: 'PROCESSED' | 'QUARANTINED' | 'DUPLICATE';
  quarantineReason?: string;
  resolvedEmployeeId?: string;
}

export interface BiometricIntegrationSettings {
  id: string;
  name: string;
  enabled: boolean;
  apiBaseUrl: string;
  endpoint: string;
  httpMethod: 'GET' | 'POST';
  authType: 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY' | 'OAUTH2';
  authCredentials: {
    username?: string;
    password?: string;
    token?: string;
    apiKeyHeader?: string;
    apiKeyValue?: string;
  };
  requestHeaders: Record<string, string>;
  queryParams: Record<string, string>;
  requestBodyTemplate: string;
  pollingIntervalMinutes: number;
  requestTimeoutSeconds: number;
  lastSyncAt?: string;
  lastSyncStatus: 'IDLE' | 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  lastErrorMessage?: string;
  recordsSyncedLastRun: number;
  syncCursor?: string;
  allowCsvFallback: boolean;
  timezone: string;
}

export interface DailyAttendance {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentId?: string;
  date: string;
  shiftId: string;
  firstIn?: string;
  lastOut?: string;
  punchCount: number;
  workHours: number;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKLY_OFF' | 'OVERTIME';
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeMinutes: number;
  isCorrectionApplied: boolean;
  source: 'BIOMETRIC' | 'WEB_PUNCH' | 'MANUAL_ENTRY' | 'CORRECTION';
}

export interface AttendanceCorrectionRequest {
  id: string;
  employeeId: string;
  date: string;
  requestedFirstIn: string;
  requestedLastOut: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverId?: string;
  approverComments?: string;
  createdAt: string;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  annualQuota: number;
  carryForwardMax: number;
  isPaid: boolean;
  encashmentAllowed: boolean;
  probationAllowed: boolean;
  requiresAttachment: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeCode?: string;
  leaveTypeName?: string;
  isPaid?: boolean;
  year: number;
  openingBalance: number;
  accrued: number;
  used: number;
  pendingApproval: number;
  closingBalance: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  isHalfDay: boolean;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approverId?: string;
  approverComments?: string;
  createdAt: string;
}

export interface PayrollPeriod {
  id: string;
  companyId: string;
  year: number;
  month: number;
  monthName: string;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  status: 'DRAFT' | 'CALCULATED' | 'REVIEWED' | 'APPROVED' | 'LOCKED_FINALIZED' | 'PAID';
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalEmployerContributions: number;
  processedBy?: string;
  approvedBy?: string;
  finalizedAt?: string;
  unlockedAt?: string;
  unlockReason?: string;
}

export interface EmployeePayslip {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentId?: string;
  designationId?: string;
  month: number;
  year: number;
  monthName: string;
  totalDays: number;
  payableDays: number;
  unpaidDays: number;
  overtimeHours: number;
  overtimePay: number;
  basic: number;
  hra: number;
  da: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  bonus: number;
  arrears: number;
  grossEarnings: number;
  epfDeduction: number;
  esiDeduction: number;
  professionalTax: number;
  tdsTax: number;
  loanDeduction: number;
  lossOfPayDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  epfEmployer: number;
  esiEmployer: number;
  totalCtc: number;
  paymentMode: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
  paymentStatus: 'PENDING' | 'PROCESSED' | 'PAID';
}

export interface JobRequisition {
  id: string;
  title: string;
  departmentId: string;
  vacancies: number;
  hiringManagerId: string;
  targetDate: string;
  budgetMin: number;
  budgetMax: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  justification: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  requisitionId: string;
  fullName: string;
  email: string;
  phone: string;
  currentDesignation: string;
  currentCompany: string;
  experienceYears: number;
  currentCtc: number;
  expectedCtc: number;
  noticePeriodDays: number;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW_ROUND_1' | 'INTERVIEW_ROUND_2' | 'OFFERED' | 'HIRED' | 'REJECTED';
  interviewFeedback?: string;
  rating?: number;
  convertedToEmployeeId?: string;
  createdAt: string;
}

export interface PerformanceGoal {
  id: string;
  cycleId: string;
  employeeId: string;
  title: string;
  description: string;
  weightage: number;
  metric: string;
  targetValue: string;
  currentValue: string;
  progressPercent: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
}

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  category: 'TRAVEL' | 'MEALS' | 'LODGING' | 'OFFICE_SUPPLIES' | 'TRAINING' | 'CLIENT_MEETING' | 'OTHER';
  amount: number;
  currency: string;
  claimDate: string;
  description: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';
  approverId?: string;
  approverRemarks?: string;
  createdAt: string;
}

export interface EmployeeLoan {
  id: string;
  employeeId: string;
  loanType: 'SALARY_ADVANCE' | 'PERSONAL_LOAN' | 'EMERGENCY_ASSISTANCE';
  principalAmount: number;
  repaymentMonths: number;
  monthlyDeduction: number;
  disbursedDate: string;
  totalPaid: number;
  balanceRemaining: number;
  deductFromPayroll: boolean;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'REJECTED';
}

export interface AssetRecord {
  id: string;
  assetTag: string;
  name: string;
  category: 'LAPTOP' | 'MONITOR' | 'MOBILE' | 'ACCESS_CARD' | 'VEHICLE' | 'FURNITURE' | 'OTHER';
  serialNumber: string;
  assignedToEmployeeId?: string;
  assignedDate?: string;
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED';
  status: 'IN_STOCK' | 'ASSIGNED' | 'UNDER_REPAIR' | 'RETIRED';
}

export interface OnboardingChecklistItem {
  id: string;
  employeeId: string;
  title: string;
  category: 'DOCUMENTATION' | 'IT_PROVISIONING' | 'HR_INDUCTION' | 'MANAGER_CHECKIN' | 'STATUTORY';
  assignedRole: Role;
  dueDate: string;
  isCompleted: boolean;
}

export interface HelpdeskTicket {
  id: string;
  ticketNumber: string;
  employeeId: string;
  category: 'PAYROLL' | 'LEAVE_ATTENDANCE' | 'IT_HARDWARE' | 'HR_POLICY' | 'TAX_TDS' | 'FACILITIES';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolutionComments?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  module: string;
  entityId: string;
  entityName: string;
  details: string;
  ipAddress?: string;
}

export interface StatutoryRuleConfig {
  id: string;
  jurisdiction: 'IN';
  effectiveFrom: string;
  pfWageCeiling: number;
  pfEmployeeRate: number;
  pfEmployerRate: number;
  esiWageCeiling: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  ptSlabsByState: Record<string, { minSalary: number; maxSalary: number; taxAmount: number }[]>;
  adminVerified: boolean;
  lastVerifiedDate?: string;
  verifiedBy?: string;
  legalDisclaimer: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  type: 'ANNOUNCEMENT' | 'PRAISE' | 'POLL' | 'WELCOME';
  title?: string;
  content: string;
  likes: number;
  kudosBadge?: 'CUSTOMER_OBSESSED' | 'TEAM_PLAYER' | 'INNOVATOR' | 'OWNERSHIP' | 'STAR_PERFORMER';
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  pollOptions?: { id: string; label: string; votes: number }[];
  createdAt: string;
}

export interface WorkFromHomeRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  type: 'WFH' | 'ON_DUTY';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverId?: string;
  approverComments?: string;
  createdAt: string;
}

export interface TaxDeclaration {
  id: string;
  employeeId: string;
  financialYear: string;
  selectedRegime: 'NEW' | 'OLD';
  section80C: number;
  section80D: number;
  hraAnnualRent: number;
  homeLoanInterest: number;
  nps80CCD: number;
  otherTaxSavings: number;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED';
  proofSubmitted: boolean;
  estimatedOldRegimeTax: number;
  estimatedNewRegimeTax: number;
  recommendedRegime: 'NEW' | 'OLD';
}

export interface OneOnOneMeeting {
  id: string;
  managerId: string;
  employeeId: string;
  employeeName: string;
  scheduledDate: string;
  agenda: string;
  notes?: string;
  actionItems?: string[];
  status: 'SCHEDULED' | 'COMPLETED';
}

