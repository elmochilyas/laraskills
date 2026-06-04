# Anti-Patterns: PII Redaction & Log Sampling

## AP-PRS-01: Post-Persistence Redaction

**Description:** Writing sensitive data to log files first, then running a batch process to redact or delete it after the fact.

**Why It Happens:** Teams implement redaction at the aggregation layer (ELK pipeline, log viewer filter) rather than in the application logging pipeline, believing it is "good enough."

**Consequences:**
- Window of exposure between log write and batch redaction — if storage is compromised during that window, PII is exposed
- Raw log files on disk contain unredacted data indefinitely
- Log shippers and aggregators may have already indexed the sensitive data

**Detection:** Check if redaction logic exists only in aggregator configurations (Logstash filters, Datadog exclusion queries) and not in Monolog processors.

**Remediation:** Move redaction to the Monolog processor pipeline. The processor runs before the formatter, ensuring only redacted data is ever written.

---

## AP-PRS-02: Sampling Error-Level Logs

**Description:** Configuring a sampling rate that inadvertently affects error, critical, or emergency log entries.

**Why It Happens:** Sampling rate is configured globally without level-based exclusion. Developers test with info-level entries and do not verify error handling.

**Consequences:**
- Production errors are silently lost
- Debugging incidents becomes impossible — the error that triggered the investigation was not recorded
- False sense of observability completeness

**Detection:** Check sampling processor logic for level exclusion. Test by generating an error entry and verifying it appears in storage at 100% rate regardless of sampling config.

**Remediation:** Add explicit level exclusion in the sampling processor. Reference numeric Monolog levels for reliable comparison.

---

## AP-PRS-03: Overly Aggressive Redaction

**Description:** Redacting so broadly that all log context fields show `[REDACTED]`, rendering logs useless for debugging.

**Why It Happens:** A compliance-driven mandate to "redact everything" without balancing operational needs. Blocklist patterns match too broadly.

**Consequences:**
- Engineers cannot debug production issues using logs
- Valuable operational signals (request IDs, correlation IDs, feature flags) are lost
- Team develops workarounds (temporary disable redaction in production) that create worse risk

**Detection:** Compare redacted vs unredacted logs for a set of known safe fields. If fields like `correlation_id`, `request_path`, or `http_method` are redacted, the redaction is too aggressive.

**Remediation:** Define an allowlist of operational fields that are always safe to log. Redact everything else. This ensures operational debuggability is preserved while PII is eliminated.

---

## AP-PRS-04: Fixed Sampling Rate Ignoring Traffic Patterns

**Description:** Setting a fixed sampling rate (e.g., 10%) that does not adapt to time-of-day or endpoint-specific traffic variations.

**Why It Happens:** Simplicity — a single rate is easy to configure and reason about.

**Consequences:**
- During peak traffic, the 10% sample still produces more entries than the log budget can handle
- During off-peak traffic, the 10% sample is too sparse — useful debugging context is lost
- Sampling budget is wasted on noise endpoints (health checks, static assets) while useful endpoints are undersampled

**Detection:** Compare per-hour log volume at the configured sampling rate vs the log budget. If peak hours exceed budget or off-peak hours produce too few entries, fixed rate is the problem.

**Remediation:** Implement dynamic sampling that adjusts rate based on traffic volume per endpoint. Use a higher rate during off-peak and lower rate during peak. Exclude health checks entirely.
