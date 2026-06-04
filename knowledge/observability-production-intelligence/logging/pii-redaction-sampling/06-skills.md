# Skill: Implement PII Redaction and Log Sampling for Laravel

## Purpose
Implement PII redaction and log sampling for Laravel applications to protect sensitive data and control log storage costs at scale.

## When To Use
- Production applications handling user data requiring compliance (GDPR, CCPA, PCI-DSS)
- High-traffic applications with growing log storage costs
- Multi-tenant SaaS platforms needing cross-tenant data isolation in logs

## When NOT To Use
- Development/staging with synthetic data
- Applications with no user-supplied data processing

## Prerequisites
- Monolog processor pipeline configured (Monolog Architecture skill)
- Knowledge of applicable regulations (GDPR, CCPA, PCI-DSS)
- Representative log data for testing redaction rules

## Inputs
- List of known PII fields in the application
- Log storage budget and current ingestion rate
- Regulatory requirements for data retention and masking
- Traffic patterns (peak/off-peak volume, concurrent request count)

## Workflow
1. **Audit current log content**: Collect a representative sample of production log entries. Identify all fields containing PII, secrets, or sensitive data. Document field names, data types, and context locations (message, context, extra).
2. **Define redaction rules**: For each PII field, decide masking strategy: full redaction (`[REDACTED]`), partial mask (`j***@example.com`), hash (consistent HMAC for joinability), or truncation (first N chars). Store in `config/redaction.php`.
3. **Implement redaction processor**: Create `App\Logging\Processors\PiiRedactionProcessor`. Apply field-name matching for structured context data, regex matching for message text. Register in production channel config.
4. **Determine sampling strategy**: Calculate daily log volume target. Choose head-based (simple, low overhead) or tail-based (accurate, higher memory). Set base rate. Configure error-level exclusion.
5. **Implement sampling processor**: Create `App\Logging\Processors\SamplingProcessor`. Implement rate check with level exclusion. Register after redaction processor.
6. **Test in staging**: Run against anonymized production logs. Verify redaction effectiveness. Measure processor overhead. Validate sampling rate accuracy.
7. **Monitor and adjust**: Track log volume, redaction coverage, sampling effectiveness. Adjust rate based on traffic patterns and budget.

## Validation Checklist
- [ ] Known PII fields redacted from all log entry locations
- [ ] Credit card number patterns detected and masked
- [ ] Password/secret/token fields never appear in logs
- [ ] Redaction processor overhead < 200μs per entry
- [ ] Error-level entries never sampled
- [ ] Actual sampling rate within 10% of configured rate
- [ ] Redaction rules stored in version-controlled config
- [ ] No false positive redaction of safe system fields
- [ ] Log storage cost projected at configured sampling rate
- [ ] Redaction tested against production-like data

## Common Failures
- **Redaction after persistence:** Sensitive data written to disk before redaction. Processor runs too late in pipeline.
- **Missing exception message redaction:** PII in validation error messages not caught because only context fields are redacted.
- **Sampling errors:** Error-level logs caught in sampling due to wrong level comparison. Always exclude by numeric level value.
- **Performance cliff:** Complex regex (Luhn check) adds 1-5ms per entry. Use simple pattern matching or pre-validation.

## Decision Points
- **Field name allowlist vs blocklist:** Allowlist for known-safe schemas; blocklist for dynamic or user-defined fields.
- **Head-based vs tail-based sampling:** Head-based for simple cost control; tail-based for accuracy when complete traces matter.
- **Hash vs full redaction:** Hash when you need to correlate entries by the same user without exposing the identifier; full redaction when identity is irrelevant.
- **Regex vs exact match:** Exact match for structured context fields; regex for free-text message content.

## Performance Considerations
- Head-based sampling: O(1), ~1μs per entry
- Regex redaction: 20-200μs per pattern per entry
- Tail-based sampling: proportional to concurrent trace count (buffer memory)
- Batch redaction for array context: process array once, not element-by-element
- Use `mb_*` functions for regex to handle UTF-8 correctly

## Security Considerations
- Redact in processor pipeline, never after storage
- Redaction patterns in config must not reveal internal structure
- Test redaction with adversarial inputs (null bytes, Unicode tricks)
- Hash stable identifiers with a secret salt to prevent rainbow table reversal
- Regular audit: compare raw vs redacted log samples quarterly

## Related Skills
- Monolog Architecture & Channel Configuration
- Span Sampling Strategies
- Structured JSON Logging

## Success Criteria
- Zero PII leaks in production logs (verified by quarterly audit)
- Log storage costs within budget at configured sampling rate
- Redaction processor overhead under 200μs per entry
- Error-level entries always recorded regardless of sampling
- Redaction rules deployable without application restart
