# Decision Trees — Sensitive Data Leak Prevention

## Tree 1: Data Classification for Error Context

**Decision Context**: Classifying whether a piece of data is safe to include in error context, logs, and outgoing responses.

**Decision Criteria**:
- Data type (PII, credentials, internal, public)
- Exposure scope (response body, logs, error tracking)
- Compliance requirements (GDPR, PCI DSS, HIPAA)

**Decision Tree**:
```
Is the data a credential or token (password, api_key, authorization header)?
├── YES → NEVER include in any output — response, logs, tracking, debug
└── NO → Is the data PII (email, name, phone, IP, address)?
    ├── YES → Can it be anonymized or aggregated?
    │   ├── YES → Include anonymized form only — user_id instead of email, masked IP
    │   └── NO → Never include — find a non-PII proxy
    └── NO → Is the data internal (file paths, SQL, configuration values)?
        ├── YES → Include in logs (internal debugging) but NEVER in response body
        └── NO → Is the data public (error codes, generic messages, timestamps)?
            ├── YES → Safe to include in all outputs
            └── NO → Default to excluding — assume sensitive until proven safe
```

**Rationale**: Three-tier classification: public (include everywhere), internal (logs only), sensitive (never include). Prevention at source is the most effective layer.

**Recommended Default**: Exclude by default. Only include data explicitly classified as safe.

**Risks**: Including sensitive data even in "internal" logs creates breach risk if logs are compromised. Over-excluding useful data hinders debugging.

---

## Tree 2: Redaction Safety Net Configuration

**Decision Context**: Configuring automated redaction for error context that may contain sensitive data.

**Decision Criteria**:
- Code maturity (confidence that throw sites don't include sensitive data)
- Compliance requirements
- Log channel configuration

**Decision Tree**:
```
Is the codebase mature with strict code review that prevents sensitive data in exceptions?
├── YES → Lightweight redaction — key-name pattern matching as safety net
└── NO → Is the application subject to compliance requirements (GDPR, PCI DSS)?
    ├── YES → Aggressive redaction — key-name pattern matching + regex PII detection + automated testing
    └── NO → Moderate redaction — key-name pattern matching is sufficient
```

**Rationale**: Redaction is a safety net, not primary defense. Layered approach: prevent at source → redact at handler → redact in log processor.

**Recommended Default**: Key-name pattern redaction for passwords, tokens, secrets. Recursive scan of context arrays.

**Risks**: Overly aggressive redaction removes useful diagnostic data. Insufficient redaction risks data leaks through logs and tracking.
