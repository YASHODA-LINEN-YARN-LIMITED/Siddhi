import { db } from './db.ts';
import type { Employee, PayrollPeriod, EmployeePayslip, SalaryStructure } from './types.ts';

export class PayrollService {
  /**
   * Calculates payslip draft preview for all active employees for a given month/year
   */
  public static calculatePeriodPayroll(
    companyId: string,
    year: number,
    month: number,
    processedBy: string
  ): {
    period: PayrollPeriod;
    payslips: EmployeePayslip[];
  } {
    const store = db.get();
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const cutoffDate = `${year}-${String(month).padStart(2, '0')}-25`;

    const activeEmployees = store.employees.filter(
      (e) => e.companyId === companyId && e.status !== 'TERMINATED' && e.status !== 'RESIGNED'
    );

    const defaultStructure = store.salaryStructures[0];
    const statConfig = store.statutoryRuleConfig;

    const payslips: EmployeePayslip[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalEmployerContributions = 0;

    const periodId = `pay-${year}-${String(month).padStart(2, '0')}`;

    for (const emp of activeEmployees) {
      // Find grade or default CTC estimate
      const grade = store.grades.find((g) => g.id === emp.gradeId) || store.grades[1];
      const annualCtc = (grade.minSalary + grade.maxSalary) / 2;
      const nominalMonthlyGross = Math.round(annualCtc / 12);

      // Calculate attendance & unpaid days for this month
      const empAttendance = store.dailyAttendance.filter(
        (a) => a.employeeId === emp.id && a.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
      );

      // Unpaid days from LOP leave requests
      const lopRequests = store.leaveRequests.filter(
        (lr) =>
          lr.employeeId === emp.id &&
          lr.status === 'APPROVED' &&
          lr.startDate.startsWith(`${year}-${String(month).padStart(2, '0')}`)
      );
      const lopDays = lopRequests
        .filter((lr) => {
          const lt = store.leaveTypes.find((t) => t.id === lr.leaveTypeId);
          return lt && !lt.isPaid;
        })
        .reduce((sum, r) => sum + r.daysCount, 0);

      // Absences (missing or marked absent)
      const absentDays = empAttendance.filter((a) => a.status === 'ABSENT').length;
      const totalUnpaidDays = Math.min(daysInMonth, lopDays + absentDays);
      const payableDays = Math.max(0, daysInMonth - totalUnpaidDays);
      const attendanceRatio = payableDays / daysInMonth;

      // Overtime
      const totalOtMinutes = empAttendance.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0);
      const otHours = Math.round((totalOtMinutes / 60) * 10) / 10;
      // Overtime rate: (gross / 200) * 1.5
      const otHourlyRate = (nominalMonthlyGross / 200) * 1.5;
      const otPay = Math.round(otHours * otHourlyRate);

      // Prorated Gross based on payable days
      const proratedGross = Math.round(nominalMonthlyGross * attendanceRatio);

      // Earnings Breakdown
      const basicPercent = (defaultStructure.basicPercentageOfGross || 50) / 100;
      const basic = Math.round(proratedGross * basicPercent);
      const hra = Math.round(basic * ((defaultStructure.hraPercentageOfBasic || 40) / 100));
      const da = Math.round(basic * ((defaultStructure.daPercentageOfBasic || 10) / 100));
      const conveyance = defaultStructure.conveyanceMonthly || 1600;
      const medical = defaultStructure.medicalMonthly || 1250;
      const specialAllowance = Math.max(0, proratedGross - (basic + hra + da + conveyance + medical));
      const grossEarnings = basic + hra + da + conveyance + medical + specialAllowance + otPay;

      // Deductions Breakdown
      // EPF: 12% of basic capped at statutory ceiling
      let epfDeduction = 0;
      let epfEmployer = 0;
      if (defaultStructure.epfApplicable) {
        const epfBase = Math.min(basic, statConfig.pfWageCeiling || 15000);
        epfDeduction = Math.round(epfBase * ((statConfig.pfEmployeeRate || 12) / 100));
        epfEmployer = Math.round(epfBase * ((statConfig.pfEmployerRate || 12) / 100));
      }

      // ESI: 0.75% if gross <= wage ceiling (21000)
      let esiDeduction = 0;
      let esiEmployer = 0;
      if (defaultStructure.esiApplicable && grossEarnings <= (statConfig.esiWageCeiling || 21000)) {
        esiDeduction = Math.round(grossEarnings * ((statConfig.esiEmployeeRate || 0.75) / 100));
        esiEmployer = Math.round(grossEarnings * ((statConfig.esiEmployerRate || 3.25) / 100));
      }

      // Professional Tax: state based slab
      let professionalTax = defaultStructure.ptMonthlySlab || 200;
      const branch = store.branches.find((b) => b.id === emp.branchId);
      if (branch && branch.state && statConfig.ptSlabsByState[branch.state]) {
        const slabs = statConfig.ptSlabsByState[branch.state];
        const matchedSlab = slabs.find((s) => grossEarnings >= s.minSalary && grossEarnings <= s.maxSalary);
        if (matchedSlab) {
          professionalTax = matchedSlab.taxAmount;
        }
      }

      // Active Loan Deductions
      const activeLoan = store.employeeLoans.find(
        (l) => l.employeeId === emp.id && l.status === 'ACTIVE' && l.deductFromPayroll && l.balanceRemaining > 0
      );
      const loanDeduction = activeLoan ? Math.min(activeLoan.monthlyDeduction, activeLoan.balanceRemaining) : 0;

      // TDS Tax (simplified estimated slab)
      let tdsTax = 0;
      if (grossEarnings > 75000) {
        tdsTax = Math.round((grossEarnings - 75000) * 0.15);
      } else if (grossEarnings > 50000) {
        tdsTax = Math.round((grossEarnings - 50000) * 0.08);
      }

      const lwf = defaultStructure.lwfMonthly || 20;
      const otherDeductions = lwf;

      const totalDeductionsForEmp = epfDeduction + esiDeduction + professionalTax + tdsTax + loanDeduction + otherDeductions;
      const netSalary = Math.max(0, grossEarnings - totalDeductionsForEmp);
      const totalCtc = grossEarnings + epfEmployer + esiEmployer;

      const payslip: EmployeePayslip = {
        id: `ps-${periodId}-${emp.employeeCode}`,
        payrollPeriodId: periodId,
        employeeId: emp.id,
        month,
        year,
        monthName,
        totalDays: daysInMonth,
        payableDays,
        unpaidDays: totalUnpaidDays,
        overtimeHours: otHours,
        overtimePay: otPay,
        basic,
        hra,
        da,
        conveyance,
        medical,
        specialAllowance,
        bonus: 0,
        arrears: 0,
        grossEarnings,
        epfDeduction,
        esiDeduction,
        professionalTax,
        tdsTax,
        loanDeduction,
        lossOfPayDeduction: totalUnpaidDays > 0 ? Math.round(nominalMonthlyGross * (totalUnpaidDays / daysInMonth)) : 0,
        otherDeductions,
        totalDeductions: totalDeductionsForEmp,
        netSalary,
        epfEmployer,
        esiEmployer,
        totalCtc,
        paymentMode: 'BANK_TRANSFER',
        paymentStatus: 'PENDING',
      };

      payslips.push(payslip);
      totalGross += grossEarnings;
      totalDeductions += totalDeductionsForEmp;
      totalNet += netSalary;
      totalEmployerContributions += epfEmployer + esiEmployer;
    }

    const period: PayrollPeriod = {
      id: periodId,
      companyId,
      year,
      month,
      monthName,
      startDate,
      endDate,
      cutoffDate,
      status: 'CALCULATED',
      totalEmployees: payslips.length,
      totalGrossPay: totalGross,
      totalDeductions,
      totalNetPay: totalNet,
      totalEmployerContributions,
      processedBy,
    };

    return { period, payslips };
  }

  /**
   * Saves preview or recalculates and persists the period and payslips
   */
  public static savePeriodCalculation(period: PayrollPeriod, payslips: EmployeePayslip[]) {
    const store = db.get();
    const periodIdx = store.payrollPeriods.findIndex((p) => p.id === period.id);

    if (periodIdx >= 0) {
      if (store.payrollPeriods[periodIdx].status === 'LOCKED_FINALIZED') {
        throw new Error('Cannot recalculate or modify a finalized locked payroll period.');
      }
      store.payrollPeriods[periodIdx] = period;
    } else {
      store.payrollPeriods.unshift(period);
    }

    // Replace payslips for this period
    store.employeePayslips = store.employeePayslips.filter((p) => p.payrollPeriodId !== period.id);
    store.employeePayslips.push(...payslips);

    db.save();
  }

  /**
   * Finalizes and locks the payroll period. Never silently changes finalized payroll.
   */
  public static finalizePayroll(periodId: string, approvedBy: string): PayrollPeriod {
    const store = db.get();
    const period = store.payrollPeriods.find((p) => p.id === periodId);
    if (!period) throw new Error('Payroll period not found');

    period.status = 'LOCKED_FINALIZED';
    period.approvedBy = approvedBy;
    period.finalizedAt = new Date().toISOString();

    // Mark payslips as processed and reduce active loan balances
    const periodPayslips = store.employeePayslips.filter((p) => p.payrollPeriodId === periodId);
    for (const ps of periodPayslips) {
      ps.paymentStatus = 'PROCESSED';
      if (ps.loanDeduction > 0) {
        const loan = store.employeeLoans.find((l) => l.employeeId === ps.employeeId && l.status === 'ACTIVE');
        if (loan) {
          loan.totalPaid += ps.loanDeduction;
          loan.balanceRemaining = Math.max(0, loan.principalAmount - loan.totalPaid);
          if (loan.balanceRemaining === 0) {
            loan.status = 'CLOSED';
          }
        }
      }
    }

    db.logAudit(
      approvedBy,
      'Approver',
      'HR_MANAGER',
      'FINALIZE_PAYROLL',
      'PAYROLL',
      period.id,
      period.monthName,
      `Finalized & Locked Payroll for ${period.monthName}. Net payout: ₹${period.totalNetPay.toLocaleString('en-IN')}`
    );

    db.save();
    return period;
  }

