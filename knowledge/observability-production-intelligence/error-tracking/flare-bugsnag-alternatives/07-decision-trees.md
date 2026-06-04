# Decision Trees: Flare & BugSnag Alternatives

## Decision D-01: Platform Selection

**Question:** Which error tracking platform is best for this team?

```mermaid
flowchart TD
    A[Choose error tracking platform] --> B{App type?}
    B -->|Laravel only| C{Laravel team size?}
    B -->|Laravel + mobile| D[Bugsnag - unified cross-platform]
    B -->|Multi-service| E[Sentey - comprehensive]
    C -->|Small (< 10)| F{Want solutions?}
    C -->|Large| G[Sentey - scale]
    D --> H[Evaluate mobile SDK quality]
    F -->|Yes - solution debugging| I[Flare]
    F -->|No - standard tracking| J[Sentey free tier]
    I --> K[Laravel-idiomatic, solution-based]
    G --> L[Team management, release workflow]
    J --> M[5k events/mo free, upgrade as needed]
```

---

## Decision D-02: SaaS vs Self-Hosted

**Question:** Should the error tracking platform be SaaS or self-hosted?

```mermaid
flowchart TD
    A[SaaS vs Self-hosted] --> B{Data residency required?}
    B -->|Yes| C{Infra team available?}
    B -->|No| D[SaaS - simpler]
    C -->|Yes| E[Can self-host Senty or Honeybadger]
    C -->|No| F[Use SaaS with EU/US data region]
    D --> G{Monthly event volume?}
    G -->|< 1M| H[SaaS cost is acceptable]
    G -->|> 1M| I[Evaluate: SaaS cost vs self-host infra cost]
    E --> J[Self-host infra: PostgreSQL, Redis, ClickHouse, Kafka]
    F --> K[SaaS DPA required for compliance]
    H --> L[Free tier may suffice for small teams]
    I --> M[Self-host can be cheaper at scale but costs ops time]
```

**Recommendation:** SaaS for most teams. Self-host only when data sovereignty regulations force it or at very high volume (>10M events/month) with dedicated ops team.
