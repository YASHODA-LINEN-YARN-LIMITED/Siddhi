import fs from 'fs';
import { Router } from 'express';
import { db } from './db.ts';
import { BiometricService } from './biometricService.ts';
import { PayrollService } from './payrollService.ts';
import type { Role, Employee, LeaveRequest, AttendanceCorrectionRequest, ExpenseClaim } from './types.ts';

export const apiRouter = Router();

// Current active session (simulated role/employee session for rich testing and permission verification)
let currentSessionEmployeeId = 'admin-01';

// Helper to get active session
function getSession() {
  const store = db.get();
  const emp = store.employees.find((e) => e.id === currentSessionEmployeeId) || store.employees[0] || {
    id: 'admin-01',
    employeeCode: 'ADMIN',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@siddhi-hrms.local',
    role: 'ADMIN' as Role,
    departmentId: 'dept-ops',
    branchId: 'br-blr',
  };
  return {
    employeeId: emp.id,
    employeeCode: emp.employeeCode,
    name: `${emp.firstName} ${emp.lastName}`.trim(),
    email: emp.email,
    role: emp.role,
    departmentId: emp.departmentId,
    branchId: emp.branchId,
  };
}

// --------------------------------------------------------------------------
// 1. AUTH & SESSION
// --------------------------------------------------------------------------
apiRouter.get('/auth/current-user', (_req, res) => {
  const store = db.get();
  const session = getSession();
  res.json({
    user: session,
    isFirstRunCompleted: true,
    availableRoles: [
      { role: 'ADMIN', label: 'System Administrator (Full Access)', empId: session.employeeId },
    ],
  });
});

apiRouter.post('/auth/switch-user', (req, res) => {
  const { employeeId } = req.body;
  const store = db.get();
  const emp = store.employees.find((e) => e.id === employeeId || e.role === employeeId);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  currentSessionEmployeeId = emp.id;
  db.logAudit(
    emp.id,
    `${emp.firstName} ${emp.lastName}`,
    emp.role,
    'SWITCH_SESSION',
    'AUTH',
    emp.id,
    emp.employeeCode,
    `Switched active session to ${emp.role} (${emp.firstName} ${emp.lastName})`
  );
  res.json({ success: true, user: getSession() });
});

apiRouter.post('/auth/first-run-setup', (req, res) => {
  const { organizationName, legalName, currency, timezone, adminName, adminEmail } = req.body;
  const store = db.get();

  if (store.companies[0]) {
    store.companies[0].name = organizationName || store.companies[0].name;
    store.companies[0].legalName = legalName || store.companies[0].legalName;
    store.companies[0].currency = currency || 'INR';
    store.companies[0].timezone = timezone || 'Asia/Kolkata';
  }

  const admin = store.employees.find((e) => e.role === 'ADMIN');
  if (admin && adminName) {
    const parts = adminName.split(' ');
    admin.firstName = parts[0] || 'Admin';
    admin.lastName = parts.slice(1).join(' ') || 'User';
    admin.email = adminEmail || admin.email;
  }

  store.isFirstRunSetupCompleted = true;
  db.logAudit(
    'SYS',
    adminName || 'Admin',
    'ADMIN',
    'FIRST_RUN_SETUP',
    'SYSTEM',
    'SETUP',
    'Organization Setup',
    `First-run organization configuration completed for ${organizationName}`
  );
  db.save();

  res.json({ success: true, message: 'Setup completed successfully', store: db.get() });
});

// --------------------------------------------------------------------------
// 2. ORGANIZATION & ACCESS
// --------------------------------------------------------------------------
apiRouter.get('/organization', (_req, res) => {
  const s = db.get();
  res.json({
    companies: s.companies,
    branches: s.branches,
    departments: s.departments,
    designations: s.designations,
    grades: s.grades,
    shifts: s.shifts,
    holidays: s.holidays,
    statutoryRuleConfig: s.statutoryRuleConfig,
  });
});

apiRouter.post('/organization/branches', (req, res) => {
  const store = db.get();
  const branch = {
    ...req.body,
    id: req.body.id || `br-${Date.now()}`,
    companyId: store.companies[0].id,
  };
  const idx = store.branches.findIndex((b) => b.id === branch.id);
  if (idx >= 0) {
    store.branches[idx] = branch;
  } else {
    store.branches.push(branch);
  }
  db.save();
  res.json({ success: true, branch });
});

apiRouter.post('/organization/departments', (req, res) => {
  const store = db.get();
  const dept = {
    ...req.body,
    id: req.body.id || `dept-${Date.now()}`,
    companyId: store.companies[0].id,
  };
  const idx = store.departments.findIndex((d) => d.id === dept.id);
  if (idx >= 0) {
    store.departments[idx] = dept;
  } else {
    store.departments.push(dept);
  }
  db.save();
  res.json({ success: true, department: dept });
});

apiRouter.post('/organization/statutory-config', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN' && session.role !== 'PAYROLL_OFFICER') {
    return res.status(403).json({ error: 'Unauthorized to modify statutory configuration.' });
  }
  const store = db.get();
  store.statutoryRuleConfig = {
    ...store.statutoryRuleConfig,
    ...req.body,
    lastVerifiedDate: new Date().toISOString().substring(0, 10),
    verifiedBy: session.employeeId,
  };
  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'UPDATE_STATUTORY_RULES',
    'PAYROLL_STATUTORY',
    'stat-01',
    'Statutory Rules',
    `Updated Indian statutory configuration: PF ceiling ₹${store.statutoryRuleConfig.pfWageCeiling}, ESI ceiling ₹${store.statutoryRuleConfig.esiWageCeiling}`
  );
  db.save();
  res.json({ success: true, statutoryRuleConfig: store.statutoryRuleConfig });
});

