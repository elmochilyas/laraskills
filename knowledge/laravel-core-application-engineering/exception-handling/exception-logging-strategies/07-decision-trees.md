# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Exception Logging Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

* Log Level by Exception Type (ERROR vs WARNING vs INFO)
* Log Channel per Exception Type (stack vs slack vs database vs syslog)
* Structured Context in Exception Logs

---

# Architecture-Level Decision Trees

---

## Decision 1: Log Level by Exception Type (ERROR vs WARNING vs INFO)

---

## Decision Context

What log level to assign when a specific exception type is logged, determining its severity in monitoring and alerting systems.

---

## Decision Criteria

* Whether the exception represents an expected, handled condition or an unexpected failure
* Whether the exception requires immediate engineering attention
* Whether the exception is user-error (bad input, 404) vs system-error (database down, queue failure)
* Whether the exception triggers automated recovery (retry queue, failover)

---

## Decision Tree

Does the exception represent an expected, handled condition (validation failure, 404, rate limit hit)?
↓
YES → Does the exception automatically trigger recovery on retry (queue retries, circuit breaker)?
    YES → `INFO` — normal operational flow, no engineering attention needed
    NO → `WARNING` — expected but notable, review periodically but no alert needed
NO → Is the exception a system/infrastructure failure (database connection, API timeout, disk full)?
    YES → `ERROR` — requires investigation, alert on-call
    NO → Is the exception a domain business rule violation?
        ↓
        YES → `WARNING` — expected domain behavior, not a system failure
        NO → Is the exception an unhandled/unexpected error?
            ↓
            YES → `ERROR` — requires investigation
            NO → `WARNING` — default for exceptions not explicitly categorized

---

## Rationale

Log levels drive alerting. `ERROR` should mean "a human needs to look at this now." `WARNING` means "this is notable but not urgent." `INFO` means "this is part of normal operations." Misleveling causes alert fatigue (too many ERRORs) or missed incidents (ERROR-level failures logged as WARNING).

---

## Recommended Default

**Default:** `ERROR` for system/infrastructure failures. `WARNING` for domain business rule violations. `INFO` for expected handled exceptions (validation, 404).
**Reason:** This mapping ensures alerting systems fire only on actionable failures while preserving visibility into domain-level issues.

---

## Risks Of Wrong Choice

* All exceptions at ERROR: Alert fatigue — operations ignores all alerts
* All exceptions at INFO: System failures go unnoticed until users report them
* Business rules at ERROR: False positives in monitoring, wasted investigation time
* Validation at ERROR: Log noise — every malformed form submission triggers an alert

---

## Related Rules

* Exception Log Level Assignment
* Centralized Exception Reporting

---

## Related Skills

* Exception Log Level Configuration
* Exception Handler Configuration

---

---

## Decision 2: Log Channel per Exception Type (stack vs slack vs database vs syslog)

---

## Decision Context

Whether to route different exception types to different log channels (e.g., payment errors to a dedicated Slack channel, security errors to syslog, general errors to the stack).

---

## Decision Criteria

* Whether different teams own different exception types (payments team monitors payment errors)
* Whether compliance requirements demand specific log storage (security events in immutable store)
* Whether the exception type generates high volume that should not pollute the main log
* Whether real-time notification is needed for specific exception types

---

## Decision Tree

Does the exception type have a specific team that needs immediate notification?
↓
YES → Route to team's notification channel (Slack, email, PagerDuty) — separate from main log
NO → Does the exception require specific compliance or retention (security, audit, financial)?
    YES → Route to dedicated immutable store (syslog, database, S3) — separate retention policy
    NO → Does the exception type generate high volume that would pollute the main log?
        YES → Route to a separate file channel or low-priority channel
        NO → Does the exception type need real-time alerting vs batch review?
            ↓
            YES → Route to real-time channel (Slack, webhook) for immediate attention
            NO → Use default `stack` channel — all other exceptions

---

## Rationale

The default `stack` channel is appropriate for most exceptions. Separate channels are justified when there's a specific operational need — team ownership, compliance, volume isolation, or real-time alerting. Each additional channel adds configuration overhead and maintenance cost.

---

## Recommended Default

**Default:** Route all exceptions to the default `stack` channel. Add dedicated channels only for team-specific alerting (Slack per team) or compliance requirements (immutable security log).
**Reason:** Channel proliferation creates configuration debt. Only split when there's a clear operational benefit.

---

## Risks Of Wrong Choice

* All exceptions to Slack: Channel noise — team ignores or leaves the channel
* Security exceptions to default stack: Compliance violation — security events must be in immutable store
* High-volume exceptions to default stack: Log rotation fills too fast, useful data rotated out
* Separate channel per exception type: Configuration nightmare, 50 log channels for 50 exception types

---

## Related Rules

* Exception Log Level Assignment
* Centralized Exception Reporting

---

## Related Skills

* Exception Log Level Configuration
* Log Channel Configuration

---

---

## Decision 3: Structured Context in Exception Logs

---

## Decision Context

What context data to include when logging an exception to make debugging efficient without leaking sensitive information.

---

## Decision Criteria

* Whether the context contains Personally Identifiable Information (PII) or secrets
* Whether the context is available at the point the exception is thrown
* Whether the context adds meaningful debugging value (request ID, user ID, entity ID, stack trace)
* Whether the exception is expected to occur frequently (high volume = minimize context overhead)

---

## Decision Tree

Does the context contain PII (email, phone, IP, name) or secrets (password, token, API key)?
↓
YES → Strip from logs — log a correlation ID instead, store PII in a secure audit trail
NO → Is the context available at the point the exception is thrown?
    YES → Include — logging at source is more reliable than reconstructing context
    NO → Add context via the exception's `context()` method or handler's `reportable()` callback
NO → Does the context include identifiers needed for debugging (request UUID, user ID, entity ID, trace ID)?
    YES → Always include — without these, reproducing the error is difficult
    NO → Is the exception high-volume (>100/hour)?
        YES → Minimize context — log only essential identifiers, skip full request data
        NO → Include full relevant context (input data, state, stack trace)

---

## Rationale

Structured context is the difference between "an error occurred" and "user 42 got a payment failure on order 1001 at 3:02pm UTC with provider Stripe." Without identifiers, every exception requires manual correlation. With PII, every log entry is a compliance risk.

---

## Recommended Default

**Default:** Always log request UUID, user ID, and entity ID for any exception. Never log passwords, tokens, or raw input that may contain PII. Add `context()` method to custom exceptions to include relevant state.
**Reason:** Identifiers make exceptions debuggable. Stripping PII ensures log compliance. Context on the exception keeps the data close to the source.

---

## Risks Of Wrong Choice

* No identifiers in context: "PaymentException" is useless — no way to find the affected user, order, or time
* Full request data logged: PII exposure — email, IP, credit card details in plaintext logs
* PII in production logs: GDPR/CCPA violation potential liability, mandatory breach notification
* Context on high-volume exceptions: Log storage costs, I/O overhead for every occurrence

---

## Related Rules

* Exception Log Context
* Sensitive Data Protection in Logs

---

## Related Skills

* Exception Log Level Configuration
* Structured Exception Logging
