import { db } from './db.ts';
import type { RawBiometricPunch, DailyAttendance } from './types.ts';

export interface PunchInput {
  employee_code: string | number;
  log_datetime: string;
  log_time: string;
  downloaded_at?: string;
  device_sn: string;
}

export class BiometricService {
  /**
   * Process an array of incoming biometric punch records idempotently
   */
  public static processPunches(punches: PunchInput[], source: 'API_SYNC' | 'CSV_IMPORT' | 'SIMULATOR' = 'API_SYNC'): {
    totalReceived: number;
    processed: number;
    quarantined: number;
    duplicatesIgnored: number;
    batchId: string;
    details: string[];
  } {
    const store = db.get();
    const batchId = `sync-${Date.now()}`;
    let processed = 0;
    let quarantined = 0;
    let duplicatesIgnored = 0;
    const details: string[] = [];

    // Map of existing punch keys to prevent duplicates
    const existingPunchKeys = new Set(
      store.rawBiometricPunches.map(
        (p) => `${p.deviceSn.trim()}#${p.employeeCode.trim()}#${p.logDatetime.trim()}`
      )
    );

    // Active employee lookup by code (supporting both E1023, 1023, and zero-padded 00001023)
    const employeeMap = new Map<string, typeof store.employees[0]>();
    store.employees.forEach((e) => {
      const codeUpper = e.employeeCode.toUpperCase().trim();
      employeeMap.set(codeUpper, e);
      const digitsOnly = codeUpper.replace(/\D/g, '');
      if (digitsOnly) {
        employeeMap.set(digitsOnly, e);
        employeeMap.set(String(parseInt(digitsOnly, 10)), e);
      }
    });

    const affectedEmployeeDates = new Set<string>();

    for (const punch of punches) {
      const codeStr = String(punch.employee_code).trim().toUpperCase();
      const deviceSn = String(punch.device_sn || 'DEVICE-UNKNOWN').trim();
      const logDatetime = String(punch.log_datetime).trim();
      const logTime = String(punch.log_time || logDatetime.split(' ')[1] || '00:00:00').trim();
      const downloadedAt = punch.downloaded_at || new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (!codeStr || !logDatetime) {
        continue;
      }

      const stableKey = `${deviceSn}#${codeStr}#${logDatetime}`;
      if (existingPunchKeys.has(stableKey)) {
        duplicatesIgnored++;
        continue;
      }

      const codeDigits = codeStr.replace(/\D/g, '');
      const codeClean = codeDigits ? String(parseInt(codeDigits, 10)) : codeStr;
      const matchedEmployee =
        employeeMap.get(codeStr) ||
        employeeMap.get(codeClean) ||
        employeeMap.get(`E${codeClean}`) ||
        employeeMap.get(codeDigits);

      if (!matchedEmployee) {
        // Quarantine invalid or unmapped employee code
        const quarantinedRecord: RawBiometricPunch = {
          id: `punch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          employeeCode: codeStr,
          logDatetime,
          logTime,
          downloadedAt,
          deviceSn,
          syncBatchId: batchId,
          createdAt: new Date().toISOString(),
          status: 'QUARANTINED',
          quarantineReason: `Unmapped Employee Code: "${codeStr}" does not match any active employee in Siddhi directory.`,
        };
        store.rawBiometricPunches.unshift(quarantinedRecord);
        existingPunchKeys.add(stableKey);
        quarantined++;
        details.push(`Quarantined record for code ${codeStr} at ${logDatetime}`);
      } else {
        // Valid punch
        const validRecord: RawBiometricPunch = {
          id: `punch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          employeeCode: codeStr,
          logDatetime,
          logTime,
          downloadedAt,
          deviceSn,
          syncBatchId: batchId,
          createdAt: new Date().toISOString(),
          status: 'PROCESSED',
          resolvedEmployeeId: matchedEmployee.id,
        };
        store.rawBiometricPunches.unshift(validRecord);
        existingPunchKeys.add(stableKey);
        processed++;

        // Track employee + date for attendance aggregation
        const punchDate = logDatetime.split(' ')[0];
        affectedEmployeeDates.add(`${matchedEmployee.id}#${punchDate}`);
      }
    }

    // Recompute daily attendance for affected employee-dates
    for (const item of affectedEmployeeDates) {
      const [empId, date] = item.split('#');
      this.recalculateDailyAttendanceForEmployeeDate(empId, date);
    }

    // Update biometric settings status
    store.biometricSettings.lastSyncAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    store.biometricSettings.lastSyncStatus = 'SUCCESS';
    store.biometricSettings.recordsSyncedLastRun = processed;
    store.biometricSettings.syncCursor = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.save();

    return {
      totalReceived: punches.length,
      processed,
      quarantined,
      duplicatesIgnored,
      batchId,
      details,
    };
  }

