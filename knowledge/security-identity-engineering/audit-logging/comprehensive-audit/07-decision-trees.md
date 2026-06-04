# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Audit Logging
**Knowledge Unit:** Comprehensive Audit Logging (HMAC, diffs, alerts)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Audit Overhead vs Compliance | What operations warrant comprehensive logging | compliance, performance |
| 2 | HMAC Key Management | Where to store the HMAC signing key | security |
| 3 | Alert Rule Design | Synchronous vs async alert evaluation | architectural |

---

# Architecture-Level Decision Trees

---

## Audit Overhead vs Compliance

---

## Decision Context

Determining which operations require comprehensive (HMAC + field-level diffs) audit logging vs simple activity logging.

---

## Decision Criteria

* compliance
* performance

---

## Decision Tree

Is the operation related to financial transactions, PII access, or compliance scope?
↓
YES → Comprehensive audit logging (HMAC, field diffs, correlation ID)
NO → Simple activity logging or no logging

What is the sensitivity level?
↓
High (admin actions, role changes, data exports) → Comprehensive logging
Medium (user profile updates, content changes) → Simple activity logging
Low (view counts, search queries) → No logging needed

Is there a compliance requirement (SOC2, HIPAA, PCI DSS)?
↓
YES → Comprehensive logging for in-scope operations (defined by compliance scope)
NO → Simple activity logging sufficient

What is the operation frequency?
↓
Low frequency (admin actions, config changes) → Comprehensive logging (low overhead)
High frequency (API calls, reads) → Selective logging (log only sensitive operations)

Is forensic investigation a requirement?
↓
YES → Comprehensive logging (field diffs, HMAC, correlation ID)
NO → Simple activity logging

---

## Rationale

Comprehensive audit logging adds overhead (1-5ms per operation, 2x storage with field diffs). It should be reserved for operations that are in compliance scope or require forensic investigation. Simple activity logging (Spatie) covers the general case. The decision hinges on whether the operation's sensitivity or compliance scope justifies the overhead.

---

## Recommended Default

**Default:** Simple activity logging (Spatie) for all operations; comprehensive logging (HMAC + diffs) only for compliance-scoped operations (financial, PII, admin actions, permission changes)
**Reason:** Comprehensive logging overhead is not justified for every operation. Compliance scope defines the boundary — operations in scope get full logging; operations outside scope get simple activity logging or no logging.

---

## Risks Of Wrong Choice

- Comprehensive logging for everything: storage explosion, unnecessary latency
- Simple logging for compliance-scoped operations: audit trail insufficient for compliance
- No logging at all: cannot investigate incidents, cannot prove compliance
- Inconsistent logging: missing logs for some in-scope operations

---

## Related Rules

- Log All State-Changing Operations on Sensitive Resources (05-rules.md)
- Include IP Address and User Agent in Audit Logs (05-rules.md)
- Log Both the Old and New Values on Update Operations (05-rules.md)

---

## Related Skills

- Implement Comprehensive Audit Logging with HMAC Integrity Verification (06-skills.md)

---

## HMAC Key Management

---

## Decision Context

Where to store the HMAC signing key used for audit log integrity verification.

---

## Decision Criteria

* security

---

## Decision Tree

Is there a secrets manager available (Vault, KMS)?
↓
YES → Store HMAC key in secrets manager (best security, audit trail)
NO → Is there an APP_KEY available?
    YES → Use APP_KEY as HMAC key (simpler) or derive a sub-key
    NO → Environment variable with restricted permissions

Should the HMAC key be separate from the database?
↓
YES → Must be — DB compromise should not expose the signing key
NO → Separating is still required for tamper detection to be meaningful

What is the compliance requirement?
↓
HSM-grade key storage → KMS with FIPS 140-2 Level 3
Standard → Vault or APP_KEY
Minimal → Environment variable outside web root

How often does the HMAC key need rotation?
↓
Annually → Choose any storage based on rotation support
Per-compromise → Choose storage with easy rotation (Vault, environment variable)

---

## Rationale

The HMAC signing key must be stored separately from the audit log database. If an attacker compromises the database and the signing key is stored there, they can modify log entries and re-compute HMAC signatures, defeating tamper detection. The key should be stored in a secrets manager for production, or at minimum outside the database.

---

## Recommended Default

**Default:** Store HMAC key in environment variable (outside web root, restricted permissions) for simple deployments; secrets manager for compliance-grade deployments
**Reason:** The HMAC key must be accessible to the application but not to the database. Environment variables satisfy this separation. For higher security, a secrets manager adds audit logging and rotation capabilities.

---

## Risks Of Wrong Choice

- HMAC key in the same database as audit logs: DB compromise defeats HMAC
- HMAC key hardcoded: visible in source code, version control
- HMAC key same as APP_KEY: APP_KEY compromise exposes both encryption and HMAC
- No HMAC key rotation: key compromise requires re-signing all logs

---

## Related Rules

- Audit Permission and Role Changes Specifically (05-rules.md)
- Set Retention Policies and Archive Old Audit Logs (05-rules.md)

---

## Related Skills

- Implement Comprehensive Audit Logging with HMAC Integrity Verification (06-skills.md)

---

## Alert Rule Design

---

## Decision Context

Whether to evaluate audit alert rules synchronously (in request) or asynchronously (via queue).

---

## Decision Criteria

* architectural

---

## Decision Tree

Is the alert rule evaluation computationally expensive or I/O-bound?
↓
YES → Async queue evaluation (do not block user request)
NO → Sync or async acceptable

Does the alert need to be triggered in real-time (within seconds)?
↓
YES → Sync with fast evaluation (avoid slow I/O in request path)
NO → Async queue (delayed by seconds — acceptable for most security alerts)

Is the alert rule deterministic and fast (< 1ms)?
↓
YES → Sync evaluation acceptable
NO → Async queue evaluation

What is the consequence of delayed alerting?
↓
High (active attack) → Sync with minimal delay
Low (compliance notification) → Async acceptable

Are there many concurrent requests triggering the same alert rule?
↓
YES → Async queue (prevent thundering herd on notifications)
NO → Sync acceptable

---

## Rationale

Alert rules should generally be evaluated asynchronously via queues to avoid blocking user requests. Most security alerts (failed login rate, unusual access patterns) do not need real-time response — a delay of seconds to minutes is acceptable. Only critical alerts (compromise detection, unauthorized privilege escalation) may warrant synchronous evaluation, and even then the evaluation should be extremely fast.

---

## Recommended Default

**Default:** Async queue evaluation for all alert rules; synchronous evaluation only for fast (< 1ms), high-priority rules where delay is unacceptable
**Reason:** Queue evaluation prevents alert rule processing from blocking user requests. The vast majority of security alerts benefit from historical context (time window analysis) which requires async processing anyway.

---

## Risks Of Wrong Choice

- Sync evaluation of slow rules: user requests blocked by alert processing
- Async for real-time critical alerts: delayed notification during active attack
- No alerting at all: suspicious patterns go undetected
- Alert without cooldown: repeated notifications for same rule trigger

---

## Related Rules

- Use Descriptive and Consistent Log Event Names (05-rules.md)
- Test Audit Logging in Feature Tests (05-rules.md)

---

## Related Skills

- Implement Comprehensive Audit Logging with HMAC Integrity Verification (06-skills.md)
