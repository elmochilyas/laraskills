# Data Retention Tiering — Rules

## R1: Export Logs from Hot Storage to S3 After 7 Days

**Category**: Storage Tiering

**Rule**: ALWAYS export observability data (logs, traces, metrics) from hot storage (CloudWatch, Datadog, New Relic) to S3 after 7 days. DELETE from hot storage after export. NEVER keep all data in hot storage for the full retention period.

**Reason**: Hot storage is optimized for fast querying and costs $0.03/GB/month (CloudWatch) or is included in ingestion pricing at premium rates (Datadog, New Relic). S3 Standard costs $0.023/GB/month, and S3 Glacier costs $0.004/GB/month. Moving data older than 7 days to S3 reduces long-term storage costs by 50-80%. Data from 7+ days ago is rarely queried for operational debugging — it only serves compliance or trend analysis needs.

**Bad Example**: A team keeps all 500GB/month of logs in CloudWatch for 12 months. Storage: 500GB x 12 months / 2 average = 3TB, at $0.03/GB/month = $90/month. Annual storage: $1,080. Plus the data is queryable but never actually queried after the first week.

**Good Example**: Logs exported to S3 Parquet after 7 days and deleted from CloudWatch. S3 Standard for 7-30 days ($0.023/GB), then S3 Glacier for 30-365 days ($0.004/GB). Average monthly storage cost: $10. Annual: $120. Savings: $960/year. Data is still queryable via Athena if needed.

**Exceptions**: Active incident investigation periods — temporarily keep hot retention at 30 days for the affected service, then revert to 7 days after the incident resolves.

**Consequences Of Violation**: Paying 5-10x more for storage of data that provides zero operational value. The cost compounds monthly as data accumulates.

---

## R2: Set Retention Per Data Type — Not a Single Policy for All

**Category**: Granular Policies

**Rule**: ALWAYS define separate retention policies for each data type (errors, debug logs, audit logs, traces, metrics). NEVER apply the same retention to all observability data.

**Reason**: Different data types have different value curves and compliance requirements. Error logs are valuable for incident response for 90+ days. Debug logs lose value after 7 days. Audit logs must be retained for 1-7 years for compliance. Metrics aggregates are useful for trend analysis for 1+ year while raw metrics lose value after 30 days. A single retention policy either over-retains (wasting money on low-value data) or under-retains (failing compliance).

**Bad Example**: A team sets 30-day retention for all logs. Error logs needed for a PCI audit 6 months later are already deleted — compliance violation. Meanwhile, 30 days of health check DEBUG logs are retained — paying for worthless data.

**Good Example**: Retention matrix: Error logs = 30 days hot + 1 year S3 warm + 6 years Glacier (compliance). Debug/INFO logs = 7 days max, delete. Audit logs = 1 year hot (Object Lock) + 6 years Glacier. Metrics raw = 30 days hot + 90 days aggregated. Trace data = 7 days hot + 30 days warm. Total cost: optimal for each data type's value.

**Exceptions**: For small deployments (<10GB/month total), the complexity of per-type policies may not be justified — use a single 30-day retention.

**Consequences Of Violation**: Either over-paying for low-value data (debug logs retained for 1 year) or under-retaining compliance data (audit logs deleted after 30 days). Both have financial or legal consequences.

---

## R3: Roll Up Raw Data into Aggregated Summaries Before Archiving

**Category**: Data Compression

**Rule**: ALWAYS roll up raw observability data into aggregated summaries (hourly/daily) before moving to warm/cold storage. NEVER archive raw granular data when aggregated data serves the same purpose.

**Reason**: Raw data at 1-second granularity is 86,400x more data than daily rollups for the same metric. For trend analysis, capacity planning, and compliance — all use cases for data older than 30 days — hourly or daily aggregates provide sufficient precision. Raw data is needed only for recent debugging. Rolling up before archiving reduces archive storage volume by 95-99.9%.

**Bad Example**: A team archives raw 1-second resolution metrics for 1 year. Monthly archive volume: 500GB compressed Parquet. Cost: $500/month in S3. 99.9% of archived data points are never queried.

**Good Example**: The team stores raw data for 7 days, then computes hourly aggregates (count, p50, p95, p99, max) and daily aggregates (min, max, avg, p95). Archive only the aggregates. Monthly archive volume: 5GB. Cost: $5/month. Queries for trends and capacity planning work identically on aggregated data.

**Exceptions**: Compliance data that requires raw-level audit trails (financial transactions, user access logs) must be archived at full granularity. For these, compression (Parquet) and partitioning still reduce volume.

**Consequences Of Violation**: Archive costs are 20-100x higher than necessary. Teams pay for raw granularity that provides zero benefit for their archive use cases.

---

## R4: Use S3 Lifecycle Policies for Automated Tiering — Never Manual

**Category**: Automation

**Rule**: ALWAYS configure S3 Lifecycle Policies to automate data movement between storage tiers. NEVER manually move or delete archived data.

**Reason**: Manual data tiering is error-prone and inconsistent. Engineers forget to move data, apply different rules to different datasets, and delete data that should be retained. S3 Lifecycle Policies are fully automated — once configured, they run without human intervention, applying consistent transitions: S3 Standard (30 days) → S3 Standard-IA (90 days) → S3 Glacier (365 days) → Delete (7 years). Automation ensures compliance with retention policies and prevents human error.

**Bad Example**: A team manually copies log files to Glacier every quarter. In Q2, they forget. In Q3, they delete the S3 Standard files before the Glacier copy is verified. 6 months of log data is lost — non-compliant for 2 regulations.

**Good Example**: S3 Lifecycle Policy: Transition to IA after 30 days, transition to Glacier after 90 days, expire after 7 years. Zero human intervention. Every file follows the same policy. Compliance audit passes every year.

**Exceptions**: For data that needs pre-processing before archiving (converting to Parquet, partitioning), use S3 Object Lambda or a Lambda trigger to transform, then let the lifecycle policy handle storage transitions.

**Consequences Of Violation**: Non-compliance (data deleted too early) or over-spending (data never moved to cheaper tiers). Manual errors are guaranteed at scale.

---

## R5: Test Data Restoration from Archive Quarterly

**Category**: Recovery Validation

**Rule**: ALWAYS test restoration of archived observability data from cold storage at least once per quarter. Test both the process (initiating restore) and the result (can you query the restored data?).

**Reason**: Archive formats change, S3 bucket policies drift, IAM roles expire, and encryption keys rotate. A team that has never tested archive restoration will discover during an incident or audit that their 6-month-old archived data is unreadable — wrong Parquet schema, expired KMS key, missing partition metadata. Quarterly testing ensures the restoration process works and the data is queryable.

**Bad Example**: A PCI audit requires 6 months of access logs. The team retrieves data from Glacier — restore takes 4 hours. When complete, the Parquet files have a schema that doesn't match the Athena table definition (schema evolved over 6 months). Query fails. The team has 48 hours to produce the data or fail the audit.

**Good Example**: Quarterly test: restore 1 month of access logs from Glacier (4 hours). Run 3 sample Athena queries to verify schema compatibility. The test passes each quarter. During the PCI audit, the team retrieves data and queries it within 5 hours. Audit passes.

**Exceptions**: For non-compliance data that doesn't need retention, archive restoration testing is less critical. For any compliance-mandated retention, testing is mandatory.

**Consequences Of Violation**: Archived data is effectively lost — it exists in S3 but cannot be queried or read. Compliance failures, failed audits, and inability to investigate security incidents using historical data.
