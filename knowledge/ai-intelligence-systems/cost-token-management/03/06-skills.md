# Skills

## Skill 1: Define SLOs and implement burn-rate alerting for AI system reliability

### Purpose
Establish Service Level Objectives (SLOs) for AI latency, error rate, and cost per request, then configure burn-rate alerts that measure error budget consumption to detect and respond to reliability degradation before it impacts users.

### When To Use
- Use when deploying AI features to production and need reliability guarantees
- Use when you need to distinguish normal metric variation from service degradation
- Use when implementing an observability dashboard for your AI system
- Use when defining team on-call responsibilities for AI operations

### When NOT To Use
- Do NOT use in development environments where only trend observation is needed
- Do NOT use for one-off experimental AI features without user-facing impact
- Do NOT use when you have not yet collected baseline metrics to set realistic SLOs

### Prerequisites
- Cost tracking and token usage analytics implemented (ku-01)
- Access to AI latency and error rate metrics (from provider responses or middleware)
- An observability platform (Grafana, Datadog, CloudWatch)
- Historical metric data (minimum 2 weeks) to set baseline SLOs
- Team agreement on acceptable reliability thresholds

### Inputs
- Historical p50/p95/p99 latency data for each AI feature
- Historical error rate data (provider errors, timeout, content filtering)
- Cost per request data
- Business requirements for reliability and cost

### Workflow
1. Document SLOs for the three primary AI metrics:
   - p95 latency: `< 2s` for chat, `< 5s` for complex analysis
   - Error rate: `< 1%` of all AI requests
   - Cost per request: `< $0.01` for simple chat, `< $0.05` for complex
2. Define the error budget: `(1 - SLO_target) * total_requests` over the window
3. Implement metric collection middleware capturing latency, error status, and cost per request
4. Configure burn-rate alerts (not static threshold alerts):
   - 2x burn rate over 1 hour → P2 notification
   - 3x burn rate over 30 minutes → P1 page
5. Build a dashboard showing SLO compliance, burn rate, and error budget remaining
6. Set up separate SLOs per model/agent combination (different models have different baselines)
7. Review and adjust SLOs quarterly based on operational experience

### Validation Checklist
- [ ] SLOs are documented and agreed upon by the team
- [ ] p95 latency alerts are configured (not average)
- [ ] Burn-rate alerts are configured, not static threshold alerts
- [ ] Separate SLOs exist for each model/agent combination
- [ ] Error budget is computed and displayed on the dashboard
- [ ] Alerts have appropriate severity levels (P1, P2, P3)
- [ ] Dashboards include SLO target lines and burn rate indicators
- [ ] Alert fatigue is monitored — adjust thresholds if needed

### Common Failures
- **Averages hide problems**: Average latency looks fine but p95 is 10x worse — always use percentile metrics
- **Static threshold noise**: Traffic bursts trigger false alarms — use burn-rate instead
- **Single SLO for all models**: Fast models and slow models need different SLOs
- **No error budget tracking**: Can't tell if the system is within SLO without budget monitoring
- **Alert fatigue**: Too many alerts from poorly tuned thresholds — teams ignore pages

### Decision Points
- **SLO stringency**: Tight SLOs (99.9%) are expensive — balance reliability with cost
- **Alert severity**: P1 for user-facing degradation, P2 for potential issues, P3 for informational
- **Burn rate window**: Shorter windows (15 min) catch issues fast but may be noisy; longer (1 hour) are more reliable

### Performance Considerations
- Metric collection adds <0.1ms overhead per request — negligible
- Dashboard queries should use pre-aggregated summaries, not raw event data
- Alert evaluations should be cached and not query raw data on every check
- Store metric data in a time-series database optimized for range queries

### Security Considerations
- SLO dashboards may reveal traffic patterns — restrict access to operations team
- Cost per request data may be business-sensitive — don't expose externally
- Error details may reveal internal architecture — sanitize in external alerts

### Related Rules
- R1: Define SLOs for latency, error rate, and cost per request before building any dashboard
- R2: Use SLO-based burn rate alerts instead of static threshold alerts

### Related Skills
- Implement server-side cost tracking with attribution
- Optimize AI token usage and model selection
- Implement OpenTelemetry tracing for AI requests
- Set up alerting and anomaly detection for AI systems

### Success Criteria
- SLOs are defined and visible on the dashboard for all AI features
- Burn-rate alerts catch degradation before user impact
- Error budget consumption is monitored weekly
- Alert fatigue is minimal (no notification noise)
- On-call team can distinguish normal variation from degradation at a glance
