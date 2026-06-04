---
id: ku-05
title: "Alerting & Anomaly Detection - Rules"
subdomain: "observability-monitoring"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Alerting & Anomaly Detection

### R1: Set alerts on p95 latency and error rate, not just average — averages hide problems
- **Category:** Observability
- **Rule:** Configure alerts on p95 latency (not average) and error rate percentage (p95 > 5s, error rate > 5%); never alert only on average metrics.
- **Reason:** Average latency can appear healthy while 5% of requests take 30+ seconds (the "death by a thousand cuts" problem). p95 captures the user-facing worst-case experience that averages smooth over.
- **Bad Example:** An alert on average latency > 3s never fires because the average is 1.2s — but p95 is 12s and 5% of users are having a terrible experience.
- **Good Example:** Grafana alerts: "LLM p95 latency > 5s for 5 minutes" → P2; "LLM error rate > 5% for 2 minutes" → P1.
- **Exceptions:** Low-traffic services where percentile calculations are noisy.
- **Consequences of Violation:** Degraded user experience for a minority of requests goes undetected; team doesn't investigate until customer complaints escalate.

### R2: Implement model-specific alert thresholds — different models have different baselines
- **Category:** Observability
- **Rule:** Configure separate latency, error rate, and token usage alerts for each model/agent combination; never use a single threshold for all models.
- **Reason:** An open-source local model has inherently different latency and error characteristics than a cloud model. A single threshold either generates false alarms for slow models or misses regressions for fast models.
- **Bad Example:** A unified alert "p95 latency > 5s" — Llama 3.1 70B on CPU is consistently 8-12s, so the alert fires constantly, training the team to ignore it.
- **Good Example:** Alert thresholds per deployment: `gpt-4o: p95 > 3s`, `ollama-llama3: p95 > 12s`, `claude-opus: p95 > 5s`.
- **Exceptions:** Homogeneous deployments using a single provider/model.
- **Consequences of Violation:** Alert fatigue from constantly-firing "slow model" alerts for inherently slow deployments; missed real regressions in fast models because alerts are too loose.

### R3: Detect anomalous cost spikes using week-over-week comparison, not absolute thresholds
- **Category:** Cost Management
- **Rule:** Implement cost anomaly detection that compares daily spend to the same day of the previous week (e.g., Monday vs last Monday); trigger alerts when spend exceeds 200% of the baseline; never rely on fixed monthly budgets alone.
- **Meaning:** Fixed monthly budgets only detect when the budget is exhausted (too late). Week-over-week comparison detects cost acceleration trends early, often caused by a bug (runaway retry loops), traffic surge, or misuse.
- **Bad Example:** A monthly budget of $10,000 — on day 18, the team discovers $9,800 has been spent. The cost anomaly started on day 10 but went undetected.
- **Good Example:** Daily check: "Monday spend: $420 (baseline: $220). That's 191% of baseline. Alert: P3 Cost Anomaly."
- **Exceptions:** Seasonal or promotional periods where cost is expected to fluctuate.
- **Consequences of Violation:** Cost anomalies detected too late to respond; budget exhausting in the first two weeks of the month without detection.
