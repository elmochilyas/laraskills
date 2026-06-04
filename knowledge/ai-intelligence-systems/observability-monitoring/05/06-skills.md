# Skills

## Skill 1: Implement model-specific alerting thresholds for AI system monitoring

### Purpose
Configure separate latency, error rate, and token usage alerts for each model/agent combination with appropriate thresholds, using p95 latency and error rate percentages to detect user-facing degradation while avoiding alert fatigue from fixed-threshold noise.

### When To Use
- Use when monitoring multiple AI models with different latency/error baselines
- Use when you need to detect user-facing degradation (p95 latency) vs. average smoothness
- Use when configuring on-call alerting for AI system operations
- Use when building production dashboards for AI reliability

### When NOT To Use
- Do NOT use a single alert threshold for all models — different models have different baselines
- Do NOT use average latency for alerts — averages hide p95 problems
- Do NOT use static threshold alerts without understanding burn-rate concepts
- Do NOT use for low-traffic services where percentile calculations are noisy

### Prerequisites
- Latency and error rate metrics collected per model/agent combination
- At least 1-2 weeks of baseline metric data per model
- Monitoring platform (Grafana, Datadog, CloudWatch)
- Understanding of p50/p95/p99 latency percentiles
- Team agreement on acceptable thresholds per model type

### Inputs
- Historical p95 latency data per model (gpt-4o, gpt-4o-mini, claude-sonnet, ollama-llama3)
- Historical error rate data per model
- Model-specific latency baselines (fast vs. slow models)
- Business requirements for response time acceptability

### Workflow
1. Collect baseline metrics per model/agent for minimum 2 weeks
2. Determine model-specific thresholds:
   - `gpt-4o`: p95 < 3s, error rate < 1%
   - `gpt-4o-mini`: p95 < 2s, error rate < 1%
   - `ollama-llama3`: p95 < 12s, error rate < 3%
   - `claude-opus`: p95 < 5s, error rate < 2%
3. Configure alerts on p95 latency (not average):
   - "LLM p95 latency > 5s for 5 minutes" → P2
   - "LLM error rate > 5% for 2 minutes" → P1
4. Set up separate alert rules per model or agent
5. Configure token usage alerts per model:
   - "gpt-4o token consumption > 2x daily average" → P3
   - "Monthly token spend > 80% of budget" → P2
6. Use burn-rate alerting for error budget consumption:
   - 2x burn rate over 1 hour → P2
   - 3x burn rate over 30 minutes → P1
7. Build dashboards showing model-specific metrics with SLO target lines
8. Review and tune thresholds quarterly

### Validation Checklist
- [ ] Separate alert thresholds are configured for each model/agent combination
- [ ] Alerts use p95 latency, not average
- [ ] Error rate alerts use percentage over sliding window
- [ ] Burn-rate alerts are configured, not static threshold only
- [ ] Token usage alerts catch unusual consumption patterns
- [ ] Budget alerts fire before hard limits are reached
- [ ] Dashboard shows alerts by model and severity
- [ ] Alert thresholds are reviewed quarterly
- [ ] No alert fatigue from mismatched thresholds
- [ ] On-call team can distinguish urgent alerts from informational

### Common Failures
- **Single threshold for all models**: Fast models generate false alarms or slow models hide degradation
- **Average latency hiding problems**: Average looks fine (1.2s) but p95 is 12s — 5% of users suffer
- **Static threshold noise**: Traffic bursts trigger alerts — use burn-rate for sustained degradation
- **No token alerts**: Unusual consumption goes undetected until invoice
- **Threshold staleness**: Thresholds set once, never reviewed — model performance changes over time

### Decision Points
- **Alert severity**: P1 (user-blocking), P2 (degraded), P3 (informational) — P1 only for complete failures
- **Alert window**: Shorter windows (2 minutes) catch issues fast, longer (10 minutes) reduce noise
- **Burn rate multiplier**: 2x (warning) vs. 3x (critical) — depends on error budget size
- **Day vs. night alerting**: Route non-critical alerts to email/slack during off-hours

### Performance Considerations
- Metric queries for alert evaluation should use pre-aggregated data
- Alert evaluation should be cached and not query raw event data
- p95 calculation requires sufficient data points — minimum 100 requests per window
- Token usage alerts should aggregate on pre-computed hourly summaries
- Alert rule evaluation adds minimal overhead to monitoring system

### Security Considerations
- Alert details may reveal internal system architecture — sanitize in external notifications
- Error messages in alerts may contain sensitive data — truncate or filter
- Token usage alerts may reveal business-sensitive consumption patterns
- On-call escalation should have access control to avoid unauthorized metric access
- Alert notification channels (Slack, PagerDuty) should be secured

### Related Rules
- R1: Set alerts on p95 latency and error rate, not just average — averages hide problems
- R2: Implement model-specific alert thresholds — different models have different baselines

### Related Skills
- Define SLOs and implement burn-rate alerting for AI reliability
- Implement token usage analytics with cost projection
- Implement server-side cost tracking with attribution
- Implement OpenTelemetry tracing for AI requests

### Success Criteria
- Each model has appropriate alert thresholds based on its baseline performance
- p95 latency alerts catch user-facing degradation within 2 minutes
- Error rate alerts fire before 5% of users are affected
- No alert fatigue from models with different performance characteristics
- Token usage alerts prevent budget surprises
- Thresholds are reviewed and tuned quarterly
