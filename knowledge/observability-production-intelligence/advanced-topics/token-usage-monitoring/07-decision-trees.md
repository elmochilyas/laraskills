# Token Tracking Strategy Decision

```mermaid
flowchart TD
    A[How to track\ntoken usage?] --> B{Need per-user\ndetail?}
    B -->|Yes| C{User count?}
    B -->|No - aggregate\nonly| D[CHEAP:\nOTel Counter metrics\nby model + feature\nonly]
    C -->|< 10K users| E[MEDIUM:\nStructured logs\nper user + per request.\nOTel metrics aggregated.]
    C -->|> 10K users| F[EXPENSIVE:\nLog aggregation service\n(ELK, Loki).\nOTel metrics for\nreal-time monitoring.]
```

# Cost Anomaly Detection Strategy

```mermaid
flowchart TD
    A[Cost anomaly\ndetection setup] --> B{Per-user daily\nbaseline exists?}
    B -->|Yes| C[Anomaly threshold:\n3x baseline for user\n2x baseline for total]
    B -->|No - new feature| D[Start with:\nAbsolute thresholds:\n$50/day per user\n$500/day total]
    C --> E{Baseline\nolder than 7 days?}
    D --> F[Collect baseline data\nfor 7 days, then\nswitch to relative\nalerting]
    E -->|Yes| G[Use relative:\nadaptive to usage\npatterns]
    E -->|No| H[Use absolute:\nuntil baseline\nestablished]
```

# Budget Enforcement Decision

```mermaid
flowchart TD
    A[Budget\nenforcement] --> B{User's token\nusage status?}
    B -->|< 80% of daily\nlimit| C[Normal operation:\nstandard model,\nfull functionality]
    B -->|80-100% of\ndaily limit| D[Warning state:\nsend notification,\ncontinue with\nstandard model]
    B -->|100-120% of\ndaily limit| E[Degraded state:\nswitch to cheaper\nmodel, send warning]
    B -->|> 120% of\ndaily limit| F[Blocked state:\nreject LLM requests,\nsend blocked notification]
```
