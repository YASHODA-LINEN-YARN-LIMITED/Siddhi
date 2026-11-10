/**
 * Siddhi HRMS - Type Definitions
 */

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
  financialYearStart: string; // e.g. "04-01"
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
  gradeLevel: string; // e.g. "L1", "L2", "M1"
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
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  graceMinutes: number; // e.g. 15
  halfDayHours: number; // e.g. 4
  fullDayHours: number; // e.g. 8
  breakMinutes: number; // e.g. 60
  isOvernight: boolean;
  weeklyOffDays: number[]; // 0 = Sun, 6 = Sat
}

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  isRestricted: boolean;
  description: string;
}

export interface Employee {
  id: string;
  employeeCode: string; // e.g. "E1001"
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
  nationalId?: string; // Aadhaar / SSN / ID
  pfNumber?: string;
  esiNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  address?: string;
  currentSalaryStructureId?: string;
  avatarUrl?: string;
  exitDate?: string;
  exitReason?: string;
  alumniAccessAllowed?: boolean;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  title: string;
  documentType: 'ID_PROOF' | 'ADDRESS_PROOF' | 'DEGREE' | 'CONTRACT' | 'RESUME' | 'PAYSLIP' | 'TAX_FORM' | 'OTHER';
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string;
  fileBase64?: string;
  expiryDate?: string;
  uploadedAt: string;
  verified: boolean;
}

export interface RawBiometricPunch {
  id: string;
  employeeCode: string;
  logDatetime: string; // YYYY-MM-DD HH:mm:ss
  logTime: string; // HH:mm:ss
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
  apiBaseUrl: string; // e.g. https://vendorapi.com
  googleWebAppUrl?: string;
  endpoint: string; // e.g. /attendance
  httpMethod: 'GET' | 'POST';
  authType: 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY' | 'OAUTH2';
  authCredentials: {
    username?: string;
    password?: string;
    token?: string;
    apiKeyHeader?: string;
    apiKeyValue?: string;
    clientId?: string;
    clientSecret?: string;
    tokenUrl?: string;
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
  syncCursor?: string; // e.g. last timestamp or page
  allowCsvFallback: boolean;
  timezone: string;
}

export interface DailyAttendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftId: string;
  firstIn?: string; // "09:05:00"
  lastOut?: string; // "18:15:00"
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
  updatedAt: string;
}

export interface LeaveType {
  id: string;
  code: string; // CL, SL, EL, ML, PL, LOP
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
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  isHalfDay: boolean;
  halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  attachmentUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approverId?: string;
  approverComments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveLedgerEntry {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  date: string;
  transactionType: 'OPENING' | 'ACCRUAL' | 'CONSUMPTION' | 'CANCELLATION' | 'ADJUSTMENT' | 'ENCASHMENT';
  days: number;
  balanceAfter: number;
  referenceId?: string;
  remarks: string;
}

export interface SalaryStructure {
  id: string;
  name: string;
  description: string;
  basicPercentageOfGross: number; // e.g. 50%
  hraPercentageOfBasic: number; // e.g. 40% or 50%
  daPercentageOfBasic: number; // e.g. 10%
  conveyanceMonthly: number;
  medicalMonthly: number;
  specialAllowancePercentage: number;
  epfApplicable: boolean;
  epfEmployerShare: number; // 12%
  epfEmployeeShare: number; // 12%
  epfWageCap: number; // 15000 in India
  esiApplicable: boolean;
  esiEmployerShare: number; // 3.25%
  esiEmployeeShare: number; // 0.75%
  esiWageCap: number; // 21000 in India
  ptApplicable: boolean;
  ptMonthlySlab: number; // e.g. 200
  tdsApplicable: boolean;
  lwfMonthly: number; // e.g. 20
}

export interface PayrollPeriod {
  id: string;
  companyId: string;
  year: number;
  month: number; // 1 to 12
  monthName: string; // "October 2026"
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
  month: number;
  year: number;
  monthName: string;
  totalDays: number;
  payableDays: number;
  unpaidDays: number;
  overtimeHours: number;
  overtimePay: number;
  // Earnings
  basic: number;
  hra: number;
  da: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  bonus: number;
  arrears: number;
  grossEarnings: number;
  // Deductions
  epfDeduction: number;
  esiDeduction: number;
  professionalTax: number;
  tdsTax: number;
  loanDeduction: number;
  lossOfPayDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  // Employer Share
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
  resumeFileName?: string;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW_ROUND_1' | 'INTERVIEW_ROUND_2' | 'OFFERED' | 'HIRED' | 'REJECTED';
  interviewFeedback?: string;
  rating?: number; // 1-5
  convertedToEmployeeId?: string;
  createdAt: string;
}

export interface PerformanceCycle {
  id: string;
  title: string;
  financialYear: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE_SELF_REVIEW' | 'ACTIVE_MANAGER_REVIEW' | 'CALIBRATION' | 'COMPLETED';
}

export interface PerformanceGoal {
  id: string;
  cycleId: string;
  employeeId: string;
  title: string;
  description: string;
  weightage: number; // 0 - 100
  metric: string;
  targetValue: string;
  currentValue: string;
  progressPercent: number;
  selfRating?: number;
  managerRating?: number;
  selfComments?: string;
  managerComments?: string;
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
  receiptFileName?: string;
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
  notes?: string;
}

export interface OnboardingChecklistItem {
  id: string;
  employeeId: string;
  title: string;
  category: 'DOCUMENTATION' | 'IT_PROVISIONING' | 'HR_INDUCTION' | 'MANAGER_CHECKIN' | 'STATUTORY';
  assignedRole: Role;
  assignedToUserId?: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface OffboardingRecord {
  id: string;
  employeeId: string;
  resignationDate: string;
  lastWorkingDate: string;
  reason: 'RESIGNATION' | 'TERMINATION' | 'MUTUAL_AGREEMENT' | 'RETIREMENT' | 'END_OF_CONTRACT';
  detailedReason: string;
  noticePeriodDays: number;
  hrClearance: boolean;
  itClearance: boolean;
  financeClearance: boolean;
  adminClearance: boolean;
  exitInterviewNotes?: string;
  fnfCompleted: boolean;
  status: 'INITIATED' | 'IN_CLEARANCE' | 'CLEARANCE_COMPLETE' | 'SETTLED';
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
  assignedToRole?: Role;
  resolutionComments?: string;
  createdAt: string;
  updatedAt: string;
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
  jurisdiction: 'IN'; // India
  effectiveFrom: string;
  pfWageCeiling: number; // 15000
  pfEmployeeRate: number; // 12%
  pfEmployerRate: number; // 12%
  esiWageCeiling: number; // 21000
  esiEmployeeRate: number; // 0.75%
  esiEmployerRate: number; // 3.25%
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
  financialYear: string; // e.g. "2026-27"
  selectedRegime: 'NEW' | 'OLD';
  section80C: number; // Max 150000 (PPF, ELSS, EPF, Life Insurance)
  section80D: number; // Health Insurance (Max 25000 / 50000)
  hraAnnualRent: number;
  homeLoanInterest: number; // Section 24b (Max 200000)
  nps80CCD: number; // NPS 50000
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