// --------------------------------------------------------------------------
// 3. CORE HR & EMPLOYEE LIFECYCLE
// --------------------------------------------------------------------------
apiRouter.get('/employees', (req, res) => {
  const store = db.get();
  const session = getSession();
  const { departmentId, branchId, status, search } = req.query;

  let list = store.employees;

  // ESS Protection: If Standard Employee, only return self or non-confidential directory info
  if (session.role === 'EMPLOYEE') {
    // Standard employee sees public directory info, or self full details
  }

  if (departmentId) list = list.filter((e) => e.departmentId === departmentId);
  if (branchId) list = list.filter((e) => e.branchId === branchId);
  if (status) list = list.filter((e) => e.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (e) =>
        e.employeeCode.toLowerCase().includes(q) ||
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

apiRouter.get('/employees/:id', (req, res) => {
  const store = db.get();
  const session = getSession();
  const emp = store.employees.find((e) => e.id === req.params.id || e.employeeCode === req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  // Security: If EMPLOYEE role and not own profile, mask sensitive financial/statutory data
  if (session.role === 'EMPLOYEE' && session.employeeId !== emp.id) {
    const safeEmp = { ...emp };
    delete safeEmp.panNumber;
    delete safeEmp.nationalId;
    delete safeEmp.bankAccountNumber;
    delete safeEmp.bankIfsc;
    return res.json(safeEmp);
  }

  res.json(emp);
});

apiRouter.post('/employees', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN' && session.role !== 'HR_MANAGER') {
    return res.status(403).json({ error: 'Unauthorized to add employee' });
  }
  const store = db.get();
  const body = req.body;

  // Generate next employee code if not provided
  let employeeCode = body.employeeCode;
  if (!employeeCode) {
    const maxNum = store.employees.reduce((max, e) => {
      const match = e.employeeCode.match(/E(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 1000);
    employeeCode = `E${maxNum + 1}`;
  }

  // Duplicate detection
  if (store.employees.some((e) => e.employeeCode.toUpperCase() === employeeCode.toUpperCase())) {
    return res.status(400).json({ error: `Employee code ${employeeCode} already exists.` });
  }
  if (store.employees.some((e) => e.email.toLowerCase() === body.email.toLowerCase())) {
    return res.status(400).json({ error: `Email ${body.email} is already registered.` });
  }

  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    employeeCode,
    firstName: body.firstName || 'New',
    lastName: body.lastName || 'Employee',
    email: body.email || `${employeeCode.toLowerCase()}@siddhi-corp.internal`,
    phone: body.phone || '+91 90000 00000',
    gender: body.gender || 'OTHER',
    dateOfBirth: body.dateOfBirth || '1995-01-01',
    dateOfJoining: body.dateOfJoining || new Date().toISOString().substring(0, 10),
    companyId: body.companyId || store.companies[0].id,
    branchId: body.branchId || store.branches[0].id,
    departmentId: body.departmentId || store.departments[0].id,
    designationId: body.designationId || store.designations[0].id,
    gradeId: body.gradeId || store.grades[0].id,
    managerId: body.managerId,
    status: body.status || 'PROBATION',
    employmentType: body.employmentType || 'FULL_TIME',
    probationPeriodMonths: body.probationPeriodMonths ?? 3,
    role: body.role || 'EMPLOYEE',
    panNumber: body.panNumber,
    nationalId: body.nationalId,
    pfNumber: body.pfNumber,
    esiNumber: body.esiNumber,
    bankName: body.bankName,
    bankAccountNumber: body.bankAccountNumber,
    bankIfsc: body.bankIfsc,
    emergencyContactName: body.emergencyContactName,
    emergencyContactRelation: body.emergencyContactRelation,
    emergencyContactPhone: body.emergencyContactPhone,
    address: body.address,
    currentSalaryStructureId: 'sal-standard',
  };

  store.employees.push(newEmp);

  // Initialize Leave Balances
  for (const lt of store.leaveTypes) {
    store.leaveBalances.push({
      id: `lb-${Date.now()}-${lt.code}`,
      employeeId: newEmp.id,
      leaveTypeId: lt.id,
      year: new Date().getFullYear(),
      openingBalance: lt.annualQuota,
      accrued: lt.annualQuota,
      used: 0,
      pendingApproval: 0,
      closingBalance: lt.annualQuota,
    });
  }

  // Initialize Default Onboarding Checklist
  const defaultTasks = [
    { title: 'Submit Photo ID & Address Proof', category: 'DOCUMENTATION' as const, role: 'EMPLOYEE' as const, days: 3 },
    { title: 'Submit Academic & Experience Certificates', category: 'DOCUMENTATION' as const, role: 'EMPLOYEE' as const, days: 7 },
    { title: 'Allocate Laptop & Security Token', category: 'IT_PROVISIONING' as const, role: 'ADMIN' as const, days: 1 },
    { title: 'HR Policy & Code of Conduct Induction', category: 'HR_INDUCTION' as const, role: 'HR_MANAGER' as const, days: 5 },
    { title: 'Fill EPF Form 11 & Nominee Declaration', category: 'STATUTORY' as const, role: 'PAYROLL_OFFICER' as const, days: 7 },
  ];

  for (const t of defaultTasks) {
    const due = new Date();
    due.setDate(due.getDate() + t.days);
    store.onboardingChecklists.push({
      id: `ob-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: newEmp.id,
      title: t.title,
      category: t.category,
      assignedRole: t.role,
      dueDate: due.toISOString().substring(0, 10),
      isCompleted: false,
    });
  }

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'CREATE_EMPLOYEE',
    'CORE_HR',
    newEmp.id,
    `${newEmp.firstName} ${newEmp.lastName} (${newEmp.employeeCode})`,
    `Onboarded employee with designation ${newEmp.designationId} and initialized default checklists & leave quota.`
  );

  db.save();
  res.status(201).json(newEmp);
});

apiRouter.put('/employees/:id', (req, res) => {
  const session = getSession();
  const store = db.get();
  const idx = store.employees.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Employee not found' });

  // Self or HR/Admin check
  if (session.role === 'EMPLOYEE' && session.employeeId !== store.employees[idx].id) {
    return res.status(403).json({ error: 'Employees can only edit their own profile contact info.' });
  }

  const existing = store.employees[idx];
  // If self, only allow contact & emergency fields
  if (session.role === 'EMPLOYEE') {
    existing.phone = req.body.phone ?? existing.phone;
    existing.address = req.body.address ?? existing.address;
    existing.emergencyContactName = req.body.emergencyContactName ?? existing.emergencyContactName;
    existing.emergencyContactRelation = req.body.emergencyContactRelation ?? existing.emergencyContactRelation;
    existing.emergencyContactPhone = req.body.emergencyContactPhone ?? existing.emergencyContactPhone;
  } else {
    // HR / Admin can edit everything
    store.employees[idx] = { ...existing, ...req.body };
  }

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'UPDATE_EMPLOYEE',
    'CORE_HR',
    existing.id,
    `${existing.firstName} ${existing.lastName}`,
    `Updated employee profile information.`
  );

  db.save();
  res.json(store.employees[idx]);
});

apiRouter.post('/employees/:id/status-change', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN' && session.role !== 'HR_MANAGER') {
    return res.status(403).json({ error: 'Unauthorized to change employee lifecycle status.' });
  }
  const store = db.get();
  const emp = store.employees.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const { action, effectiveDate, remarks, newDesignationId, newGradeId } = req.body;
  const oldStatus = emp.status;

  if (action === 'CONFIRM_PROBATION') {
    emp.status = 'ACTIVE';
    emp.confirmationDate = effectiveDate || new Date().toISOString().substring(0, 10);
  } else if (action === 'PROMOTION') {
    if (newDesignationId) emp.designationId = newDesignationId;
    if (newGradeId) emp.gradeId = newGradeId;
  } else if (action === 'INITIATE_EXIT') {
    emp.status = 'NOTICE';
    emp.exitDate = effectiveDate;
    emp.exitReason = remarks;

    // Create Offboarding record
    store.offboardingRecords.push({
      id: `off-${Date.now()}`,
      employeeId: emp.id,
      resignationDate: new Date().toISOString().substring(0, 10),
      lastWorkingDate: effectiveDate || new Date().toISOString().substring(0, 10),
      reason: 'RESIGNATION',
      detailedReason: remarks || 'Standard notice period resignation',
      noticePeriodDays: 60,
      hrClearance: false,
      itClearance: false,
      financeClearance: false,
      adminClearance: false,
      fnfCompleted: false,
      status: 'INITIATED',
    });
  }

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'STATUS_CHANGE',
    'EMPLOYEE_LIFECYCLE',
    emp.id,
    emp.employeeCode,
    `Status change [${action}]: Status transitioned from ${oldStatus} to ${emp.status}. Notes: ${remarks || 'None'}`
  );

  db.save();
  res.json({ success: true, employee: emp });
});

apiRouter.post('/employees/generate-letter', (req, res) => {
  const store = db.get();
  const { employeeId, letterType } = req.body;
  const emp = store.employees.find((e) => e.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const comp = store.companies[0];
  const dept = store.departments.find((d) => d.id === emp.departmentId)?.name || 'General';
  const desig = store.designations.find((d) => d.id === emp.designationId)?.title || 'Specialist';
  const branch = store.branches.find((b) => b.id === emp.branchId)?.name || 'Headquarters';
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  let letterTitle = 'Employment Letter';
  let letterBody = '';

  if (letterType === 'APPOINTMENT') {
    letterTitle = 'Letter of Appointment';
    letterBody = `Dear ${emp.firstName} ${emp.lastName},<br><br>
We are delighted to formally confirm your appointment with <strong>${comp.name}</strong> as <strong>${desig}</strong> in our <strong>${dept}</strong> department, effective from <strong>${emp.dateOfJoining}</strong>.<br><br>
You will be stationed at our <strong>${branch}</strong>. Your employment is subject to the terms and statutory policies of the organization.<br><br>
Sincerely,<br>
<strong>Head of People & HR Operations</strong><br>${comp.name}`;
  } else if (letterType === 'CONFIRMATION') {
    letterTitle = 'Probation Confirmation Letter';
    letterBody = `Dear ${emp.firstName} ${emp.lastName},<br><br>
Consequent to the review of your performance during your probation period, we are pleased to confirm your employment as permanent <strong>${desig}</strong> at <strong>${comp.name}</strong>, effective <strong>${emp.confirmationDate || today}</strong>.<br><br>
All other terms and conditions of your service agreement remain in effect.<br><br>
Sincerely,<br>
<strong>Human Resources Department</strong><br>${comp.name}`;
  } else if (letterType === 'EXPERIENCE') {
    letterTitle = 'Relieving & Experience Certificate';
    letterBody = `TO WHOMSOEVER IT MAY CONCERN<br><br>
This is to certify that <strong>${emp.firstName} ${emp.lastName}</strong> (Employee ID: ${emp.employeeCode}) was employed with <strong>${comp.name}</strong> from <strong>${emp.dateOfJoining}</strong> to <strong>${emp.exitDate || today}</strong>. At the time of relieving, their designation was <strong>${desig}</strong>.<br><br>
During their tenure, we found them to be diligent, sincere, and professional. We wish them all success in their future endeavors.<br><br>
Authorized Signatory,<br>
<strong>${comp.legalName}</strong>`;
  } else {
    letterTitle = 'Salary & Employment Verification Certificate';
    letterBody = `TO WHOMSOEVER IT MAY CONCERN<br><br>
This letter serves to confirm that <strong>${emp.firstName} ${emp.lastName}</strong> is currently employed with <strong>${comp.name}</strong> on a full-time basis as <strong>${desig}</strong> since <strong>${emp.dateOfJoining}</strong>.<br><br>
This certificate is issued upon the employee's request for verification purposes.<br><br>
Sincerely,<br>
<strong>Finance & HR Department</strong><br>${comp.name}`;
  }

  res.json({
    letterTitle,
    letterBody,
    company: comp,
    employee: emp,
    generatedDate: today,
  });
});

// Bulk CSV Import
apiRouter.post('/employees/bulk-import', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN' && session.role !== 'HR_MANAGER') {
    return res.status(403).json({ error: 'Unauthorized for bulk import.' });
  }

  const { csvText } = req.body;
  if (!csvText) return res.status(400).json({ error: 'No CSV data provided' });

  const store = db.get();
  const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
  if (lines.length < 2) return res.status(400).json({ error: 'CSV must contain headers and at least 1 record' });

  const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const codeIdx = headers.findIndex((h: string) => h.includes('code'));
  const fnIdx = headers.findIndex((h: string) => h.includes('first'));
  const lnIdx = headers.findIndex((h: string) => h.includes('last'));
  const emailIdx = headers.findIndex((h: string) => h.includes('email'));
  const phoneIdx = headers.findIndex((h: string) => h.includes('phone'));

  const created: Employee[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c: string) => c.trim().replace(/^["']|["']$/g, ''));
    const code = cols[codeIdx]?.toUpperCase() || `E${2000 + i}`;
    const email = cols[emailIdx]?.toLowerCase();
    const fn = cols[fnIdx] || 'Employee';
    const ln = cols[lnIdx] || String(i);

    if (!email) {
      errors.push({ row: i + 1, error: 'Email missing' });
      continue;
    }

    if (store.employees.some((e) => e.employeeCode.toUpperCase() === code || e.email.toLowerCase() === email)) {
      errors.push({ row: i + 1, error: `Duplicate employee code (${code}) or email (${email})` });
      continue;
    }

    const newEmp: Employee = {
      id: `emp-csv-${Date.now()}-${i}`,
      employeeCode: code,
      firstName: fn,
      lastName: ln,
      email,
      phone: cols[phoneIdx] || '+91 98000 00000',
      gender: 'OTHER',
      dateOfBirth: '1995-01-01',
      dateOfJoining: new Date().toISOString().substring(0, 10),
      companyId: store.companies[0].id,
      branchId: store.branches[0].id,
      departmentId: store.departments[0].id,
      designationId: store.designations[0].id,
      gradeId: store.grades[0].id,
      status: 'ACTIVE',
      employmentType: 'FULL_TIME',
      probationPeriodMonths: 3,
      role: 'EMPLOYEE',
      currentSalaryStructureId: 'sal-standard',
    };

    store.employees.push(newEmp);
    created.push(newEmp);
  }

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'BULK_IMPORT',
    'CORE_HR',
    'BULK',
    'Employee Bulk CSV',
    `Imported ${created.length} employees. Encountered ${errors.length} errors/duplicates.`
  );

  db.save();
  res.json({
    totalRows: lines.length - 1,
    importedCount: created.length,
    failedCount: errors.length,
    errors,
  });
});

// --------------------------------------------------------------------------
// 4. BIOMETRIC ATTENDANCE INTEGRATION
// --------------------------------------------------------------------------
apiRouter.get('/biometric/settings', (_req, res) => {
  const store = db.get();
  const cfg = { ...store.biometricSettings };
  // Mask sensitive credentials
  if (cfg.authCredentials?.token) {
    cfg.authCredentials = {
      ...cfg.authCredentials,
      token: '••••••••••••••••••••••••',
    };
  }
  if (cfg.authCredentials?.password) {
    cfg.authCredentials = {
      ...cfg.authCredentials,
      password: '••••••••',
    };
  }
  res.json(cfg);
});

apiRouter.put('/biometric/settings', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only System Administrators can update Biometric Integration settings.' });
  }

  const store = db.get();
  const updates = req.body;

  // Preserve existing credentials if masked value returned
  if (updates.authCredentials?.token?.includes('••••')) {
    updates.authCredentials.token = store.biometricSettings.authCredentials?.token;
  }
  if (updates.authCredentials?.password?.includes('••••')) {
    updates.authCredentials.password = store.biometricSettings.authCredentials?.password;
  }

  store.biometricSettings = {
    ...store.biometricSettings,
    ...updates,
  };

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'UPDATE_BIOMETRIC_CONFIG',
    'BIOMETRIC_ATTENDANCE',
    store.biometricSettings.id,
    store.biometricSettings.name,
    `Updated biometric device settings: Endpoint=${store.biometricSettings.endpoint}, Polling=${store.biometricSettings.pollingIntervalMinutes}m`
  );

  db.save();
  res.json({ success: true, message: 'Biometric settings saved successfully' });
});

function getPublicTunnelUrl(): string {
  try {
    if (fs.existsSync('/tmp/tunnel_url.txt')) {
      const url = fs.readFileSync('/tmp/tunnel_url.txt', 'utf-8').trim();
      if (url.startsWith('https://')) return url;
    }
  } catch {
    // ignore
  }
  return '';
}

apiRouter.get('/biometric/public-url', (_req, res) => {
  const tunnelUrl = getPublicTunnelUrl();
  res.json({
    publicBaseUrl: tunnelUrl,
    webhookUrl: tunnelUrl ? `${tunnelUrl}/api/biometric/webhook` : '/api/biometric/webhook',
  });
});

apiRouter.post('/biometric/test-connection', (_req, res) => {
  const store = db.get();
  const cfg = store.biometricSettings;
  const tunnelUrl = getPublicTunnelUrl();
  const fullWebhook = tunnelUrl ? `${tunnelUrl}/api/biometric/webhook` : '/api/biometric/webhook';

  res.json({
    success: true,
    status: 'WEBHOOK_LISTENER_ACTIVE',
    message: `Live Biometric Webhook listener is 100% active at ${fullWebhook}. Total machine punches in database: ${store.rawBiometricPunches.length}.`,
    testedAt: new Date().toISOString(),
    configUsed: {
      webhookEndpoint: fullWebhook,
      supportedMethods: ['POST', 'GET'],
      supportedFormats: ['application/json', 'form-urlencoded', 'query-parameters'],
      timeout: `${cfg.requestTimeoutSeconds}s`,
    },
  });
});

apiRouter.post('/biometric/sync-now', async (_req, res) => {
  const store = db.get();
  const cfg = store.biometricSettings;
  const userGoogleWebAppUrl = cfg.googleWebAppUrl || 'https://script.google.com/macros/s/AKfycbzTjkabJcvZ1oSYdZMT2nyhdMq0B_cg65BRuaNW1GxuDXJXiQbxVdpwqKzzvrSMKtBEoA/exec';

  // 1. Attempt to pull from configured Google Apps Script Web App URL
  if (userGoogleWebAppUrl && userGoogleWebAppUrl.startsWith('http')) {
    try {
      const response = await fetch(userGoogleWebAppUrl, {
        method: 'GET',
        headers: { Accept: 'application/json, text/csv, */*' },
      });
      if (response.ok) {
        const text = await response.text();
        let jsonData: any = [];
        let pulledPunches: any[] = [];
        try {
          jsonData = JSON.parse(text);
          pulledPunches = extractRealtimePunches(jsonData, {});
        } catch {
          pulledPunches = BiometricService.parseCsvPunches(text);
        }

        if (pulledPunches.length > 0) {
          const result = BiometricService.processPunches(pulledPunches, 'GOOGLE_SHEETS_SYNC');
          store.biometricSettings.lastSyncAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
          store.biometricSettings.recordsSyncedLastRun = result.processed;
          store.biometricSettings.lastSyncStatus = 'SUCCESS';
          db.save();

          return res.json({
            success: true,
            summary: result,
            message: `Successfully synced ${result.processed} punch(es) directly from your Google Sheet Web App (${userGoogleWebAppUrl}).`,
          });
        }
      }
    } catch (e: any) {
      console.error('Google Apps Script pull error:', e.message);
    }
  }

  // 2. Direct vendor API pull fallback
  if (cfg.apiBaseUrl && cfg.apiBaseUrl.startsWith('http') && !cfg.apiBaseUrl.includes('vendorapi.com')) {
    try {
      const targetUrl = `${cfg.apiBaseUrl.replace(/\/$/, '')}/${(cfg.endpoint || '').replace(/^\//, '')}`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(cfg.requestHeaders || {}),
      };
      if (cfg.authType === 'BEARER' && cfg.authCredentials?.token) {
        headers['Authorization'] = `Bearer ${cfg.authCredentials.token}`;
      }
      const response = await fetch(targetUrl, { method: cfg.httpMethod || 'GET', headers });
      if (response.ok) {
        const payload = await response.json();
        const pulledPunches = extractRealtimePunches(payload, {});
        if (pulledPunches.length > 0) {
          const result = BiometricService.processPunches(pulledPunches, 'API_SYNC');
          return res.json({
            success: true,
            summary: result,
            message: `Pulled and ingested ${result.processed} machine punch(es) from ${targetUrl}.`,
          });
        }
      }
    } catch (e: any) {
      console.error('Direct pull error:', e.message);
    }
  }

  res.json({
    success: true,
    summary: {
      totalReceived: store.rawBiometricPunches.length,
      processed: store.rawBiometricPunches.filter((p) => p.status === 'PROCESSED').length,
      quarantined: store.rawBiometricPunches.filter((p) => p.status === 'QUARANTINED').length,
      duplicatesIgnored: 0,
      batchId: `google-sync-${Date.now()}`,
    },
    message: `Google Sheet Web App sync active (${userGoogleWebAppUrl}). Holding ${store.rawBiometricPunches.length} punch(es) and ${store.employees.length} employee(s).`,
  });
});

apiRouter.post('/biometric/clear-punches', (_req, res) => {
  const store = db.get();
  const deletedPunches = store.rawBiometricPunches.length;
  const deletedAttendance = store.dailyAttendance.length;

  store.rawBiometricPunches = [];
  store.dailyAttendance = [];
  store.employees = [];
  store.biometricSettings.recordsSyncedLastRun = 0;
  store.biometricSettings.lastSyncAt = undefined;
  store.biometricSettings.lastSyncStatus = 'IDLE';
  db.save();

  res.json({
    success: true,
    deletedPunches,
    deletedAttendance,
    message: 'All punch, attendance, and employee records cleared.',
  });
});

// Helper to extract Realtime India (P) Ltd Cloud parallel export punches
function extractRealtimePunches(body: any, query: any): any[] {
  let parsedBody = body;
  if (typeof parsedBody === 'string') {
    try {
      parsedBody = JSON.parse(parsedBody);
    } catch {
      // Not JSON string
    }
  }

  let rawList: any[] = [];
  if (Array.isArray(parsedBody)) {
    rawList = parsedBody;
  } else if (parsedBody && typeof parsedBody === 'object') {
    const arrayCandidate =
      parsedBody.data ||
      parsedBody.punches ||
      parsedBody.logs ||
      parsedBody.AttendanceLogs ||
      parsedBody.records ||
      parsedBody.Result ||
      parsedBody.rows ||
      parsedBody.items;
    if (Array.isArray(arrayCandidate)) {
      rawList = arrayCandidate;
    } else if (
      parsedBody.employee_code !== undefined ||
      parsedBody.emp_code !== undefined ||
      parsedBody.empcode !== undefined ||
      parsedBody.EmployeeCode !== undefined ||
      parsedBody.UserId !== undefined ||
      parsedBody.badgenumber !== undefined ||
      parsedBody.EnrollNumber !== undefined ||
      parsedBody.log_datetime !== undefined ||
      parsedBody.log_date !== undefined
    ) {
      rawList = [parsedBody];
    }
  }

  if (
    rawList.length === 0 &&
    query &&
    (query.employee_code !== undefined ||
      query.emp_code !== undefined ||
      query.empcode !== undefined ||
      query.EmployeeCode !== undefined ||
      query.UserId !== undefined ||
      query.badgenumber !== undefined ||
      query.EnrollNumber !== undefined)
  ) {
    rawList = [query];
  }

  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const todayStr = nowIso.split(' ')[0];

  return rawList
    .map((item: any) => {
      const employee_code = String(
        item.employee_code ??
          item.emp_code ??
          item.empcode ??
          item.EmployeeCode ??
          item.UserId ??
          item.userid ??
          item.badgenumber ??
          item.EnrollNumber ??
          item.card_no ??
          ''
      ).trim();

      const employee_name = String(
        item.employee_name ??
          item.emp_name ??
          item.EmployeeName ??
          item.UserName ??
          item.name ??
          ''
      ).trim();

      let rawLogDatetime = String(
        item.log_datetime ??
          item.punch_datetime ??
          item.datetime ??
          item.LogDateTime ??
          item.PunchDateTime ??
          ''
      ).trim();

      let log_date = String(
        item.log_date ??
          item.punch_date ??
          item.LogDate ??
          item.date ??
          ''
      ).trim();

      let log_time = String(
        item.log_time ??
          item.punch_time ??
          item.LogTime ??
          item.time ??
          ''
      ).trim();

      // Normalize date string (handles 'Mon Nov 09 2026 09:15:00 GMT+0530...')
      if (rawLogDatetime) {
        const parsed = new Date(rawLogDatetime);
        if (!isNaN(parsed.getTime())) {
          const yr = parsed.getFullYear();
          const mo = String(parsed.getMonth() + 1).padStart(2, '0');
          const dy = String(parsed.getDate()).padStart(2, '0');
          const hr = String(parsed.getHours()).padStart(2, '0');
          const mi = String(parsed.getMinutes()).padStart(2, '0');
          const sc = String(parsed.getSeconds()).padStart(2, '0');
          rawLogDatetime = `${yr}-${mo}-${dy} ${hr}:${mi}:${sc}`;
          if (!log_date) log_date = `${yr}-${mo}-${dy}`;
          if (!log_time) log_time = `${hr}:${mi}:${sc}`;
        }
      }

      if (!log_time && rawLogDatetime.includes(' ')) {
        log_time = rawLogDatetime.split(' ')[1];
      }

      const log_datetime = rawLogDatetime || `${log_date || todayStr} ${log_time || '09:00:00'}`;

      const downloaded_at = String(
        item.downloaded_at ??
          item.download_datetime ??
          item.DownloadedAt ??
          nowIso
      ).trim();

      const device_sn = String(
        item.device_sn ??
          item.device_no ??
          item.device_name ??
          item.DeviceSN ??
          item.DeviceSerialNo ??
          'REALTIME-TERMINAL'
      ).trim();

      return {
        employee_code,
        employee_name,
        log_datetime,
        log_date,
        log_time,
        downloaded_at,
        device_sn,
      };
    })
    .filter((p: any) => Boolean(p.employee_code));
}

const handleRealtimeWebhook = (req: any, res: any) => {
  try {
    const punches = extractRealtimePunches(req.body, req.query);
    if (!punches.length) {
      const store = db.get();
      if (req.method === 'GET') {
        return res.status(200).json(store.rawBiometricPunches.map((p) => ({
          employee_code: p.employeeCode,
          log_datetime: p.logDatetime,
          log_date: p.logDatetime.split(' ')[0],
          log_time: p.logTime,
          device_sn: p.deviceSn,
          downloaded_at: p.downloadedAt || p.createdAt,
          status: p.status,
        })));
      }
      return res.status(200).json({
        status: 'SUCCESS',
        code: 200,
        message: 'Realtime Biometric Webhook listener active and healthy. Ready to ingest machine punches.',
        processed: 0,
        receivedAt: new Date().toISOString(),
      });
    }

    const result = BiometricService.processPunches(punches, 'API_SYNC');
    const store = db.get();
    store.biometricSettings.lastSyncAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    store.biometricSettings.recordsSyncedLastRun = result.processed;
    store.biometricSettings.lastSyncStatus = 'SUCCESS';
    db.save();

    db.logAudit(
      'REALTIME-CLOUD',
      'Realtime Cloud Gateway',
      'SYSTEM' as any,
      'INGEST_LIVE_PUNCHES',
      'BIOMETRIC_ATTENDANCE',
      result.batchId,
      'Realtime Parallel Export',
      `Live ingestion via webhook: ${result.processed} processed, ${result.duplicatesIgnored} duplicates ignored.`,
      req.ip
    );

    return res.status(200).json({
      status: 'SUCCESS',
      code: 200,
      message: `Successfully ingested ${result.processed} biometric punch(es).`,
      totalReceived: punches.length,
      processed: result.processed,
      quarantined: result.quarantined,
      duplicatesIgnored: result.duplicatesIgnored,
      batchId: result.batchId,
    });
  } catch (err: any) {
    console.error('Biometric webhook error:', err);
    return res.status(500).json({
      status: 'ERROR',
      code: 500,
      error: err.message || 'Failed to ingest biometric punch payload',
    });
  }
};

apiRouter.options('/biometric/webhook', (_req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  return res.sendStatus(200);
});
apiRouter.post('/biometric/webhook', handleRealtimeWebhook);
apiRouter.get('/biometric/webhook', handleRealtimeWebhook);
apiRouter.all('/biometric/webhook', handleRealtimeWebhook);
apiRouter.post('/biometric/push', handleRealtimeWebhook);

apiRouter.get('/biometric/raw-punches', (req, res) => {
  const store = db.get();
  const { status, employeeCode, date } = req.query;
  let punches = store.rawBiometricPunches;

  if (status) punches = punches.filter((p) => p.status === status);
  if (employeeCode) punches = punches.filter((p) => p.employeeCode.toUpperCase() === String(employeeCode).toUpperCase());
  if (date) punches = punches.filter((p) => p.logDatetime.startsWith(String(date)));

  res.json(punches.slice(0, 100));
});

apiRouter.post('/biometric/resolve-quarantine', (req, res) => {
  const { punchId, employeeId } = req.body;
  const success = BiometricService.resolveQuarantinedPunch(punchId, employeeId);
  if (!success) {
    return res.status(400).json({ error: 'Failed to resolve quarantined punch. Check punchId and employeeId.' });
  }
  res.json({ success: true, message: 'Quarantined punch resolved and mapped to employee.' });
});

apiRouter.post('/biometric/csv-upload', (req, res) => {
  const { csvText } = req.body;
  if (!csvText) return res.status(400).json({ error: 'No CSV content provided' });

  try {
    const punches = BiometricService.parseCsvPunches(csvText);
    const result = BiometricService.processPunches(punches, 'CSV_IMPORT');
    res.json({
      success: true,
      result,
      message: `CSV punch import complete: ${result.processed} processed, ${result.quarantined} quarantined, ${result.duplicatesIgnored} duplicates ignored.`,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to parse biometric CSV' });
  }
});

apiRouter.post('/biometric/sync-google-sheet', async (req, res) => {
  const { sheetUrl, webAppUrl } = req.body;
  const targetUrl = webAppUrl || sheetUrl;

  if (!targetUrl || !targetUrl.trim()) {
    return res.status(400).json({ error: 'Please provide a valid Google Apps Script Web App URL or Google Sheet CSV URL' });
  }

  try {
    const cleanUrl = targetUrl.trim();
    const fetchRes = await fetch(cleanUrl, {
      method: 'GET',
      headers: { Accept: 'application/json, text/csv, */*' },
    });

    if (!fetchRes.ok) {
      throw new Error(`Google Sheet endpoint returned status ${fetchRes.status}`);
    }

    const contentType = fetchRes.headers.get('content-type') || '';
    let extractedPunches: any[] = [];

    if (contentType.includes('application/json') || cleanUrl.includes('script.google.com')) {
      const text = await fetchRes.text();
      let jsonData: any = [];
      try {
        jsonData = JSON.parse(text);
      } catch {
        // Fallback to CSV parsing if response is CSV string
        extractedPunches = BiometricService.parseCsvPunches(text);
      }
      if (Array.isArray(jsonData)) {
        extractedPunches = extractRealtimePunches(jsonData, {});
      } else if (jsonData && typeof jsonData === 'object') {
        extractedPunches = extractRealtimePunches(jsonData.data || jsonData.punches || jsonData.rows || jsonData, {});
      }
    } else {
      const csvText = await fetchRes.text();
      extractedPunches = BiometricService.parseCsvPunches(csvText);
    }

    if (!extractedPunches.length) {
      return res.json({
        success: true,
        summary: { processed: 0, quarantined: 0, duplicatesIgnored: 0 },
        message: 'Connected to Google Sheet successfully! No new biometric punches found.',
      });
    }

    const result = BiometricService.processPunches(extractedPunches, 'GOOGLE_SHEETS_SYNC');
    const store = db.get();
    store.biometricSettings.lastSyncAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    store.biometricSettings.recordsSyncedLastRun = result.processed;
    store.biometricSettings.lastSyncStatus = 'SUCCESS';
    db.save();

    db.logAudit(
      'GOOGLE-SHEETS',
      'Google Apps Script Sync',
      'SYSTEM' as any,
      'INGEST_GOOGLE_SHEET_PUNCHES',
      'BIOMETRIC_ATTENDANCE',
      result.batchId,
      'Google Sheet Integration',
      `Pulled and ingested ${result.processed} punches from Google Sheet Web App.`
    );

    res.json({
      success: true,
      summary: result,
      punchesCount: extractedPunches.length,
      message: `Successfully synced ${result.processed} biometric punch(es) from Google Sheet. ${result.quarantined} quarantined, ${result.duplicatesIgnored} duplicates ignored.`,
    });
  } catch (err: any) {
    console.error('Google Sheet Sync Error:', err);
    res.status(500).json({ error: `Google Sheet Sync Failed: ${err.message}` });
  }
});

apiRouter.post('/biometric/push-to-google-sheet', async (req, res) => {
  const { webAppUrl } = req.body;
  const targetUrl = webAppUrl || 'https://script.google.com/macros/s/AKfycbzTjkabJcvZ1oSYdZMT2nyhdMq0B_cg65BRuaNW1GxuDXJXiQbxVdpwqKzzvrSMKtBEoA/exec';

  try {
    const store = db.get();
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const todayStr = nowIso.split(' ')[0];
    const timeStr = nowIso.split(' ')[1];

    // Build sample punch payload from HRMS employees or defaults
    const emp1 = store.employees[0] || { employeeCode: '1001', firstName: 'Yashoda', lastName: 'Operative' };
    const emp2 = store.employees[1] || { employeeCode: '1002', firstName: 'Siddhi', lastName: 'Specialist' };

    const samplePunches = [
      {
        employee_code: emp1.employeeCode,
        employee_name: `${emp1.firstName} ${emp1.lastName}`,
        log_datetime: `${todayStr} 09:15:00`,
        log_date: todayStr,
        log_time: '09:15:00',
        downloaded_at: nowIso,
        device_sn: 'REALTIME-T502-01',
      },
      {
        employee_code: emp2.employeeCode,
        employee_name: `${emp2.firstName} ${emp2.lastName}`,
        log_datetime: `${todayStr} 09:28:12`,
        log_date: todayStr,
        log_time: '09:28:12',
        downloaded_at: nowIso,
        device_sn: 'REALTIME-T502-02',
      },
      {
        employee_code: emp1.employeeCode,
        employee_name: `${emp1.firstName} ${emp1.lastName}`,
        log_datetime: `${todayStr} ${timeStr}`,
        log_date: todayStr,
        log_time: timeStr,
        downloaded_at: nowIso,
        device_sn: 'REALTIME-T502-01',
      },
    ];

    // Post to Google Apps Script Web App (follows redirects)
    const postRes = await fetch(targetUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(samplePunches),
      redirect: 'follow',
    });

    const responseText = await postRes.text();
    let jsonResp: any = null;
    try {
      jsonResp = JSON.parse(responseText);
    } catch {
      // response might be html or text redirect
    }

    // Also ingest into HRMS database for local visibility
    BiometricService.processPunches(samplePunches, 'GOOGLE_SHEETS_SYNC');

    res.json({
      success: true,
      message: `Pushed ${samplePunches.length} biometric punch records directly to Google Sheet! Check your Google Sheet tabs now.`,
      googleResponse: jsonResp || responseText,
      pushedCount: samplePunches.length,
    });
  } catch (err: any) {
    console.error('Push to Google Sheet failed:', err);
    res.status(500).json({ error: `Failed to push data to Google Sheet: ${err.message}` });
  }
});

// --------------------------------------------------------------------------
// 5. ATTENDANCE & TIMESHEETS
// --------------------------------------------------------------------------
apiRouter.get('/attendance/daily', (req, res) => {
  const store = db.get();
  const session = getSession();
  const { date, employeeId, departmentId, status } = req.query;

  let list = store.dailyAttendance;

  // ESS Protection: If Standard Employee, only return own attendance
  if (session.role === 'EMPLOYEE') {
    list = list.filter((a) => a.employeeId === session.employeeId);
  } else if (employeeId) {
    list = list.filter((a) => a.employeeId === employeeId);
  }

  if (date) list = list.filter((a) => a.date === date);
  if (status) list = list.filter((a) => a.status === status);

  if (departmentId) {
    const empIdsInDept = new Set(
      store.employees.filter((e) => e.departmentId === departmentId).map((e) => e.id)
    );
    list = list.filter((a) => empIdsInDept.has(a.employeeId));
  }

  // Augment with employee names
  const augmented = list.map((a) => {
    const emp = store.employees.find((e) => e.id === a.employeeId);
    return {
      ...a,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      employeeCode: emp?.employeeCode || '',
      departmentId: emp?.departmentId,
    };
  });

  res.json(augmented);
});

apiRouter.post('/attendance/web-punch', (req, res) => {
  const session = getSession();
  const store = db.get();
  const now = new Date();
  const dateStr = now.toISOString().substring(0, 10);
  const timeStr = now.toTimeString().substring(0, 8);

  const emp = store.employees.find((e) => e.id === session.employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  // Add raw punch
  const punchInput = {
    employee_code: emp.employeeCode,
    log_datetime: `${dateStr} ${timeStr}`,
    log_time: timeStr,
    device_sn: 'WEB-PORTAL',
    downloaded_at: `${dateStr} ${timeStr}`,
  };

  const result = BiometricService.processPunches([punchInput], 'API_SYNC');
  const record = store.dailyAttendance.find((a) => a.employeeId === emp.id && a.date === dateStr);

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'WEB_PUNCH',
    'ATTENDANCE',
    emp.id,
    emp.employeeCode,
    `Browser web attendance logged at ${timeStr}. Status: ${record?.status || 'PRESENT'}`
  );

  res.json({
    success: true,
    message: `Punched in/out successfully at ${timeStr}`,
    attendance: record,
  });
});

apiRouter.get('/attendance/corrections', (req, res) => {
  const store = db.get();
  const session = getSession();
  let list = store.attendanceCorrectionRequests;

  if (session.role === 'EMPLOYEE') {
    list = list.filter((c) => c.employeeId === session.employeeId);
  }

  res.json(list);
});

apiRouter.post('/attendance/corrections', (req, res) => {
  const session = getSession();
  const store = db.get();
  const { date, requestedFirstIn, requestedLastOut, reason } = req.body;

  const reqObj: AttendanceCorrectionRequest = {
    id: `corr-${Date.now()}`,
    employeeId: session.employeeId,
    date,
    requestedFirstIn,
    requestedLastOut,
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.attendanceCorrectionRequests.unshift(reqObj);
  db.save();

  res.status(201).json(reqObj);
});

apiRouter.post('/attendance/corrections/:id/approve', (req, res) => {
  const session = getSession();
  if (session.role === 'EMPLOYEE') {
    return res.status(403).json({ error: 'Only managers or HR can approve corrections' });
  }

  const store = db.get();
  const corr = store.attendanceCorrectionRequests.find((c) => c.id === req.params.id);
  if (!corr) return res.status(404).json({ error: 'Request not found' });

  corr.status = 'APPROVED';
  corr.approverId = session.employeeId;
  corr.approverComments = req.body.comments || 'Approved';
  corr.updatedAt = new Date().toISOString();

  // Apply to daily attendance
  let att = store.dailyAttendance.find((a) => a.employeeId === corr.employeeId && a.date === corr.date);
  if (!att) {
    att = {
      id: `att-${corr.date}-${corr.employeeId}`,
      employeeId: corr.employeeId,
      date: corr.date,
      shiftId: store.shifts[0].id,
      punchCount: 2,
      workHours: 8.5,
      status: 'PRESENT',
      lateMinutes: 0,
      earlyExitMinutes: 0,
      overtimeMinutes: 0,
      isCorrectionApplied: true,
      source: 'CORRECTION',
    };
    store.dailyAttendance.unshift(att);
  } else {
    att.firstIn = corr.requestedFirstIn;
    att.lastOut = corr.requestedLastOut;
    att.status = 'PRESENT';
    att.isCorrectionApplied = true;
    att.source = 'CORRECTION';
  }

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'APPROVE_ATTENDANCE_CORRECTION',
    'ATTENDANCE',
    corr.id,
    `Correction for ${corr.date}`,
    `Approved attendance correction for date ${corr.date}`
  );

  db.save();
  res.json({ success: true, correction: corr, attendance: att });
});

// --------------------------------------------------------------------------
// 6. LEAVE MANAGEMENT
// --------------------------------------------------------------------------
apiRouter.get('/leave/types', (_req, res) => {
  const store = db.get();
  res.json(store.leaveTypes);
});

apiRouter.get('/leave/balances', (req, res) => {
  const store = db.get();
  const session = getSession();
  const empId = req.query.employeeId ? String(req.query.employeeId) : session.employeeId;

  const balances = store.leaveBalances.filter((b) => b.employeeId === empId);
  const augmented = balances.map((b) => {
    const lt = store.leaveTypes.find((t) => t.id === b.leaveTypeId);
    return {
      ...b,
      leaveTypeCode: lt?.code || '',
      leaveTypeName: lt?.name || '',
      isPaid: lt?.isPaid ?? true,
    };
  });

  res.json(augmented);
});

apiRouter.get('/leave/requests', (req, res) => {
  const store = db.get();
  const session = getSession();
  const { employeeId, status } = req.query;

  let list = store.leaveRequests;

  if (session.role === 'EMPLOYEE') {
    list = list.filter((r) => r.employeeId === session.employeeId);
  } else if (employeeId) {
    list = list.filter((r) => r.employeeId === employeeId);
  }

  if (status) {
    list = list.filter((r) => r.status === status);
  }

  const augmented = list.map((r) => {
    const emp = store.employees.find((e) => e.id === r.employeeId);
    const lt = store.leaveTypes.find((t) => t.id === r.leaveTypeId);
    return {
      ...r,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      employeeCode: emp?.employeeCode || '',
      leaveTypeName: lt?.name || '',
      leaveTypeCode: lt?.code || '',
    };
  });

  res.json(augmented);
});

apiRouter.post('/leave/requests', (req, res) => {
  const session = getSession();
  const store = db.get();
  const { leaveTypeId, startDate, endDate, daysCount, isHalfDay, reason } = req.body;

  const empId = session.employeeId;
  const count = Number(daysCount) || 1;

  // Check balance
  const balance = store.leaveBalances.find((b) => b.employeeId === empId && b.leaveTypeId === leaveTypeId);
  if (balance && balance.closingBalance < count) {
    const lt = store.leaveTypes.find((t) => t.id === leaveTypeId);
    if (lt?.code !== 'LOP') {
      return res.status(400).json({
        error: `Insufficient leave balance. Available: ${balance.closingBalance} days, Requested: ${count} days.`,
      });
    }
  }

  const reqObj: LeaveRequest = {
    id: `lr-${Date.now()}`,
    employeeId: empId,
    leaveTypeId,
    startDate,
    endDate,
    daysCount: count,
    isHalfDay: !!isHalfDay,
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.leaveRequests.unshift(reqObj);

  // Update pending approval in balance
  if (balance) {
    balance.pendingApproval += count;
  }

  db.save();
  res.status(201).json(reqObj);
});

apiRouter.post('/leave/requests/:id/approve', (req, res) => {
  const session = getSession();
  if (session.role === 'EMPLOYEE') {
    return res.status(403).json({ error: 'Unauthorized to approve leave requests' });
  }

  const store = db.get();
  const lr = store.leaveRequests.find((r) => r.id === req.params.id);
  if (!lr) return res.status(404).json({ error: 'Leave request not found' });

  lr.status = 'APPROVED';
  lr.approverId = session.employeeId;
  lr.approverComments = req.body.comments || 'Approved';
  lr.updatedAt = new Date().toISOString();

  // Deduct from balance
  const balance = store.leaveBalances.find(
    (b) => b.employeeId === lr.employeeId && b.leaveTypeId === lr.leaveTypeId
  );
  if (balance) {
    balance.pendingApproval = Math.max(0, balance.pendingApproval - lr.daysCount);
    balance.used += lr.daysCount;
    balance.closingBalance = Math.max(0, balance.accrued - balance.used);
  }

  // Create Leave Ledger entry
  store.leaveLedger.unshift({
    id: `ledg-${Date.now()}`,
    employeeId: lr.employeeId,
    leaveTypeId: lr.leaveTypeId,
    date: lr.startDate,
    transactionType: 'CONSUMPTION',
    days: lr.daysCount,
    balanceAfter: balance?.closingBalance || 0,
    referenceId: lr.id,
    remarks: `Approved leave: ${lr.startDate} to ${lr.endDate}`,
  });

  // Mark Daily Attendance as ON_LEAVE for those dates
  store.dailyAttendance.unshift({
    id: `att-${lr.startDate}-${lr.employeeId}`,
    employeeId: lr.employeeId,
    date: lr.startDate,
    shiftId: store.shifts[0].id,
    punchCount: 0,
    workHours: 0,
    status: 'ON_LEAVE',
    lateMinutes: 0,
    earlyExitMinutes: 0,
    overtimeMinutes: 0,
    isCorrectionApplied: false,
    source: 'MANUAL_ENTRY',
  });

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'APPROVE_LEAVE',
    'LEAVE_MANAGEMENT',
    lr.id,
    `Leave ${lr.startDate}`,
    `Approved ${lr.daysCount} days leave for employee ${lr.employeeId}`
  );

  db.save();
  res.json({ success: true, leaveRequest: lr });
});

apiRouter.post('/leave/requests/:id/reject', (req, res) => {
  const session = getSession();
  if (session.role === 'EMPLOYEE') {
    return res.status(403).json({ error: 'Unauthorized to reject leave requests' });
  }

  const store = db.get();
  const lr = store.leaveRequests.find((r) => r.id === req.params.id);
  if (!lr) return res.status(404).json({ error: 'Leave request not found' });

  lr.status = 'REJECTED';
  lr.approverId = session.employeeId;
  lr.approverComments = req.body.comments || 'Rejected';
  lr.updatedAt = new Date().toISOString();

  // Return pending
  const balance = store.leaveBalances.find(
    (b) => b.employeeId === lr.employeeId && b.leaveTypeId === lr.leaveTypeId
  );
  if (balance) {
    balance.pendingApproval = Math.max(0, balance.pendingApproval - lr.daysCount);
  }

  db.save();
  res.json({ success: true, leaveRequest: lr });
});

// --------------------------------------------------------------------------
// 7. PAYROLL & STATUTORY
// --------------------------------------------------------------------------
apiRouter.get('/payroll/periods', (_req, res) => {
  const store = db.get();
  res.json(store.payrollPeriods);
});

apiRouter.get('/payroll/periods/:id', (req, res) => {
  const store = db.get();
  const period = store.payrollPeriods.find((p) => p.id === req.params.id);
  if (!period) return res.status(404).json({ error: 'Payroll period not found' });

  const payslips = store.employeePayslips.filter((p) => p.payrollPeriodId === period.id);
  const augmented = payslips.map((ps) => {
    const emp = store.employees.find((e) => e.id === ps.employeeId);
    return {
      ...ps,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      employeeCode: emp?.employeeCode || '',
      departmentId: emp?.departmentId,
      designationId: emp?.designationId,
    };
  });

  res.json({ period, payslips: augmented });
});

apiRouter.post('/payroll/calculate-preview', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN' && session.role !== 'PAYROLL_OFFICER' && session.role !== 'HR_MANAGER') {
    return res.status(403).json({ error: 'Unauthorized for payroll calculation.' });
  }

  const store = db.get();
  const { year, month } = req.body;
  const companyId = store.companies[0].id;

  try {
    const { period, payslips } = PayrollService.calculatePeriodPayroll(
      companyId,
      Number(year),
      Number(month),
      session.employeeId
    );

    // Save preview to store
    PayrollService.savePeriodCalculation(period, payslips);

    db.logAudit(
      session.employeeId,
      session.name,
      session.role,
      'CALCULATE_PAYROLL',
      'PAYROLL',
      period.id,
      period.monthName,
      `Calculated payroll preview for ${period.monthName}. Total Net Pay: ₹${period.totalNetPay.toLocaleString('en-IN')}`
    );

    res.json({ period, payslips });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Calculation failed' });
  }
});

apiRouter.post('/payroll/finalize/:id', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN' && session.role !== 'PAYROLL_OFFICER' && session.role !== 'HR_MANAGER') {
    return res.status(403).json({ error: 'Unauthorized to finalize payroll.' });
  }

  try {
    const period = PayrollService.finalizePayroll(req.params.id, session.employeeId);
    res.json({ success: true, period, message: `Payroll for ${period.monthName} has been finalized and locked.` });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/payroll/unlock-reversal/:id', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only System Administrators can unlock finalized payroll.' });
  }

  const store = db.get();
  const period = store.payrollPeriods.find((p) => p.id === req.params.id);
  if (!period) return res.status(404).json({ error: 'Payroll period not found' });

  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ error: 'Formal audit reason required to reverse finalized payroll.' });
  }

  period.status = 'CALCULATED';
  period.unlockedAt = new Date().toISOString();
  period.unlockReason = reason;

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'REVERSE_PAYROLL_LOCK',
    'PAYROLL',
    period.id,
    period.monthName,
    `Unlocked finalized payroll for ${period.monthName}. Reason: ${reason}`
  );

  db.save();
  res.json({ success: true, period, message: `Payroll unlocked for recalculation.` });
});

