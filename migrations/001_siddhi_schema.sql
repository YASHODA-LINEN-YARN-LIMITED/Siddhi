-- ============================================================================
-- Siddhi HRMS - PostgreSQL Schema & Initial Database Migration (001_siddhi_schema.sql)
-- Designed for self-hosted deployment on local servers with PostgreSQL 16
-- ============================================================================

-- Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations & Companies
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(64),
    currency VARCHAR(8) DEFAULT 'INR',
    timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
    date_format VARCHAR(32) DEFAULT 'DD/MM/YYYY',
    financial_year_start VARCHAR(10) DEFAULT '04-01',
    website VARCHAR(255),
    phone VARCHAR(32),
    email VARCHAR(128),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Branches & Physical Locations
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    is_headquarters BOOLEAN DEFAULT FALSE,
    geofence_enabled BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_meters INTEGER DEFAULT 250,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Departments
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cost_center_code VARCHAR(32),
    parent_department_id VARCHAR(64),
    head_of_department_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Designations & Grades
CREATE TABLE IF NOT EXISTS designations (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
    grade_level VARCHAR(32) DEFAULT 'L1'
);

CREATE TABLE IF NOT EXISTS grades (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    min_salary DECIMAL(14, 2) NOT NULL,
    max_salary DECIMAL(14, 2) NOT NULL
);

-- 5. Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_minutes INTEGER DEFAULT 15,
    half_day_hours DECIMAL(4, 2) DEFAULT 4.0,
    full_day_hours DECIMAL(4, 2) DEFAULT 8.0,
    break_minutes INTEGER DEFAULT 60,
    is_overnight BOOLEAN DEFAULT FALSE,
    weekly_off_days INT[] DEFAULT '{0, 6}'
);

-- 6. Employees Master Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(64) PRIMARY KEY,
    employee_code VARCHAR(32) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(32),
    gender VARCHAR(16) DEFAULT 'OTHER',
    date_of_birth DATE,
    date_of_joining DATE NOT NULL,
    company_id VARCHAR(64) REFERENCES companies(id),
    branch_id VARCHAR(64) REFERENCES branches(id),
    department_id VARCHAR(64) REFERENCES departments(id),
    designation_id VARCHAR(64) REFERENCES designations(id),
    grade_id VARCHAR(64) REFERENCES grades(id),
    manager_id VARCHAR(64),
    status VARCHAR(32) DEFAULT 'ACTIVE', -- ACTIVE, PROBATION, NOTICE, TERMINATED, RESIGNED, RETIRED
    employment_type VARCHAR(32) DEFAULT 'FULL_TIME',
    probation_period_months INTEGER DEFAULT 3,
    confirmation_date DATE,
    role VARCHAR(32) DEFAULT 'EMPLOYEE', -- ADMIN, HR_MANAGER, PAYROLL_OFFICER, MANAGER, EMPLOYEE, RECRUITER, AUDITOR
    pan_number VARCHAR(32),
    national_id VARCHAR(32),
    pf_number VARCHAR(64),
    esi_number VARCHAR(64),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(64),
    bank_ifsc VARCHAR(32),
    emergency_contact_name VARCHAR(100),
    emergency_contact_relation VARCHAR(50),
    emergency_contact_phone VARCHAR(32),
    address TEXT,
    avatar_url TEXT,
    exit_date DATE,
    exit_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emp_code ON employees(employee_code);
CREATE INDEX idx_emp_dept ON employees(department_id);
CREATE INDEX idx_emp_status ON employees(status);

-- 7. Biometric Integration Settings
CREATE TABLE IF NOT EXISTS biometric_integration_settings (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    api_base_url TEXT NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) DEFAULT 'POST',
    auth_type VARCHAR(32) DEFAULT 'BEARER',
    auth_credentials JSONB DEFAULT '{}'::jsonb,
    request_headers JSONB DEFAULT '{}'::jsonb,
    query_params JSONB DEFAULT '{}'::jsonb,
    request_body_template TEXT,
    polling_interval_minutes INTEGER DEFAULT 15,
    request_timeout_seconds INTEGER DEFAULT 30,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(32) DEFAULT 'IDLE',
    last_error_message TEXT,
    records_synced_last_run INTEGER DEFAULT 0,
    sync_cursor TEXT,
    timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Raw Biometric Punches (Preserved separately from daily calculated attendance)
CREATE TABLE IF NOT EXISTS raw_biometric_punches (
    id VARCHAR(64) PRIMARY KEY,
    employee_code VARCHAR(32) NOT NULL,
    log_datetime TIMESTAMP NOT NULL,
    log_time TIME NOT NULL,
    downloaded_at TIMESTAMP,
    device_sn VARCHAR(64) NOT NULL,
    sync_batch_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'PROCESSED', -- PROCESSED, QUARANTINED, DUPLICATE
    quarantine_reason TEXT,
    resolved_employee_id VARCHAR(64) REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_device_emp_timestamp UNIQUE (device_sn, employee_code, log_datetime)
);

