# Decomposition: Log Cost Optimization

## Topic Overview
Log costs (CloudWatch Logs, Datadog Logs, New Relic Logs) scale with ingestion volume, storage, and search. For Laravel applications, verbose logging (debug-level in production, uncontrolled frameworks logs, verbose access logs) can generate terabytes of log data monthly, costing thousands of dollars. Structured logging, log levels, sampling, and retention policies dramatically reduce log costs while maintaining observability.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-log-cost-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Log Cost Optimization
- **Purpose:** Log costs (CloudWatch Logs, Datadog Logs, New Relic Logs) scale with ingestion volume, storage, and search. For Laravel applications, verbose logging (debug-level in production, uncontrolled frameworks logs, verbose access logs) can generate terabytes of log data monthly, costing thousands of dollars. Structured logging, log levels, sampling, and retention policies dramatically reduce log costs while maintaining observability.
- **Difficulty:** Foundation
- **Dependencies:** - Metric Cost Optimization (ku-02), - Sampling Strategies (ku-04), - Data Retention Tiering (ku-05), - CloudWatch vs Datadog vs New Relic

## Dependency Graph
**Depends on:**
- Metric Cost Optimization (ku-02)
- Sampling Strategies (ku-04)
- Data Retention Tiering (ku-05)
- CloudWatch vs Datadog vs New Relic

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Log level filtering: Block DEBUG/INFO in production; keep WARNING and above
- Structured logging: Always; enables parsing, filtering, and cost attribution per service
- Log sampling: High-traffic apps generating >10GB/day of logs
- Retention shortening: Reduce from "forever" to 30 days for operational logs
- Dedicated log shipping: Use CloudWatch agent or Vector/fluentd for compression + batch shipping
- Log cost monitoring: Set budget alerts when log costs exceed 5% of total infrastructure spend
**Out of scope:**
- Removing all DEBUG logs: DEBUG logs are essential for troubleshooting; sample them rather than drop entirely
- Aggressive retention for compliance: If PCI/HIPAA requires 1-year retention, don't delete
- Log sampling for error logs: Never sample ERROR/CRITICAL logs; retain 100% for incident response
- Self-managed logging for small scale: CloudWatch is fine for <50GB/month; ELK stack adds ops cost
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization