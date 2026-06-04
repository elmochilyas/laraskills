# Decision Trees: Sentry Laravel Integration

## Decision D-01: Sampling Strategy

**Question:** How should Sentry performance tracing be sampled?

```mermaid
flowchart TD
    A[Configure tracing sampling] --> B{Traffic volume?}
    B -->|< 100 req/s| C[High sampling: 0.5-1.0]
    B -->|100-1000 req/s| D[Moderate: 0.1-0.5]
    B -->|> 1000 req/s| E[Low: 0.01-0.1]
    C --> F{Health checks included?}
    D --> F
    E --> F
    F -->|Yes| G[Exclude in sampler, return 0.0]
    F -->|No| H[Use base rate]
    G --> I{Parent sampling preserved?}
    H --> I
    I -->|Yes| J[ParentBased sampler with TraceIdRatio fallback]
    I -->|No| K[Pure TraceIdRatio]
    J --> L[Implementation: traces_sampler callback]
    K --> L
```

## Decision D-02: Breadcrumb Selection

**Question:** Which breadcrumb types should be collected?

```mermaid
flowchart TD
    A[Configure breadcrumbs] --> B{Production or dev?}
    B -->|Development| C[All breadcrumbs]
    B -->|Production| D[Selective]
    D --> E[Essential: SQL queries, HTTP client, navigation]
    D --> F[Optional: cache, log entries]
    D --> G[Exclude: health checks, static assets, debug logs]
    E --> H[Buffer limit: 100 for production]
    F --> I[Evaluate: do these help debug production errors?]
    G --> J[Use Sentry::configureScope to filter]
```

## Decision D-03: Profiling Configuration

**Question:** Should profiling be enabled in production?

```mermaid
flowchart TD
    A[Configure profiling] --> B{Performance investigation active?}
    B -->|Yes| C[Enable profiling: profiles_sample_rate = sampling_rate]
    B -->|No, not currently| D[Disable: profiles_sample_rate = 0.0]
    C --> E{Accept 5% CPU overhead?}
    E -->|Yes| F[Keep enabled during investigation window]
    E -->|No| G[Use Blackfire or XHProf for targeted profiling]
    D --> H[Enable temporarily when investigating CPU issues]
    F --> I[Document investigation period for cost tracking]
```
