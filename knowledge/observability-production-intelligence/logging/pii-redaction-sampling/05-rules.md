# Rules: PII Redaction & Log Sampling

## Rule PRS-01: Apply redaction before sampling in processor pipeline
**Condition:** When both redaction and sampling are configured on a log channel.
**Action:** Ensure the redaction processor is registered before the sampling processor in the processor pipeline.
**Consequence:** Sampled entries never contain unredacted PII — even if sampling selects them, they were already cleaned.
**Violation:** If sampling runs first, unredacted PII may be persisted in the sampled output.

## Rule PRS-02: Never sample error-level log entries
**Condition:** When configuring log sampling rules.
**Action:** Always exclude `error`, `critical`, and `emergency` severity levels from sampling. These levels must be recorded at 100% rate.
**Consequence:** No production errors are lost due to sampling. Debugging is always possible for error conditions.

## Rule PRS-03: Configure redaction patterns in config, not hardcoded
**Condition:** When implementing PII redaction patterns and rules.
**Action:** Store redaction field names, regex patterns, and masking strategies in `config/logging.php` or a dedicated `config/redaction.php`. Reference from processor.
**Consequence:** Redaction rules are deployable without code changes, auditable, and environment-configurable.

## Rule PRS-04: Use field allowlisting over blocklisting
**Condition:** When designing the PII redaction strategy.
**Action:** Define an explicit allowlist of fields that are safe to log. Redact everything not on the allowlist. Supplement with specific blocklist patterns for message text.
**Consequence:** New sensitive fields introduced by future development are redacted by default. Blocklisting requires knowing every field name in advance.
**Exception:** If the log schema is well-defined and controlled, blocklisting is acceptable with regular audits.

## Rule PRS-05: Benchmark redaction regex performance
**Condition:** When deploying redaction processors to production.
**Action:** Measure regex execution time against a representative sample of log entries. Ensure per-entry overhead < 200μs.
**Consequence:** Redaction does not become a performance bottleneck.
**Violation:** Complex regex (especially Luhn checks) can add milliseconds per entry, impacting throughput.

## Rule PRS-06: Exclude health checks and static assets from sampling
**Condition:** When configuring sampling rates.
**Action:** Configure sampling processors to drop or reduce rate for known-noise entries (health check endpoints, static asset requests).
**Consequence:** Sampling budget is spent on meaningful traffic, not monitoring infrastructure noise.

## Rule PRS-07: Tail-based sampling requires memory budget planning
**Condition:** When implementing tail-based log sampling.
**Action:** Calculate expected concurrent trace count × average trace size × sampling window duration. Budget memory accordingly. Set buffer overflow policy (drop oldest vs reject new).
**Consequence:** Predictable memory usage. No OOM from unbounded trace buffering.

## Rule PRS-08: Redact PII from exception messages and stack traces
**Condition:** When configuring redaction processors.
**Action:** Apply redaction regex to `$record['message']` and `$record['extra']['exception']` in addition to `$record['context']`.
**Consequence:** PII in exception messages (user input in validation errors, SQL parameters in query exceptions) is redacted before storage.

## Rule PRS-09: Test redaction on production-like data before deploy
**Condition:** Before deploying new redaction rules.
**Action:** Run redaction processor against anonymized production log snapshot. Verify: (1) known PII patterns are masked, (2) no false positives on safe data, (3) no fields entirely redacted to uselessness.
**Consequence:** Confidence that redaction is both effective and non-destructive.

## Rule PRS-10: Monitor and alert on sampling effectiveness
**Condition:** When sampling is active.
**Action:** Track metrics: entries before sampling, entries after sampling, effective sampling rate. Alert if actual rate deviates from configured rate by >10%.
**Consequence:** Visibility into whether sampling is performing as designed. Early detection of misconfiguration.
