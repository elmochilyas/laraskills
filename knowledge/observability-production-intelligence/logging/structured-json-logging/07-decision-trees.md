# Decision Trees: Structured JSON Logging

## Decision D-01: Formatter Selection

**Question:** Which formatter should a channel use?

```mermaid
flowchart TD
    A[Choose log formatter] --> B{Environment?}
    B -->|Local development| C[LineFormatter - readable]
    B -->|Staging| D[JsonFormatter - match prod]
    B -->|Production| E{Ingestion pipeline?}
    E -->|Direct to ELK| F[JsonFormatter]
    E -->|Logstash| G[LogstashFormatter]
    E -->|Loki| H[JsonFormatter]
    E -->|Datadog| I[JsonFormatter]
    C --> J[No appendNewline needed]
    F --> K[Set appendNewline: true]
    G --> L[Use LogstashFormatter::class]
    K --> M[Configure depth limits]
```

**Recommendation:** Use `JsonFormatter` for all production channels. Only switch to `LogstashFormatter` if Logstash is in the ingestion path.

---

## Decision D-02: Context Data Structure

**Question:** Should context be flattened or nested in JSON output?

```mermaid
flowchart TD
    A[Context data structure] --> B{Number of domains?}
    B -->|Single domain| C[Flattened - simple queries]
    B -->|Multiple domains| D{Field collision risk?}
    C --> E[user_id, order_id, amount]
    D -->|High| F[Nested - domain prefix]
    D -->|Low| G[Flattened with prefix]
    F --> H[auth.user_id, billing.order_id]
    G --> I[auth_user_id, billing_order_id]
```

**Recommendation:** Flattened with prefix for most applications. Nested for complex multi-domain contexts with high collision risk.

---

## Decision D-03: Depth Limit Configuration

**Question:** What maxNormalizeDepth setting is appropriate?

```mermaid
flowchart TD
    A[Set max depth] --> B{Context complexity?}
    B -->|Simple scalars only| C[depth=2 - message + context]
    B -->|Shallow arrays| D[depth=3]
    B -->|Eloquent models| E{depth=5 - typical max}
    B -->|Arbitrary objects| F[depth=5+ with review]
    C --> G[items: 50]
    D --> H[items: 100]
    E --> I[items: 100]
    F --> J[items: 50 - more cautious]
```

**Recommendation:** Depth=5, Items=100 as default. Increase only after reviewing actual context data shape.