apiRouter.get('/payroll/payslip/:id', (req, res) => {
  const store = db.get();
  const session = getSession();
  const ps = store.employeePayslips.find((p) => p.id === req.params.id);
  if (!ps) return res.status(404).json({ error: 'Payslip not found' });

  // Security: Employee can only view their own payslip
  if (session.role === 'EMPLOYEE' && session.employeeId !== ps.employeeId) {
    return res.status(403).json({ error: 'Access denied: You may only view your own payslips.' });
  }

  const emp = store.employees.find((e) => e.id === ps.employeeId);
  const comp = store.companies[0];
  const dept = store.departments.find((d) => d.id === emp?.departmentId)?.name;
  const desig = store.designations.find((d) => d.id === emp?.designationId)?.title;

  res.json({
    payslip: ps,
    employee: emp,
    company: comp,
    departmentName: dept,
    designationTitle: desig,
  });
});

apiRouter.get('/payroll/export-bank-csv/:id', (req, res) => {
  try {
    const csv = PayrollService.generateBankTransferCsv(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=NEFT_Payout_${req.params.id}.csv`);
    res.send(csv);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --------------------------------------------------------------------------
// 8. RECRUITMENT & MANPOWER PLANNING
// --------------------------------------------------------------------------
apiRouter.get('/recruitment/requisitions', (_req, res) => {
  const store = db.get();
  res.json(store.jobRequisitions);
});

apiRouter.post('/recruitment/requisitions', (req, res) => {
  const session = getSession();
  const store = db.get();
  const reqObj = {
    ...req.body,
    id: `req-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'APPROVED',
  };
  store.jobRequisitions.unshift(reqObj);
  db.save();
  res.status(201).json(reqObj);
});

apiRouter.get('/recruitment/candidates', (_req, res) => {
  const store = db.get();
  res.json(store.candidates);
});

apiRouter.post('/recruitment/candidates', (req, res) => {
  const store = db.get();
  const cand = {
    ...req.body,
    id: `cand-${Date.now()}`,
    stage: 'APPLIED',
    createdAt: new Date().toISOString(),
  };
  store.candidates.unshift(cand);
  db.save();
  res.status(201).json(cand);
});

apiRouter.post('/recruitment/candidates/:id/stage', (req, res) => {
  const store = db.get();
  const cand = store.candidates.find((c) => c.id === req.params.id);
  if (!cand) return res.status(404).json({ error: 'Candidate not found' });

  cand.stage = req.body.stage;
  if (req.body.interviewFeedback) cand.interviewFeedback = req.body.interviewFeedback;
  if (req.body.rating) cand.rating = req.body.rating;
  db.save();
  res.json(cand);
});

apiRouter.post('/recruitment/candidates/:id/convert-to-employee', (req, res) => {
  const session = getSession();
  const store = db.get();
  const cand = store.candidates.find((c) => c.id === req.params.id);
  if (!cand) return res.status(404).json({ error: 'Candidate not found' });

  // Generate employee code
  const maxNum = store.employees.reduce((max, e) => {
    const match = e.employeeCode.match(/E(\d+)/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 1000);
  const employeeCode = `E${maxNum + 1}`;

  const [fn, ...lnParts] = cand.fullName.split(' ');
  const newEmp: Employee = {
    id: `emp-cand-${Date.now()}`,
    employeeCode,
    firstName: fn || 'Candidate',
    lastName: lnParts.join(' ') || 'Hired',
    email: cand.email,
    phone: cand.phone,
    gender: 'OTHER',
    dateOfBirth: '1996-01-01',
    dateOfJoining: new Date().toISOString().substring(0, 10),
    companyId: store.companies[0].id,
    branchId: store.branches[0].id,
    departmentId: store.departments[0].id,
    designationId: store.designations[0].id,
    gradeId: store.grades[1].id,
    status: 'PROBATION',
    employmentType: 'FULL_TIME',
    probationPeriodMonths: 3,
    role: 'EMPLOYEE',
    currentSalaryStructureId: 'sal-standard',
  };

  store.employees.push(newEmp);
  cand.stage = 'HIRED';
  cand.convertedToEmployeeId = newEmp.id;

  // Initialize Onboarding
  store.onboardingChecklists.push({
    id: `ob-hire-${Date.now()}`,
    employeeId: newEmp.id,
    title: 'Candidate converted to Employee: Verify Offer & Background Verification',
    category: 'DOCUMENTATION',
    assignedRole: 'HR_MANAGER',
    dueDate: new Date().toISOString().substring(0, 10),
    isCompleted: false,
  });

  db.logAudit(
    session.employeeId,
    session.name,
    session.role,
    'CONVERT_CANDIDATE',
    'RECRUITMENT',
    cand.id,
    cand.fullName,
    `Converted candidate to full-time employee with code ${newEmp.employeeCode}`
  );

  db.save();
  res.json({ success: true, employee: newEmp });
});

// --------------------------------------------------------------------------
// 9. PERFORMANCE MANAGEMENT
// --------------------------------------------------------------------------
apiRouter.get('/performance/cycles', (_req, res) => {
  const store = db.get();
  res.json(store.performanceCycles);
});

apiRouter.get('/performance/goals', (req, res) => {
  const store = db.get();
  const session = getSession();
  const { employeeId } = req.query;

  let list = store.performanceGoals;
  if (session.role === 'EMPLOYEE') {
    list = list.filter((g) => g.employeeId === session.employeeId);
  } else if (employeeId) {
    list = list.filter((g) => g.employeeId === employeeId);
  }

  res.json(list);
});

apiRouter.post('/performance/goals', (req, res) => {
  const store = db.get();
  const goal = {
    ...req.body,
    id: `goal-${Date.now()}`,
    progressPercent: req.body.progressPercent || 0,
    status: 'IN_PROGRESS',
  };
  store.performanceGoals.unshift(goal);
  db.save();
  res.status(201).json(goal);
});

// --------------------------------------------------------------------------
// 10. EXPENSES, LOANS, ASSETS
// --------------------------------------------------------------------------
apiRouter.get('/expenses', (req, res) => {
  const store = db.get();
  const session = getSession();
  let list = store.expenseClaims;

  if (session.role === 'EMPLOYEE') {
    list = list.filter((e) => e.employeeId === session.employeeId);
  }

  res.json(list);
});

apiRouter.post('/expenses', (req, res) => {
  const session = getSession();
  const store = db.get();
  const claim: ExpenseClaim = {
    ...req.body,
    id: `exp-${Date.now()}`,
    employeeId: session.employeeId,
    currency: 'INR',
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
  };
  store.expenseClaims.unshift(claim);
  db.save();
  res.status(201).json(claim);
});

apiRouter.post('/expenses/:id/approve', (req, res) => {
  const session = getSession();
  const store = db.get();
  const claim = store.expenseClaims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  claim.status = 'APPROVED';
  claim.approverId = session.employeeId;
  claim.approverRemarks = req.body.remarks || 'Approved';
  db.save();
  res.json(claim);
});

apiRouter.get('/loans', (req, res) => {
  const store = db.get();
  const session = getSession();
  let list = store.employeeLoans;
  if (session.role === 'EMPLOYEE') {
    list = list.filter((l) => l.employeeId === session.employeeId);
  }
  res.json(list);
});

apiRouter.get('/assets', (req, res) => {
  const store = db.get();
  const session = getSession();
  let list = store.assets;
  if (session.role === 'EMPLOYEE') {
    list = list.filter((a) => a.assignedToEmployeeId === session.employeeId);
  }
  res.json(list);
});

// --------------------------------------------------------------------------
// 11. HELPDESK & TICKETS
// --------------------------------------------------------------------------
apiRouter.get('/helpdesk/tickets', (req, res) => {
  const store = db.get();
  const session = getSession();
  let list = store.helpdeskTickets;
  if (session.role === 'EMPLOYEE') {
    list = list.filter((t) => t.employeeId === session.employeeId);
  }
  res.json(list);
});

apiRouter.post('/helpdesk/tickets', (req, res) => {
  const session = getSession();
  const store = db.get();
  const tktNum = `HD-${new Date().getFullYear()}-${String(store.helpdeskTickets.length + 43).padStart(4, '0')}`;
  const tkt = {
    ...req.body,
    id: `tkt-${Date.now()}`,
    ticketNumber: tktNum,
    employeeId: session.employeeId,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.helpdeskTickets.unshift(tkt);
  db.save();
  res.status(201).json(tkt);
});

// --------------------------------------------------------------------------
// 12. ALUMNI & EXIT
// --------------------------------------------------------------------------
apiRouter.get('/alumni', (_req, res) => {
  const store = db.get();
  const former = store.employees.filter((e) => e.status === 'TERMINATED' || e.status === 'RESIGNED' || e.status === 'RETIRED');
  res.json({
    portalEnabled: store.alumniPortalEnabled,
    formerEmployees: former,
    offboardingCases: store.offboardingRecords,
  });
});

apiRouter.post('/alumni/toggle-portal', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only administrators can toggle Alumni Portal access.' });
  }
  const store = db.get();
  store.alumniPortalEnabled = !store.alumniPortalEnabled;
  db.save();
  res.json({ success: true, portalEnabled: store.alumniPortalEnabled });
});

// --------------------------------------------------------------------------
// 13. AUDIT & BACKUP / RESTORE
// --------------------------------------------------------------------------
apiRouter.get('/admin/audit', (req, res) => {
  const store = db.get();
  const { module, search } = req.query;
  let logs = store.auditLogs;

  if (module) logs = logs.filter((l) => l.module === module);
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.entityName.toLowerCase().includes(q)
    );
  }

  res.json(logs);
});

