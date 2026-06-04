# Rules: Terraform for Laravel

## TFL-001: Managed Database
**Condition:** Terraform provisions database for Laravel
**Action:** Use RDS (not EC2-installed MySQL) for production
**Rationale:** RDS provides automated backups, patching, Multi-AZ, and point-in-time recovery
**Consequences:** Violation requires manual database backup and recovery procedures

## TFL-002: Secrets in Secrets Manager
**Condition:** Database passwords or API keys in Terraform
**Action:** Store in AWS Secrets Manager, reference via data source
**Rationale:** Terraform state file is not encrypted; secrets in state are exposed to state readers
**Consequences:** Violation exposes production secrets in Terraform state

## TFL-003: Multi-AZ for Production
**Condition:** Production RDS instance
**Action:** Enable Multi-AZ for automatic failover
**Rationale:** Single-AZ RDS has no automatic failover in case of AZ outage
**Consequences:** Violation causes database downtime during AZ failures

## TFL-004: create_before_destroy
**Condition:** Updating production infrastructure resource
**Action:** Use `create_before_destroy` lifecycle rule
**Rationale:** Default behavior destroys then creates, causing downtime
**Consequences:** Violation causes downtime during infrastructure updates
