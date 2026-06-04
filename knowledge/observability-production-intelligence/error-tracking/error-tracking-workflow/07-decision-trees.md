# Decision Trees: Error Tracking Workflow

## Decision D-01: Error Tracking Platform Selection

**Question:** Which error tracking platform should be used?

```mermaid
flowchart TD
    A[Choose error tracking platform] --> B{Primary need?}
    B -->|Comprehensive workflow| C[Sentey]
    B -->|Laravel-native DX| D[Flare]
    B -->|Cross-platform teams| E[Bugsnag]
    B -->|AI-assisted triage| F[Rollbar]
    C --> G{Scale?}
    G -->|Small team, budget conscious| H[Sentey free tier: 5k events/mo]
    G -->|Enterprise| I[Sentey Business: $26/user/mo]
    D --> J{Laravel focus?}
    J -->|Yes| K[Flare free: 1 project]
    E --> L[Mobile-first?]
    L -->|Yes| M[Bugsnag mobile: 10k events/mo]
    H --> N[Evaluate: integration depth, pricing, self-hosting option]
```

**Recommendation:** Sentry for most Laravel teams — best balance of features, pricing, and Laravel integration. Flare for small Laravel-only teams wanting deeper framework integration.

---

## Decision D-02: Release Version Format

**Question:** What format should the release version use?

```mermaid
flowchart TD
    A[Choose release format] --> B{Deployment method?}
    B -->|CI/CD pipeline| C[git SHA - precise, traceable]
    B -->|Manual deploy| D[Sementic version - readable]
    B -->|Automated rollbacks| E[CI build number - monotonic]
    C --> F[Set SENTRY_RELEASE={git_sha} in CI step]
    D --> G[Manually tag releases]
    E --> H[Extract CI_BUILD_NUMBER]
```

**Recommendation:** git SHA for CI/CD deployments. Semantic version for manually tagged releases. Git SHA provides unambiguous commit-to-error mapping.

---

## Decision D-03: Breadcrumb Configuration

**Question:** Which breadcrumbs should be collected in production?

```mermaid
flowchart TD
    A[Configure breadcrumbs] --> B{Environment?}
    B -->|Development| C[All breadcrumbs - max detail]
    B -->|Production| D[Selective breadcrumbs]
    D --> E[Essential: SQL queries, HTTP calls, user navigation]
    D --> F[Optional: cache hits/misses, log entries]
    D --> G[Exclude: health check queries, assets, heartbeats]
    E --> H[Breadcrumb limit: 50-100 for production]
    F --> I[Evaluate: do these breadcrumbs help debug real errors?]
    G --> J[Use filter callback to exclude patterns]
```

**Recommendation:** Production breadcrumbs = SQL queries + HTTP client calls + user navigation + auth events. Limit to 100 max. Exclude health checks and static assets.