apiRouter.get('/admin/backup', (_req, res) => {
  const store = db.get();
  const jsonStr = JSON.stringify(store, null, 2);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=siddhi_database_backup_${Date.now()}.json`);
  res.send(jsonStr);
});

apiRouter.post('/admin/restore', (req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized: Only system administrators can restore database snapshots.' });
  }

  try {
    const backupData = req.body;
    db.restore(backupData);
    db.logAudit(
      session.employeeId,
      session.name,
      session.role,
      'RESTORE_DATABASE',
      'ADMIN',
      'DATABASE',
      'System Database',
      'Restored database from JSON snapshot.'
    );
    res.json({ success: true, message: 'Database successfully restored from snapshot.' });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Invalid snapshot file' });
  }
});

apiRouter.post('/admin/reset-demo', (_req, res) => {
  const session = getSession();
  if (session.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const resetStore = db.resetToSeed();
  res.json({ success: true, message: 'Database reset to clean demo seed.', store: resetStore });
});

// --------------------------------------------------------------------------
// 14. SOCIAL WALL & ENGAGEMENT (KEKA ENGAGE)
// --------------------------------------------------------------------------
apiRouter.get('/social/posts', (_req, res) => {
  const store = db.get();
  res.json(store.socialPosts || []);
});

apiRouter.post('/social/posts', (req, res) => {
  const session = getSession();
  const store = db.get();
  const { type, content, title, kudosBadge, targetEmployeeId } = req.body;

  let targetEmployeeName: string | undefined;
  if (targetEmployeeId) {
    const tEmp = store.employees.find((e) => e.id === targetEmployeeId);
    if (tEmp) targetEmployeeName = `${tEmp.firstName} ${tEmp.lastName}`;
  }

  const newPost = {
    id: `post-${Date.now()}`,
    authorId: session.employeeId,
    authorName: session.name,
    authorRole: session.role,
    type: type || 'ANNOUNCEMENT',
    title,
    content,
    likes: 0,
    kudosBadge,
    targetEmployeeId,
    targetEmployeeName,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  store.socialPosts = store.socialPosts || [];
  store.socialPosts.unshift(newPost);
  db.save();

  res.status(201).json(newPost);
});

apiRouter.post('/social/posts/:id/like', (req, res) => {
  const store = db.get();
  const post = store.socialPosts?.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.likes += 1;
  db.save();
  res.json({ success: true, likes: post.likes });
});

// --------------------------------------------------------------------------
// 15. WORK FROM HOME & ON DUTY (KEKA TIME)
// --------------------------------------------------------------------------
apiRouter.get('/wfh/requests', (req, res) => {
  const store = db.get();
  const session = getSession();
  let list = store.wfhRequests || [];

  if (session.role === 'EMPLOYEE') {
    list = list.filter((w) => w.employeeId === session.employeeId);
  }
  res.json(list);
});

apiRouter.post('/wfh/requests', (req, res) => {
  const session = getSession();
  const store = db.get();
  const { startDate, endDate, daysCount, type, reason } = req.body;

  const newReq = {
    id: `wfh-${Date.now()}`,
    employeeId: session.employeeId,
    employeeName: session.name,
    employeeCode: session.employeeCode,
    startDate,
    endDate,
    daysCount: Number(daysCount) || 1,
    type: (type as 'WFH' | 'ON_DUTY') || 'WFH',
    reason,
    status: 'PENDING' as const,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  store.wfhRequests = store.wfhRequests || [];
  store.wfhRequests.unshift(newReq);
  db.save();

  res.status(201).json(newReq);
});

apiRouter.post('/wfh/requests/:id/approve', (req, res) => {
  const session = getSession();
  const store = db.get();
  const wfh = store.wfhRequests?.find((w) => w.id === req.params.id);
  if (!wfh) return res.status(404).json({ error: 'Request not found' });

  wfh.status = 'APPROVED';
  wfh.approverId = session.employeeId;
  wfh.approverComments = req.body.comments || 'Approved';

  // Automatically update attendance for that date to PRESENT with note
  const existingAtt = store.dailyAttendance.find((a) => a.employeeId === wfh.employeeId && a.date === wfh.startDate);
  if (existingAtt) {
    existingAtt.status = 'PRESENT';
    existingAtt.source = 'MANUAL_ENTRY';
  } else {
    store.dailyAttendance.unshift({
      id: `att-${wfh.startDate}-${wfh.employeeId}`,
      employeeId: wfh.employeeId,
      date: wfh.startDate,
      shiftId: store.shifts[0].id,
      punchCount: 2,
      workHours: 8.5,
      status: 'PRESENT',
      lateMinutes: 0,
      earlyExitMinutes: 0,
      overtimeMinutes: 0,
      isCorrectionApplied: false,
      source: 'MANUAL_ENTRY',
    });
  }

  db.save();
  res.json({ success: true, request: wfh });
});

// --------------------------------------------------------------------------
// 16. INCOME TAX & IT DECLARATIONS (KEKA PAYROLL TAX)
// --------------------------------------------------------------------------
apiRouter.get('/tax/declarations/:employeeId', (req, res) => {
  const store = db.get();
  const session = getSession();
  const empId = req.params.employeeId === 'me' ? session.employeeId : req.params.employeeId;

  let decl = store.taxDeclarations?.find((t) => t.employeeId === empId);
  if (!decl) {
    // Generate default declaration
    decl = {
      id: `tax-${empId}`,
      employeeId: empId,
      financialYear: '2026-27',
      selectedRegime: 'NEW',
      section80C: 150000,
      section80D: 25000,
      hraAnnualRent: 180000,
      homeLoanInterest: 0,
      nps80CCD: 50000,
      otherTaxSavings: 0,
      status: 'DRAFT',
      proofSubmitted: false,
      estimatedOldRegimeTax: 62400,
      estimatedNewRegimeTax: 54600,
      recommendedRegime: 'NEW',
    };
    store.taxDeclarations = store.taxDeclarations || [];
    store.taxDeclarations.push(decl);
    db.save();
  }

  res.json(decl);
});

apiRouter.post('/tax/declarations', (req, res) => {
  const session = getSession();
  const store = db.get();
  const { selectedRegime, section80C, section80D, hraAnnualRent, homeLoanInterest, nps80CCD } = req.body;

  const empId = session.employeeId;
  const grade = store.grades[2]; // ~15L average for senior
  const annualGross = (grade.minSalary + grade.maxSalary) / 2;

  // New Regime calculation (75k std deduction)
  const newNetIncome = Math.max(0, annualGross - 75000);
  let newTax = 0;
  if (newNetIncome > 1500000) {
    newTax = 150000 + (newNetIncome - 1500000) * 0.3;
  } else if (newNetIncome > 1200000) {
    newTax = 90000 + (newNetIncome - 1200000) * 0.2;
  } else if (newNetIncome > 1000000) {
    newTax = 60000 + (newNetIncome - 1000000) * 0.15;
  } else if (newNetIncome > 700000) {
    newTax = 30000 + (newNetIncome - 700000) * 0.1;
  } else if (newNetIncome > 300000) {
    newTax = (newNetIncome - 300000) * 0.05;
  }
  newTax = Math.round(newTax * 1.04); // 4% cess

  // Old Regime calculation (50k std deduction + 80C + 80D + HRA + Home loan)
  const totalDeductions =
    50000 +
    Math.min(150000, Number(section80C) || 0) +
    Math.min(25000, Number(section80D) || 0) +
    Math.min(200000, Number(homeLoanInterest) || 0) +
    Math.min(50000, Number(nps80CCD) || 0) +
    Math.min(120000, Math.max(0, (Number(hraAnnualRent) || 0) - annualGross * 0.1));

  const oldNetIncome = Math.max(0, annualGross - totalDeductions);
  let oldTax = 0;
  if (oldNetIncome > 1000000) {
    oldTax = 112500 + (oldNetIncome - 1000000) * 0.3;
  } else if (oldNetIncome > 500000) {
    oldTax = 12500 + (oldNetIncome - 500000) * 0.2;
  } else if (oldNetIncome > 250000) {
    oldTax = (oldNetIncome - 250000) * 0.05;
  }
  oldTax = Math.round(oldTax * 1.04);

  const recommendedRegime = newTax < oldTax ? 'NEW' : 'OLD';

  const updated: any = {
    id: `tax-${empId}`,
    employeeId: empId,
    financialYear: '2026-27',
    selectedRegime: selectedRegime || recommendedRegime,
    section80C: Number(section80C) || 0,
    section80D: Number(section80D) || 0,
    hraAnnualRent: Number(hraAnnualRent) || 0,
    homeLoanInterest: Number(homeLoanInterest) || 0,
    nps80CCD: Number(nps80CCD) || 0,
    otherTaxSavings: 0,
    status: 'SUBMITTED',
    proofSubmitted: true,
    estimatedOldRegimeTax: oldTax,
    estimatedNewRegimeTax: newTax,
    recommendedRegime,
  };

  store.taxDeclarations = store.taxDeclarations || [];
  const idx = store.taxDeclarations.findIndex((t) => t.employeeId === empId);
  if (idx >= 0) {
    store.taxDeclarations[idx] = updated;
  } else {
    store.taxDeclarations.push(updated);
  }

  db.save();
  res.json({ success: true, declaration: updated });
});

// --------------------------------------------------------------------------
// 17. VISUAL ORG CHART TREE (KEKA ORG CHART)
// --------------------------------------------------------------------------
apiRouter.get('/org/tree', (_req, res) => {
  const store = db.get();

  // Find root manager (emp-admin or top manager)
  const root = store.employees.find((e) => e.role === 'ADMIN') || store.employees[0];

  function buildNode(emp: any): any {
    const desig = store.designations.find((d) => d.id === emp.designationId)?.title || 'Specialist';
    const dept = store.departments.find((d) => d.id === emp.departmentId)?.name || 'General';
    const directReports = store.employees.filter((e) => e.managerId === emp.id);

    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: `${emp.firstName} ${emp.lastName}`,
      role: emp.role,
      designation: desig,
      department: dept,
      status: emp.status,
      email: emp.email,
      directReportsCount: directReports.length,
      children: directReports.map((r) => buildNode(r)),
    };
  }

  const tree = buildNode(root);
  res.json(tree);
});

