# ECC Anti-Patterns — Logging & Tracing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Logging & Tracing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Logging on Outbound API Calls
2. Sensitive Data Exposure in Logs
3. Full Telescope Capture in Production Without Sampling
4. Missing Correlation IDs Across Request Chains
5. Unbounded Log/Telescope Storage Growth

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: No Logging on Outbound API Calls

### Category
Observability | Reliability

### Description
Making HTTP API calls without logging request or response details. When an integration fails, there is no forensic evidence to diagnose the issue.

### Why It Happens
Logging is seen as optional or is deferred to "later." The integration works during development, so logging feels unnecessary.

### Warning Signs
- API failures reported by users but no log entries exist
- Debugging integration issues requires adding log statements and redeploying
- No audit trail of outbound API activity

### Why It Is Harmful
Integration failures require guesswork and reproduction attempts instead of looking at logs. Incident response time increases from minutes to hours. No historical record of API behavior for capacity planning.

### Real-World Consequences
Stripe returns 503 for 10 minutes. Without logs, the team doesn't know if the issue is Stripe-side, network-side, or application-side. They waste 2 hours investigating their own code before realizing Stripe had an incident.

### Preferred Alternative
Log every outbound API call with duration, HTTP status, service name, and endpoint.

### Refactoring Strategy
1. Add middleware or wrapper that logs all HTTP calls
2. Capture duration, URL (without sensitive params), status, service name
3. Implement at the Guzzle handler stack level for automatic coverage
4. For existing code, wrap Http facade calls with logging
5. Verify log output in development before deploying

### Detection Checklist
- [ ] No log entries for outbound API calls
- [ ] Integration issues require adding logs to debug
- [ ] No duration or status capture on external calls

### Related Rules
Log All Outbound API Calls with Duration and Status (05-rules.md)

### Related Skills
Add Logging and Request Tracing to API Integration Calls (06-skills.md)

### Related Decision Trees
Observability Tool Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Sensitive Data Exposure in Logs

### Category
Security | Compliance

### Description
Logging request/response bodies that contain Authorization headers, API keys, tokens, or PII without redaction.

### Why It Happens
Full request/response capture is the simplest logging approach. Developers don't consider that logs are stored with less security than the source system.

### Warning Signs
- Authorization headers visible in Telescope dashboard or log files
- API keys, SSNs, or emails in plain text in logs
- PCI/HIPAA audit finding regarding log data

### Why It Is Harmful
Exposed credentials in logs are a common breach vector. Log aggregation tools (Papertrail, Datadog) may have different access controls than the application. Compliance violations (PCI DSS, HIPAA, GDPR) can result in fines.

### Real-World Consequences
Stripe API key appears in Telescope logs. A developer with read-only Telescope access extracts the key and makes unauthorized charges. $50,000 in fraudulent charges before detection.

### Preferred Alternative
Redact Authorization headers, API keys, tokens, and PII before logging. Use middleware-based redaction for consistent coverage.

### Refactoring Strategy
1. Identify all log statements that capture request/response data
2. Implement centralized redaction middleware in the logging pipeline
3. Create a redaction configuration listing sensitive fields
4. Test redaction by intentionally logging known sensitive values
5. Verify logs in production contain no unredacted sensitive data

### Detection Checklist
- [ ] Authorization headers visible in logs
- [ ] API keys or tokens in plain text log entries
- [ ] PII (email, SSN, phone) in request/response logs
- [ ] No redaction middleware

### Related Rules
Redact Sensitive Data Before Logging (05-rules.md)

### Related Skills
Add Logging and Request Tracing to API Integration Calls (06-skills.md)

### Related Decision Trees
Sensitive Data Redaction Approach (07-decision-trees.md)

---

## Anti-Pattern 3: Full Telescope Capture in Production Without Sampling

### Category
Performance | Maintainability

### Description
Enabling Telescope's HTTP watcher with 100% capture in production. Storage grows unbounded and performance degrades as the Telescope tables expand.

### Why It Happens
The default Telescope configuration enables full capture. Teams enable Telescope in production for debugging and don't configure sampling.

### Warning Signs
- `telescope_entries` table >1GB in production
- Telescope dashboard queries taking >5 seconds
- Database performance degradation attributed to Telescope

### Why It Is Harmful
Telescope stores every request/response pair. At 1000 requests/minute, this is 1.4M entries/day. Database tables grow into tens of gigabytes, slowing dashboard queries and potentially affecting application performance.

