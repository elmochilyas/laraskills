# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Data Archival
**Generated:** 2026-06-03

---

# Decision Inventory

1. Data Archival Strategy Design
2. Archive Storage Tier Selection
3. Automated Archival Implementation

---

# Architecture-Level Decision Trees

---

## Decision Name: Data Archival Strategy Design

---

## Decision Context

Design data lifecycle with hot/warm/cold storage tiering.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Database size?

< 50GB -> Plan for future
50-200GB -> Implement next quarter
> 200GB -> Implement immediately

Access patterns by age:
0-6 months -> Hot (primary DB)
6-24 months -> Warm (cheaper DB or S3)
> 24 months -> Cold (S3/Glacier)

Compliance retention?
7-year -> Archive to S3/Glacier
None -> Can purge after business need

Partition by date?
YES -> Clean partition detachment
NO -> Implement partitioning first

---

## Rationale

Systematic archival reduces active DB size by 60-80%, enabling smaller instances and faster queries. Most Laravel apps access only last 30-90 days.

---

## Recommended Default

**Default:** Partition by date; keep 6 months active; archive to S3/Parquet; test restoration quarterly

---

## Risks Of Wrong Choice

No archival = DB grows unbounded to 500GB+, slow queries, +/month extra.

---

## Related Rules

Rule: Follow standardized Data Archival practices

---

## Related Skills

Analyze and Optimize Data Archival

---

---

## Decision Name: Archive Storage Tier Selection

---

## Decision Context

Choose storage for archived data by access frequency.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Access frequency?

Monthly/quarterly -> S3 Standard or IA
Yearly/audit -> S3 Glacier
Never (compliance) -> Glacier Deep Archive

Query mechanism?
SQL needed -> Keep in cheap DB or Parquet + Athena
Raw file -> S3 direct
No queries -> Glacier Deep Archive

Restore SLA?
Minutes -> S3 Standard/IA
1-5 hours -> Glacier Flexible
12+ hours -> Glacier Deep Archive (cheapest)

Format?
Parquet -> Compressed 70-80%, queryable
CSV -> Universal, no schema, larger

---

## Rationale

S3 .023/GB/month vs RDS .115-0.46/GB. Glacier Deep Archive .00099/GB is ~100x cheaper than DB storage.

---

## Recommended Default

**Default:** Parquet on S3 Standard for 6-24 months; Glacier Deep Archive for 2+ years; Athena for queries

---

## Risks Of Wrong Choice

Archiving to CSV without schema = data can't be reliably restored.

---

## Related Rules

Rule: Follow standardized Data Archival practices

---

## Related Skills

Analyze and Optimize Data Archival

---

---

## Decision Name: Automated Archival Implementation

---

## Decision Context

Implement scheduled archival using Laravel commands and pruning.

---

## Decision Criteria

reliability, cost

---

## Decision Tree

Soft-deleted models?

YES -> Use Laravel Prunable trait
NO -> Implement custom archive command

Archival job?

php artisan app:archive-old-records as daily scheduled task

Export verification?
Verify S3/Parquet created with correct data
Delete from active DB only after verification

Quarterly restoration test?
Restore random subset
Verify data integrity and completeness
Update runbook

---

## Rationale

Manual archival is error-prone. Automated scheduled jobs ensure regular archival without human intervention.

---

## Recommended Default

**Default:** Schedule daily; use Prunable for soft-deletes; test restoration quarterly

---

## Risks Of Wrong Choice

Archiving without testing restoration = worthless if can't be recovered.

---

## Related Rules

Rule: Follow standardized Data Archival practices

---

## Related Skills

Analyze and Optimize Data Archival

---

