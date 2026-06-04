# Decision Trees — Server Error Responses

## Tree 1: Infrastructure Code Resolution

**Decision Context**: Determining the specific error code for a 500 response based on the exception type.

**Decision Criteria**:
- Exception type (QueryException, HttpException, timeout)
- Error source (database, queue, HTTP client, filesystem)

**Decision Tree**:
```
Is the exception related to database access (QueryException, PDOException)?
├── YES → Return SYSTEM.DATABASE_ERROR — database connection or query failure
└── NO → Is the exception related to queue operations?
    ├── YES → Return SYSTEM.QUEUE_ERROR — queue connection or job failure
    └── NO → Is the exception related to external HTTP calls?
        ├── YES → Is it a timeout?
        │   ├── YES → Return SYSTEM.THIRD_PARTY_TIMEOUT — external service timed out
        │   └── NO → Return SYSTEM.THIRD_PARTY_ERROR — external service returned error
        └── NO → Return SYSTEM.INTERNAL_ERROR — unclassified server failure
```

**Rationale**: Infrastructure-specific codes enable differentiated monitoring and alerting. DB, queue, and third-party errors have different recovery paths and owners.

**Recommended Default**: Database → SYSTEM.DATABASE_ERROR. Queue → SYSTEM.QUEUE_ERROR. Third-party → SYSTEM.THIRD_PARTY_ERROR. Unknown → SYSTEM.INTERNAL_ERROR.

**Risks**: Using SYSTEM.INTERNAL_ERROR for all 500s prevents differentiated monitoring. Overly specific codes may leak infrastructure details.

---

## Tree 2: Trace ID Generation Strategy

**Decision Context**: How to generate the trace ID for 500 response correlation.

**Decision Criteria**:
- Uniqueness requirements
- Collision probability
- Consumer expectations
- Log correlation needs

**Decision Tree**:
```
Is the trace ID used for log correlation across multiple services?
├── YES → Generate a UUID v4 — globally unique, no coordination needed between services
└── NO → Is the trace ID used only within a single service?
    ├── YES → Generate UUID v4 or random hex string (16 bytes) — sufficient for single-service correlation
    └── NO → Use UUID v4 — safest default, ensures uniqueness even as the system grows
```

**Rationale**: Trace IDs must be unique enough to correlate logs across services and reliably look up individual error events. UUID v4 is the standard.

**Recommended Default**: UUID v4. Store in the log entry and include in the 500 response body.

**Risks**: Sequential IDs enable request enumeration. Too-short IDs risk collision in high-traffic systems. Reusing request IDs loses the specific error context.