### Real-World Consequences
Telescope tables grow to 50GB over 3 months. The database server runs out of disk. All writes fail. Application is down for 1 hour while the team clears Telescope data.

### Preferred Alternative
Configure Telescope with 10-25% sampling in production. Use full capture only in local and staging.

### Refactoring Strategy
1. Add sampling filter in Telescope configuration
2. Set production sampling rate (10-25%)
3. Configure automatic pruning (24-48h retention)
4. Monitor Telescope table size
5. Consider disabling Telescope entirely in production if not actively used

### Detection Checklist
- [ ] No sampling filter in Telescope config
- [ ] Telescope tables growing rapidly in production
- [ ] Database performance degradation from Telescope

### Related Rules
Enable Telescope with Sampling in Production (05-rules.md)

### Related Skills
Add Logging and Request Tracing to API Integration Calls (06-skills.md)

### Related Decision Trees
Production Logging Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Missing Correlation IDs Across Request Chains

### Category
Observability | Testing

### Description
Not propagating a correlation ID across webhook receipt → queue job processing → outbound API call chains. Each step is logged independently with no trace identifier connecting them.

### Why It Happens
Each service/component logs independently. The connection between "webhook received" and "API call sent" seems obvious at development time but is invisible in production logs.

### Warning Signs
- Can't trace a webhook event through its processing lifecycle
- Each log entry stands alone with no shared identifier
- Debugging requires matching timestamps across services

### Why It Is Harmful
When a webhook processing fails, there's no way to see the full request chain. Was the webhook received? Was the job queued? Did the API call succeed? Each question requires separate investigation with manual correlation.

### Real-World Consequences
Customer reports duplicate charge. Webhook → job → API call chain has 4 steps. Without correlation IDs, the team spends 3 hours manually matching timestamps to find the bug. Customer is refunded but dissatisfied.

### Preferred Alternative
Generate a correlation ID at the entry point (webhook, HTTP request) and propagate it through all downstream calls (queue, API, logs).

### Refactoring Strategy
1. Generate UUID correlation ID at request entry point
2. Add to `Log::withContext()` for automatic inclusion in all log entries
3. Pass in HTTP headers to downstream services
4. Include in queue job payload metadata
5. Add to log aggregation tool for searching

### Detection Checklist
- [ ] No correlation ID in log entries
- [ ] Can't trace request across service boundaries
- [ ] Each component logs independently with no shared identifier

### Related Rules
Use Correlation IDs Across Request Chains (05-rules.md)

### Related Skills
Add Logging and Request Tracing to API Integration Calls (06-skills.md)

### Related Decision Trees
Observability Tool Selection (07-decision-trees.md)

---

## Anti-Pattern 5: Unbounded Log/Telescope Storage Growth

### Category
Maintainability | Performance

### Description
No pruning or retention policy configured for Telescope entries or structured logs. Storage grows until disk exhaustion forces emergency cleanup.

### Why It Happens
Default configuration has no retention limits. Teams deploy Telescope in production and forget about it until disk space alerts fire.

### Warning Signs
- Telescope tables with months of historical data
- Log files filling disk partitions
- No pruning configuration in `config/telescope.php`
- No log rotation configured

### Why It Is Harmful
Database performance degrades as Telescope tables grow. Disk space is exhausted, causing application write failures. Emergency cleanup requires locking the Telescope tables, potentially causing downtime.

### Real-World Consequences
Telescope tables grow to 30GB over 6 months. MySQL query cache is trashed by large table scans. Application response time degrades by 200ms. Team spends a weekend migrating Telescope data to a separate database.

### Preferred Alternative
Configure automatic pruning of Telescope entries with 24-48h retention. Implement log rotation for file-based logs.

### Refactoring Strategy
1. Enable Telescope pruning with `prune.hours = 48`
2. Add scheduler task: `$schedule->command('telescope:prune')->daily()`
3. Configure log rotation for file-based logging
4. Monitor disk usage for Telescope and log directories
5. Set alerts for storage growth thresholds

### Detection Checklist
- [ ] No pruning configuration
- [ ] Telescope tables growing indefinitely
- [ ] No log rotation configured
- [ ] Disk usage alerts from log storage

### Related Rules
Implement Log Pruning with Retention Policy (05-rules.md)

### Related Skills
Add Logging and Request Tracing to API Integration Calls (06-skills.md)

### Related Decision Trees
Production Logging Strategy (07-decision-trees.md)
