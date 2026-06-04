# Anti-Patterns: Terraform for Laravel

## AP-TFL-001: Destroy-Before-Create
**Description:** Default Terraform lifecycle that destroys old resource before creating replacement.
**Consequences:** Application downtime during any resource update that requires replacement.
**Remediation:** Use `create_before_destroy` lifecycle on all production resources.

## AP-TFL-002: Single-AZ Production Database
**Description:** Production RDS running in a single Availability Zone.
**Consequences:** An AZ outage causes full database downtime. No automatic failover capability.
**Remediation:** Always use Multi-AZ for production databases.

## AP-TFL-003: Secrets in Plaintext State
**Description:** Database passwords and API keys stored in Terraform state file.
**Consequences:** Anyone with state read access (S3 bucket) has production credentials.
**Remediation:** Use AWS Secrets Manager. Reference secrets via `data.aws_secretsmanager_secret_version`.
