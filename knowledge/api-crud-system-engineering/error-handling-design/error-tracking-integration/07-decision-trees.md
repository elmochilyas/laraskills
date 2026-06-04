# Decision Trees — Error Tracking Integration

## Tree 1: Error Filtering Strategy

**Decision Context**: Which exceptions to send to the error tracking service and which to suppress.

**Decision Criteria**:
- Exception category (operational vs programmer vs infrastructure)
- Expected vs unexpected
- Volume and budget

**Decision Tree**:
```
Is the exception a programmer error (code bug)?
├── YES → Always send to tracking — programmer errors are unexpected and need fixes
└── NO → Is the exception an operational error (expected runtime failure)?
    ├── YES → Is the operational error high-volume (validation, auth failures)?
    │   ├── YES → Sample (10%) or exclude — expected, high-volume, no action needed
    │   └── NO → Send with low priority — useful for monitoring unusual patterns
    └── NO → Is the exception an infrastructure error?
        ├── YES → Always send — infrastructure errors need ops attention
        └── NO → Send with moderate priority — unclassified errors should be reviewed
```

**Rationale**: Programmer and infrastructure errors must always be tracked. Operational errors (especially high-volume) should be sampled to control budget and noise.

**Recommended Default**: Exclude ValidationException and AuthenticationException. Send all other exceptions. Sample remaining operational errors at 10%.

**Risks**: Excluding too many errors hides real problems. Including all errors floods the dashboard and exhausts the budget.

---

## Tree 2: Context Enrichment Decision

**Decision Context**: What contextual data to attach to error tracking events.

**Decision Criteria**:
- Debugging value
- PII exposure risk
- Tracking budget (each tag costs)

**Decision Tree**:
```
Does the context help identify the affected user without including PII?
├── YES → Include as user context: user_id (not email, not name)
└── NO → Does the context help filter/group errors in the dashboard?
    ├── YES → Include as tags: error_code, domain, environment, release_version
    └── NO → Does the context provide extra debugging detail?
        ├── YES → Include as extra data (not tags — indexed differently): trace_id, request_id, url
        └── NO → Exclude — unnecessary data wastes budget and may leak information
```

**Rationale**: Tags are indexed and searchable — use for filtering. User context for impact assessment. Extra data for debugging depth.

**Recommended Default**: Tags: error_code, domain, environment, release_version. User: user_id (not PII). Extra: trace_id, request_id.

**Risks**: Including PII in tags or user context violates privacy regulations. Including excessive extra data increases event size and tracking costs.
