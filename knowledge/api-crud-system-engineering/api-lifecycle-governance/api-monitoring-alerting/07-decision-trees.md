# Decision Trees — API Monitoring and Alerting

## Tree 1: Alerting Strategy Selection

**Decision Context**: Choosing the alerting approach — whether to use burn rate alerting, fixed threshold alerting, or anomaly detection based on API maturity and SLO definition.

**Decision Criteria**:
- SLO definition existence
- Error budget calculation maturity
- Alert fatigue history
- API traffic patterns (stable vs bursty)

**Decision Tree**:
```
Do you have defined SLOs with error budgets?
├── YES → Use burn rate alerting: alert when error budget consumed at ≥2x expected rate for 1 hour or ≥10x for 6 minutes
└── NO → Can you establish SLOs and error budgets within 2 weeks?
    ├── YES → Implement SLOs + burn rate alerting (industry best practice)
    └── NO → Is the API traffic stable and predictable?
        ├── YES → Fixed threshold alerting with multi-window: 5% error rate for 5 minutes + 3% for 30 minutes
        └── NO → Is your team suffering from alert fatigue?
            ├── YES → Prioritize SLO definition; in the meantime, use wider fixed thresholds + longer windows
            └── NO → Fixed thresholds with periodic review; plan SLO migration in next quarter
```

**Rationale**: Burn rate alerting is strictly superior to fixed thresholds — it measures SLO impact rather than raw error rate. Short-term fixed thresholds are acceptable during SLO definition phase.

**Recommended Default**: Burn rate alerting with multi-window detection: 2x budget consumption for 1 hour (page) and 10x for 6 minutes (page).

**Risks**:
- Fixed thresholds cause alert fatigue from short transient spikes
- Burn rate without proper SLO definition gives misleading signals
- No multi-window configuration misses either sustained or burst issues

**Related Rules/Skills**: Rules: Alert on Error Budget Burn Rate, Not Raw Error Rate, Implement Multi-Window, Multi-Burst Alerting. Skills: Monitor and Alert on API Health.

---

## Tree 2: Health Check Depth Selection

**Decision Context**: Determining how thorough health checks should be — lightweight 200-only, dependency verification, or full integration checks.

**Decision Criteria**:
- Criticality of each dependency
- Health check latency budget (<100ms)
- Dependency failure blast radius
- Downstream consumer reliance on health endpoint

**Decision Tree**:
```
Is this API consumer-facing with an SLA?
├── YES → Full dependency verification: database, cache, queue, critical service integrations
│        Respond within 100ms; return 200 only if all deps healthy, 503 if any degraded
└── NO → Is this an internal API?
    ├── YES → Does the API have critical downstream dependencies?
    │   ├── YES → Dependency verification for critical deps; lightweight for non-critical
    │   └── NO → Lightweight check: return 200 with minimal dependency probing
    └── NO → Is this a development/staging environment?
        ├── YES → Simple 200 OK; dependency details in response body but don't fail on dep issues
        └── NO → Standard dependency verification (safe default)
```

**Rationale**: Consumer-facing APIs with SLAs need real dependency verification. Internal and dev APIs can use lighter checks. Always respond within 100ms regardless of depth.

**Recommended Default**: Verify database, cache, and queue connectivity. Respond within 100ms. Return 200 if all healthy, 503 if any dependency fails.

**Risks**:
- Health check without deps gives false sense of security
- Too many dependency checks make health endpoint slow (>100ms)
- Checking non-critical deps causes false degradation signals

**Related Rules/Skills**: Rules: Implement Health Checks with Dependency Verification. Skills: Monitor and Alert on API Health.

---

## Tree 3: Monitoring Dashboard Tier Selection

**Decision Context**: What dashboards to create and for which audiences — whether to use three-tier dashboards or a single dashboard, and what metrics to include in each.

**Decision Criteria**:
- Audience (executive, team, on-call)
- Decision-making needs per audience
- Dashboard maintenance capacity
- Metric granularity requirements

**Decision Tree**:
```
Is this API consumer-facing with business impact?
├── YES → Three-tier dashboards:
│   - Executive: uptime %, error budget, revenue impact, top consumer usage
│   - Operational (team): RED metrics, endpoint-level breakdowns, dependency health
│   - Tactical (on-call): real-time RED, active alerts, runbook links, recent deployments
└── NO → Is the team larger than 5 people?
    ├── YES → Two-tier dashboards:
    │   - Operational: RED metrics, endpoint health, dependency health
    │   - Tactical: active alerts, recent errors, key metrics
    └── NO → Single dashboard with all relevant metrics for the team
```

**Rationale**: Three-tier dashboards serve different decision-making needs without overwhelming any audience. Executive dashboards focus on business impact; tactical dashboards focus on immediate response.

**Recommended Default**: Three-tier: executive (business), operational (team), tactical (on-call).

**Risks**:
- Dashboard sprawl creates confusion (no single source of truth)
- Single dashboard tries to serve all audiences poorly
- No tactical dashboard slows incident response

**Related Rules/Skills**: Rules: Monitor Using RED Method for Every Service. Skills: Monitor and Alert on API Health.