CREATE INDEX idx_raw_punch_emp ON raw_biometric_punches(employee_code);
CREATE INDEX idx_raw_punch_dt ON raw_biometric_punches(log_datetime);
CREATE INDEX idx_raw_punch_status ON raw_biometric_punches(status);

-- 9. Daily Attendance (Aggregated & Calculated)
CREATE TABLE IF NOT EXISTS daily_attendance (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    shift_id VARCHAR(64) REFERENCES shifts(id),
    first_in TIME,
    last_out TIME,
    punch_count INTEGER DEFAULT 0,
    work_hours DECIMAL(5, 2) DEFAULT 0.00,
    status VARCHAR(32) NOT NULL, -- PRESENT, LATE, HALF_DAY, ABSENT, ON_LEAVE, HOLIDAY, WEEKLY_OFF, OVERTIME
    late_minutes INTEGER DEFAULT 0,
    early_exit_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    is_correction_applied BOOLEAN DEFAULT FALSE,
    source VARCHAR(32) DEFAULT 'BIOMETRIC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_date UNIQUE (employee_id, attendance_date)
);

-- 10. Leave Types & Ledger
CREATE TABLE IF NOT EXISTS leave_types (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    annual_quota INTEGER NOT NULL,
    carry_forward_max INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    encashment_allowed BOOLEAN DEFAULT FALSE,
    probation_allowed BOOLEAN DEFAULT TRUE,
    requires_attachment BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id VARCHAR(64) REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(4, 1) NOT NULL,
    is_half_day BOOLEAN DEFAULT FALSE,
    reason TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    approver_id VARCHAR(64) REFERENCES employees(id),
    approver_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Payroll & Payslips
CREATE TABLE IF NOT EXISTS payroll_periods (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES companies(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_name VARCHAR(64) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cutoff_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'DRAFT', -- DRAFT, CALCULATED, REVIEWED, APPROVED, LOCKED_FINALIZED, PAID
    total_employees INTEGER DEFAULT 0,
    total_gross_pay DECIMAL(14, 2) DEFAULT 0,
    total_deductions DECIMAL(14, 2) DEFAULT 0,
    total_net_pay DECIMAL(14, 2) DEFAULT 0,
    total_employer_contributions DECIMAL(14, 2) DEFAULT 0,
    processed_by VARCHAR(64) REFERENCES employees(id),
    approved_by VARCHAR(64) REFERENCES employees(id),
    finalized_at TIMESTAMP WITH TIME ZONE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    unlock_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_payslips (
    id VARCHAR(64) PRIMARY KEY,
    payroll_period_id VARCHAR(64) REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id VARCHAR(64) REFERENCES employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    payable_days DECIMAL(4, 1) NOT NULL,
    unpaid_days DECIMAL(4, 1) DEFAULT 0,
    overtime_hours DECIMAL(5, 1) DEFAULT 0,
    overtime_pay DECIMAL(10, 2) DEFAULT 0,
    basic DECIMAL(10, 2) NOT NULL,
    hra DECIMAL(10, 2) NOT NULL,
    da DECIMAL(10, 2) DEFAULT 0,
    conveyance DECIMAL(10, 2) DEFAULT 0,
    medical DECIMAL(10, 2) DEFAULT 0,
    special_allowance DECIMAL(10, 2) DEFAULT 0,
    gross_earnings DECIMAL(12, 2) NOT NULL,
    epf_deduction DECIMAL(10, 2) DEFAULT 0,
    esi_deduction DECIMAL(10, 2) DEFAULT 0,
    professional_tax DECIMAL(10, 2) DEFAULT 0,
    tds_tax DECIMAL(10, 2) DEFAULT 0,
    loan_deduction DECIMAL(10, 2) DEFAULT 0,
    loss_of_pay_deduction DECIMAL(10, 2) DEFAULT 0,
    other_deductions DECIMAL(10, 2) DEFAULT 0,
    total_deductions DECIMAL(12, 2) NOT NULL,
    net_salary DECIMAL(12, 2) NOT NULL,
    epf_employer DECIMAL(10, 2) DEFAULT 0,
    esi_employer DECIMAL(10, 2) DEFAULT 0,
    total_ctc DECIMAL(12, 2) NOT NULL,
    payment_status VARCHAR(32) DEFAULT 'PENDING'
);

-- 12. Searchable Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    module VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    entity_name VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45)
);

CREATE INDEX idx_audit_module ON audit_logs(module);
CREATE INDEX idx_audit_time ON audit_logs(timestamp);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
