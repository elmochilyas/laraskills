# Rules: Bref Laravel

## BREF-001: Configuration Cache Required
**Condition:** Laravel running on Bref/Lambda
**Action:** Run `php artisan config:cache` in deployment
**Rationale:** Config file parsing on each invocation adds 200-500ms to cold start
**Consequences:** Violation doubles application cold start time

## BREF-002: RDS Proxy for Database
**Condition:** Lambda function connects to RDS database
**Action:** Use RDS Proxy between Lambda and RDS
**Rationale:** Lambda can scale to thousands of concurrent executions, each needing a DB connection
**Consequences:** Violation exhausts RDS connection limits during traffic spikes

## BREF-003: S3 for File Storage
**Condition:** Application handles file uploads on Lambda
**Action:** Use S3 for file storage, not Lambda `/tmp` directory
**Rationale:** `/tmp` is limited to 512MB and ephemeral; another invocation may not have the file
**Consequences:** Violation causes file loss and storage limit errors

## BREF-004: Provisioned Concurrency for APIs
**Condition:** API route requires < 1s response time
**Action:** Enable provisioned concurrency for minimum 1 instance
**Rationale:** Cold start adds 500ms-2s latency on first invocation
**Consequences:** Violation causes intermittent slow responses for real-time users
