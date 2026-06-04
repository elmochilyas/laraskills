# Rules: Infrastructure Monitoring Tools

## MON-001: Pre-Launch Monitoring
**Condition:** Application deployed to production
**Action:** Configure monitoring before going live
**Rationale:** Deploying without monitoring means discovering issues through customer complaints
**Consequences:** Violation creates blind production deployment

## MON-002: Data-Driven Alert Thresholds
**Condition:** Alert rules configured
**Action:** Set thresholds based on historical data, not theoretical values
**Rationale:** Theoretical thresholds cause false positives or miss real issues
**Consequences:** Violation creates alert fatigue from false positives

## MON-003: Structured Logging
**Condition:** Application logging configured
**Action:** Use JSON format with consistent fields (request_id, user_id, duration)
**Rationale:** Unstructured text logs cannot be machine-parsed for alerting and analysis
**Consequences:** Violation requires manual log reading for incident response

## MON-004: Comprehensive Health Checks
**Condition:** Health check endpoint configured
**Action:** Validate database, Redis, queue, and external API connectivity
**Rationale:** Health check that only returns 200 misses critical dependency failures
**Consequences:** Violation reports healthy status while application is broken