  /**
   * Generates NEFT / RTGS Bank payout CSV format
   */
  public static generateBankTransferCsv(periodId: string): string {
    const store = db.get();
    const period = store.payrollPeriods.find((p) => p.id === periodId);
    if (!period) throw new Error('Period not found');

    const payslips = store.employeePayslips.filter((p) => p.payrollPeriodId === periodId);
    const headers = [
      'Beneficiary_Code',
      'Beneficiary_Name',
      'Account_Number',
      'IFSC_Code',
      'Bank_Name',
      'Amount_INR',
      'Payment_Reference',
      'Remarks',
    ];

    const rows = payslips.map((ps) => {
      const emp = store.employees.find((e) => e.id === ps.employeeId);
      const name = emp ? `${emp.firstName} ${emp.lastName}` : ps.employeeId;
      const acc = emp?.bankAccountNumber || 'NOT_CONFIGURED';
      const ifsc = emp?.bankIfsc || 'NOT_CONFIGURED';
      const bank = emp?.bankName || 'BANK';
      return [
        emp?.employeeCode || ps.employeeId,
        `"${name}"`,
        acc,
        ifsc,
        `"${bank}"`,
        ps.netSalary.toFixed(2),
        `SAL-${ps.monthName.replace(/\s+/g, '-')}`,
        `Salary Payout ${ps.monthName}`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
