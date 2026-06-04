# Rules: Observability & Monitoring

## OBS-001: SLOs Must Be Defined
**Condition:** Production Laravel application
**Action:** Define Service Level Objectives (uptime, error rate, latency)
**Rationale:** Without SLOs, you cannot determine if the application is healthy
**Consequences:** Violation makes monitoring metrics meaningless

## OBS-002: Request ID Correlation
**Condition:** Request logging across services
**Action:** Propagate unique request ID through all logs, traces, and error reports
**Rationale:** Without request IDs, tracing a single request across services is impossible
**Consequences:** Violation complicates incident diagnosis

## OBS-003: Telescope Prohibited in Production
**Condition:** Production Laravel environment
**Action:** Do NOT enable Laravel Telescope; use Nightwatch or Sentry instead
**Rationale:** Telescope stores every query and exception, degrading database performance
**Consequences:** Violation causes significant production performance degradation

## OBS-004: Sampling for High Traffic
**Condition:** Application handles > 1000 requests/minute
**Action:** Sample logs and traces; do not store 100% of requests
**Rationale:** Full request storage overwhelms logging infrastructure and increases costs
**Consequences:** Violation causes excessive storage costs and slow log queries
