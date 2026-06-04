# Decision Trees: Log Context & Correlation

## Decision D-01: How to Store Request-Scoped Metadata

**Question:** What mechanism should I use to attach metadata to every log entry in a request?

```mermaid
flowchart TD
    A[Need request-scoped log metadata] --> B{Laravel version?}
    B -->|>= 11| C[Use Context facade]
    B -->|< 11| D{Metadata scope?}
    D -->|Ambient - every log call| E[Use Log::shareContext]
    D -->|Per-call only| F[Use PSR-3 context array]
    C --> G{Metadata changes between requests?}
    G -->|Yes - queue worker| H[Use dehydrate/hydrate]
    G -->|No - pure HTTP| I[Context facade works automatically]
    E --> J{Queue worker compatibility?}
    J -->|Needed| K[Use middleware to reset context per job]
    J -->|Not needed| L[shareContext is sufficient]
```

**Path 1 — Context facade (recommended):** Laravel 11+ provides automatic serialization, scope isolation, and queue integration. This is the production standard.

**Path 2 — shareContext (Laravel 10 fallback):** Works but has known issues with queue workers where context can leak between jobs. Reset explicitly in queue middleware.

**Path 3 — PSR-3 only:** Acceptable for simple applications with few log calls. Every log call must manually include context — error-prone at scale.

---

## Decision D-02: Correlation ID Generation

**Question:** What format should the correlation ID use?

```mermaid
flowchart TD
    A[Need correlation ID format] --> B{Requirements?}
    B -->|Time-sortable| C[ULID - 26 chars]
    B -->|Universally compatible| D[UUID v4 - 36 chars]
    B -->|Short + readable| E[Nanoid - 21 chars]
    C --> F{Database storage?}
    F -->|UUID column type| G[Store as CHAR or BINARY]
    F -->|VARCHAR| H[Store as text]
    D --> I{Log aggregator?}
    I -->|ELK| J[Works with any format]
    I -->|Loki| K[ULID enables time-range scans]
```

**Recommendation:** ULID for new projects — it is sortable, URL-safe, and shorter than UUID v4. Stick with UUID v4 if the organization standard uses it or if compatibility with external systems requires it.

---

## Decision D-03: Context Propagation Strategy for Queues

**Question:** How should context be propagated to queued jobs?

```mermaid
flowchart TD
    A[Queue job needs request context] --> B{Job dispatch location?}
    B -->|From HTTP request| C[Dehydrate context at dispatch]
    B -->|From another job| D[Context already serialized]
    B -->|From CLI command| E[Initialize new context]
    C --> F{Automation approach?}
    F -->|Middleware| G[Create queue middleware class]
    F -->|Manual| H[Hydrate in job constructor]
    G --> I[Register in Job pipeline]
    H --> J[Implement SerializesModels]
    I --> K[Verify in test]
    J --> K
```

**Path 1 — Queue middleware (recommended):** Create `PropagateLogContext` middleware that calls `Context::dehydrate()` on `$job->context` before dispatch and `Context::hydrate()` on execution. Register globally on the Queue facade.

**Path 2 — Manual hydration:** Acceptable for one-off jobs but leads to inconsistencies when multiple developers add new jobs.

---

## Decision D-04: Trace ID Source

**Question:** Where should the trace ID come from for log correlation?

```mermaid
flowchart TD
    A[Need trace ID in logs] --> B{OpenTelemetry used?}
    B -->|Yes| C[Extract from OTel context]
    B -->|No| D{Error tracking used?}
    D -->|Sentry| E[Extract from Sentry scope]
    D -->|Neither| F[Generate in middleware]
    C --> G[Monolog processor reads OTel span]
    E --> H[Inject from Sentry transaction]
    F --> I[Generate UUID at request start]
    G --> J[Add as extra.trace_id]
    H --> K[Add as extra.sentry_trace]
    I --> L[Add as extra.correlation_id]
```

**Recommendation:** Prefer OpenTelemetry as the trace ID source — it ensures consistency between logs and distributed traces. Fall back to Sentry's trace ID if Sentry is used but OTel is not. Generate a simple UUID as the last resort.
