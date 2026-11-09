# Siddhi HRMS - Backup & Restore Guide

Protecting organizational employee records, biometric logs, and finalized payroll ledgers requires regular automated backups and tested restore procedures.

---

## 1. Automated PostgreSQL Backups

### Daily Database Dump Script (`/opt/siddhi-hrms/scripts/backup.sh`):

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/siddhi"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="siddhi_pg_dump_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Execute pg_dump within the running docker container
docker compose exec -T postgres pg_dump -U siddhi_user siddhi_hrms | gzip > "${BACKUP_DIR}/${FILENAME}"

# Retain backups for 30 days
find "$BACKUP_DIR" -type f -name "siddhi_pg_dump_*.sql.gz" -mtime +30 -delete

echo "Backup completed successfully: ${BACKUP_DIR}/${FILENAME}"
```

Make executable and schedule in cron:
```bash
chmod +x /opt/siddhi-hrms/scripts/backup.sh
crontab -e
# Add line to run daily at 02:00 AM:
0 2 * * * /opt/siddhi-hrms/scripts/backup.sh >> /var/log/siddhi_backup.log 2>&1
```

---

## 2. Restoring PostgreSQL from Backup

1. **Stop the application service**:
   ```bash
   docker compose stop app
   ```

2. **Restore the database**:
   ```bash
   gunzip -c /var/backups/siddhi/siddhi_pg_dump_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T postgres psql -U siddhi_user -d siddhi_hrms
   ```

3. **Restart the application service**:
   ```bash
   docker compose start app
   ```

---

## 3. Web UI One-Click Backup & Snapshot

Administrators can also navigate to **Administration > Backup & Restore** in the Siddhi Web Portal to:
1. **Download Full JSON Database Snapshot**: Exports complete state (organization, employee master, raw punches, attendance, leave, locked payrolls, audit logs) in a single timestamped JSON file.
2. **One-Click Restore**: Upload any previously generated JSON snapshot file to restore the entire organization database in seconds.
