# Anti-Patterns: Bref Laravel

## AP-BREF-001: Lambda Without RDS Proxy
**Description:** Lambda functions connecting directly to RDS.
**Consequences:** During traffic spikes, Lambda creates hundreds of database connections simultaneously, exhausting RDS connection limits.
**Remediation:** Always use RDS Proxy between Lambda and RDS databases.

## AP-BREF-002: Local State Reliance
**Description:** Storing sessions, uploaded files, or cache on local filesystem.
**Consequences:** Subsequent invocations may run on different Lambda instances. Data is lost.
**Remediation:** Use S3 for files, DynamoDB/Redis for sessions, ElastiCache for cache.
