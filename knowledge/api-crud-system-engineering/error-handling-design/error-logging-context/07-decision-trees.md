# Decision Trees — Error Logging Context

## Tree 1: Context Field Selection

**Decision Context**: Determining which context fields to include in error log entries.

**Decision Criteria**:
- Debugging value of the field
- Sensitivity of the data
- Log storage cost
- Compliance requirements

**Decision Tree**:
```
Is the field essential for debugging production errors?
├── YES → Is the field sensitive (PII, credentials, tokens)?
│   ├── YES → Never include — find a non-sensitive proxy or redact immediately
│   └── NO → Include in context — trace_id, user_id (not email), request_id, url, method, ip
└── NO → Is the field helpful for correlation but not critical?
    ├── YES → Include only if log storage budget allows — user_agent, referer, session_id
    └── NO → Exclude — unnecessary context adds storage cost without debugging value
```

**Rationale**: Every context field should justify its storage cost and not carry sensitive data. Core fields (trace_id, user_id, url, method) are always included.

**Recommended Default**: Always include: trace_id, user_id, request_id, url, method, ip, environment. Never include: credentials, tokens, raw request body.

**Risks**: Including too many peripheral fields inflates log storage costs. Excluding essential fields makes production debugging impossible.

---

## Tree 2: Context Enrichment Strategy

**Decision Context**: Whether to add context globally (via handler) or per-catch-block.

**Decision Criteria**:
- Context scope (request-level vs error-specific)
- Context consistency requirement
- Context availability at time of error

**Decision Tree**:
```
Is the context applicable to all errors in the request lifecycle?
├── YES → Use Handler::context() — trace_id, user_id, url, method; automatically added to every log
└── NO → Is the context specific to a particular operation or error?
    ├── YES → Log::withContext() in middleware or service — scoped to request, automatically included in all logs for that request
    └── NO → Is the context only relevant to a specific catch block?
        ├── YES → Log::error() context parameter — one-time context specific to this error
        └── NO → Handler::context() — per-request context is the correct default
```

**Rationale**: Request-level context should be set once globally. Operation-specific context should be set via Log::withContext(). One-off context goes in the log call.

**Recommended Default**: Use Handler::context() for request-level context. Use Log::withContext() in middleware for operation-level context.

**Risks**: Per-catch-block context leads to inconsistency. Setting context in the exception constructor creates logs for exceptions that are caught and never logged.
