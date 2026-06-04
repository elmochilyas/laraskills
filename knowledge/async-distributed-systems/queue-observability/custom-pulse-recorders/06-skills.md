# Skill: Build Custom Pulse Recorders for Queue Observability

## Purpose
Implement Pulse `Recorder` interface to capture custom queue metrics (queue depth, worker saturation, Redis memory) and display them in the Pulse dashboard.

## When To Use
Queue depth monitoring (not built-in); worker saturation ratio monitoring; custom metrics Pulse doesn't cover; teams already using Pulse and needing queue-specific cards.

## When NOT To Use
Metrics already covered by built-in Pulse recorders (slow jobs, queue wait time via Horizon); low-observability needs (simple logging sufficient); high-frequency metrics needing sub-second granularity (Pulse aggregates on 10s intervals).

## Prerequisites
- Laravel Pulse installed
- Access to the metric source (Redis, DB, Horizon metrics repository)

## Inputs
- Metric type (queue depth, worker count, failed job count)
- Sampling interval
- Dashboard display configuration

## Workflow
1. Create recorder class implementing `Laravel\Pulse\Recorders\Concerns\Recorder`
2. Implement `register()` to bind listeners or schedule callbacks
3. Implement `record(Carbon $now): void` to sample and store metrics
4. Use `$this->remember($type, $key, $value)` for metric ingestion
5. Create Livewire component and Blade view for Pulse card
6. Register recorder and card in `config/pulse.php`
7. Keep `record()` under 10ms — runs on every Pulse ingestion

## Validation Checklist
- [ ] Recorder class implements `Recorder` with `register()`, `record()`, `get()`
- [ ] `record()` under 10ms
- [ ] `remember()` stores at correct aggregation bucket
- [ ] Livewire component registered for dashboard
- [ ] Blade view renders metric card correctly
- [ ] `config/pulse.php` updated with recorder + card entries
- [ ] Metric appears in Pulse dashboard
- [ ] Sampling preferred over per-event recording for queue depth

## Common Failures
- `record()` too slow (>10ms) — Pulse dashboard latency increases
- No Livewire component — metric stored but not visible
- Wrong aggregation bucket — data displayed at wrong granularity
- Sampling too frequent — unnecessary overhead
- Not filtering out test environments — test data in production metrics

## Decision Points
- Queue depth: sample every 30s via scheduled callback
- Failed job count: sample from `failed_jobs` table every 60s
- Worker saturation: query Horizon's Redis metrics repository

## Related Rules
- Rule 1: use-simple-recorders-for-custom-metrics
- Rule 2: keep-recorder-records-lightweight
- Rule 3: register-recorder-in-config
- Rule 4: prefer-sampling-over-per-event-recording

## Related Skills
- Configure Pulse SlowJobs Recorder
- Monitor Horizon Wait Time and Set Alerts
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time

## Success Criteria
Custom Pulse recorder captures the target metric, `record()` completes under 10ms, the card renders in the dashboard, and the metric is meaningful for operations.