  /**
   * Recalculates daily attendance based on all processed biometric punches and web punches for an employee on a given date
   */
  public static recalculateDailyAttendanceForEmployeeDate(employeeId: string, date: string): DailyAttendance | null {
    const store = db.get();
    const employee = store.employees.find((e) => e.id === employeeId);
    if (!employee) return null;

    // Fetch all punches for this employee code on this date
    const punches = store.rawBiometricPunches
      .filter(
        (p) =>
          p.status === 'PROCESSED' &&
          (p.resolvedEmployeeId === employeeId || p.employeeCode.toUpperCase() === employee.employeeCode.toUpperCase()) &&
          p.logDatetime.startsWith(date)
      )
      .sort((a, b) => a.logDatetime.localeCompare(b.logDatetime));

    if (punches.length === 0) {
      return null;
    }

    const firstIn = punches[0].logTime;
    const lastOut = punches[punches.length - 1].logTime;
    const punchCount = punches.length;

    // Shift lookup
    const defaultShift = store.shifts[0];
    const shiftStart = defaultShift ? defaultShift.startTime : '09:00';
    const shiftEnd = defaultShift ? defaultShift.endTime : '18:00';
    const graceMinutes = defaultShift ? defaultShift.graceMinutes : 15;

    // Calculate work hours
    const [inH, inM] = firstIn.split(':').map(Number);
    const [outH, outM] = lastOut.split(':').map(Number);
    const inTotalMins = inH * 60 + inM;
    const outTotalMins = outH * 60 + outM;

    let workMinutes = Math.max(0, outTotalMins - inTotalMins);
    // Deduct break if worked over 4 hours
    if (workMinutes > 240) {
      workMinutes -= defaultShift.breakMinutes || 60;
    }
    const workHours = Number((Math.max(0, workMinutes) / 60).toFixed(2));

    // Calculate late arrival
    const [sH, sM] = shiftStart.split(':').map(Number);
    const shiftStartMins = sH * 60 + sM;
    let lateMinutes = 0;
    if (inTotalMins > shiftStartMins + graceMinutes) {
      lateMinutes = inTotalMins - shiftStartMins;
    }

    // Early departure
    const [eH, eM] = shiftEnd.split(':').map(Number);
    const shiftEndMins = eH * 60 + eM;
    let earlyExitMinutes = 0;
    if (outTotalMins < shiftEndMins && punchCount > 1) {
      earlyExitMinutes = shiftEndMins - outTotalMins;
    }

    // Overtime
    let overtimeMinutes = 0;
    if (outTotalMins > shiftEndMins) {
      overtimeMinutes = outTotalMins - shiftEndMins;
    }

    let status: DailyAttendance['status'] = 'PRESENT';
    if (workHours < 4) {
      status = 'HALF_DAY';
    } else if (lateMinutes > 0) {
      status = 'LATE';
    } else if (overtimeMinutes >= 60) {
      status = 'OVERTIME';
    }

    // Check if daily record already exists
    const existingIndex = store.dailyAttendance.findIndex(
      (a) => a.employeeId === employeeId && a.date === date
    );

    const record: DailyAttendance = {
      id: existingIndex >= 0 ? store.dailyAttendance[existingIndex].id : `att-${date}-${employee.employeeCode}`,
      employeeId,
      date,
      shiftId: defaultShift.id,
      firstIn,
      lastOut: punchCount > 1 ? lastOut : undefined,
      punchCount,
      workHours,
      status,
      lateMinutes,
      earlyExitMinutes,
      overtimeMinutes,
      isCorrectionApplied: false,
      source: 'BIOMETRIC',
    };

    if (existingIndex >= 0) {
      store.dailyAttendance[existingIndex] = record;
    } else {
      store.dailyAttendance.unshift(record);
    }

    return record;
  }

  /**
   * Resolves a quarantined punch by assigning it to a verified employee
   */
  public static resolveQuarantinedPunch(punchId: string, assignedEmployeeId: string): boolean {
    const store = db.get();
    const punch = store.rawBiometricPunches.find((p) => p.id === punchId);
    const employee = store.employees.find((e) => e.id === assignedEmployeeId);

    if (!punch || !employee) return false;

    punch.status = 'PROCESSED';
    punch.resolvedEmployeeId = employee.id;
    punch.quarantineReason = undefined;

    const punchDate = punch.logDatetime.split(' ')[0];
    this.recalculateDailyAttendanceForEmployeeDate(employee.id, punchDate);

    db.logAudit(
      'SYS',
      'Administrator',
      'ADMIN',
      'RESOLVE_QUARANTINE',
      'BIOMETRIC_ATTENDANCE',
      punch.id,
      `Punch #${punch.id}`,
      `Quarantined punch ${punch.employeeCode} resolved and mapped to employee ${employee.employeeCode} (${employee.firstName} ${employee.lastName})`
    );

    db.save();
    return true;
  }

  /**
   * Parses CSV text into PunchInput[]
   */
  public static parseCsvPunches(csvContent: string): PunchInput[] {
    const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const empIdx = headers.findIndex((h) => h.includes('employee_code') || h.includes('emp_code') || h === 'code');
    const dtIdx = headers.findIndex((h) => h.includes('log_datetime') || h.includes('datetime') || h === 'timestamp');
    const tmIdx = headers.findIndex((h) => h.includes('log_time') || h === 'time');
    const snIdx = headers.findIndex((h) => h.includes('device_sn') || h.includes('sn') || h === 'device');
    const dlIdx = headers.findIndex((h) => h.includes('downloaded_at'));

    if (empIdx === -1 || dtIdx === -1) {
      throw new Error('CSV must contain employee_code and log_datetime columns');
    }

    const punches: PunchInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length <= Math.max(empIdx, dtIdx)) continue;

      const employee_code = cols[empIdx];
      const log_datetime = cols[dtIdx];
      const log_time = tmIdx !== -1 && cols[tmIdx] ? cols[tmIdx] : (log_datetime.split(' ')[1] || '00:00:00');
      const device_sn = snIdx !== -1 && cols[snIdx] ? cols[snIdx] : 'CSV-UPLOAD';
      const downloaded_at = dlIdx !== -1 && cols[dlIdx] ? cols[dlIdx] : undefined;

      punches.push({
        employee_code,
        log_datetime,
        log_time,
        device_sn,
        downloaded_at,
      });
    }

    return punches;
  }
}
