# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 07-observability
**Knowledge Unit:** horizon-monitoring
**Generated:** 2026-06-03

---

# Decision Inventory

1. Queue Isolation Strategy (Shared vs Per-Service)
2. Worker Balancing Strategy (Auto vs Simple vs False)
3. Alerting and Notification Strategy

---

# Architecture-Level Decision Trees

---

## Queue Isolation Strategy

---

## Decision Context

Choosing how to organize integration jobs across Redis queues for monitoring and isolation.

---

## Decision Criteria

* throughput per service
* failure isolation
* monitoring granularity
* operational complexity

---

## Decision Tree

Are there multiple external services with different throughput profiles?
↓
YES → Dedicated queue per service (e.g., `stripe`, `mailgun`, `github`)
  ↓
  Criticality varies across services?
  ↓
  YES → Priority sub-queues: `stripe-high`, `stripe-normal`, `stripe-low`
  NO → Single queue per service with equal priority
  ↓
  Queue naming convention:
  Service + Priority: `{service}-{priority}` (e.g., `github-high`)
NO → Single `integrations` queue shared across all services
  ↓
  Does the application also process non-API jobs?
  ↓
  YES → Separate `integrations` queue from application default queue
  NO → Run all background jobs on default queue, use tags for filtering
  ↓
  Need to isolate webhook processing from API calls?
  ↓
  YES → Separate `webhooks` and `api` queues within integrations
  NO → Single integrations queue handles both webhook and API jobs

---

## Rationale

Per-service queues provide granular failure isolation — a stuck Stripe queue doesn't block GitHub processing. Priority sub-queues ensure critical operations process before batch work. Separate webhooks queue prevents webhook congestion from blocking API calls.

---

## Recommended Default

**Default:** Per-service queues (`stripe`, `mailgun`, `github`) with `webhooks` and `api` sub-queues for high-traffic services
**Reason:** Isolates failures, enables per-service monitoring, prevents one service from starving others

---

## Risks Of Wrong Choice

Shared queue allows one failing service to block all integrations. Too many queues increase operational complexity. No webhook isolation means API calls compete with webhook processing.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (queue driver selection)
* 03-webhooks: queue-async-processing (job dispatching patterns)

---

---

## Worker Balancing Strategy

---

## Decision Context

Selecting how Horizon distributes workers across integration queues.

---

## Decision Criteria

* traffic variability
* queue priority
* resource utilization
* response time requirements

---

## Decision Tree

Is webhook traffic unpredictable (spiky)?
↓
YES → Use `auto` balancing — workers dynamically move to busy queues
  ↓
  Are there high-priority queues that must always have workers?
  ↓
  YES → Configure `minProcesses` per queue to guarantee baseline capacity
  NO → Let auto-balancing distribute workers purely by queue backlog
  ↓
  Risk of queue starvation during traffic spikes?
  ↓
  YES → Set `balance: auto` with `maxProcesses` cap per supervisor
  NO → Default auto-balancing with no per-queue limits
NO → Is traffic predictable and steady?
  ↓
  YES → Use `simple` balancing — workers evenly distributed
    ↓
    All queues equal priority?
    ↓
    YES → Simple balancing with equal worker distribution
    NO → Simple balancing with weighted worker allocation
  NO → Use `false` (no balancing) with fixed worker allocation per queue
    ↓
    Worker-to-queue ratio known from capacity planning?
    ↓
    YES → Fixed allocation — 4 workers to webhooks, 2 to integrations
    NO → Start with auto, monitor, adjust to fixed when patterns emerge

---

## Rationale

Auto balancing handles variable webhook traffic by dynamically moving workers to busy queues. Simple balancing is efficient for predictable traffic. No balancing gives full control but requires precise capacity planning.

---

## Recommended Default

**Default:** `auto` balancing with `minProcesses: 2` on high-priority queues
**Reason:** Adapts to traffic spikes while guaranteeing baseline throughput for critical queues

---

## Risks Of Wrong Choice

No balancing causes worker starvation on busy queues. Auto balancing with no `minProcesses` can drain workers from critical queues during traffic spikes. Fixed balancing wastes workers on idle queues during low traffic.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Horizon configuration)
* 07-observability: integration-metrics (queue backpressure monitoring)

---

---

## Alerting and Notification Strategy

---

## Decision Context

Configuring Horizon notifications for integration queue health monitoring.

---

## Decision Criteria

* failure tolerance
* recovery time objective
* team responsiveness
* noise reduction

---

## Decision Tree

Should alerts fire on individual job failures?
↓
YES → Configure per-queue failure rate threshold (e.g., >5% in 5 minutes)
  ↓
  Need different thresholds per queue?
  ↓
  YES → Lower threshold for payment queues (2%), higher for batch (10%)
  NO → Single threshold across all integration queues (5%)
NO → Wait for cumulative failure count or wait time degradation
  ↓
  Alert on queue wait time as leading indicator?
  ↓
  YES → Alert when wait time exceeds 2x baseline P99
  ↓
  Baseline established from first 2 weeks of operation?
  ↓
  YES → Dynamic threshold based on moving average of wait times
  NO → Fixed threshold (e.g., 60 seconds) adjusted periodically
  NO → Alert only on job failure (lagging indicator only)
↓
  Notification channel strategy?
  ↓
  Critical queues → Pager duty / SMS on failure rate >10% for 5+ minutes
  Standard queues → Slack notification on failure rate >10%
  Batch/low → Log only, no immediate notification
↓
  Escalation policy?
  ↓
  5 min unresolved → Notify primary on-call
  15 min unresolved → Notify secondary / team channel
  30 min unresolved → Auto-scale workers or page engineering manager

---

## Rationale

Per-queue thresholds prevent critical queues from being drowned out by noisy batch queues. Wait time alerts catch backpressure before failures occur. Multi-tier escalation ensures appropriate response without alert fatigue.

---

## Recommended Default

**Default:** Failure rate >5% in 5min on any integration queue → Slack notification; >10% → Pager duty
**Reason:** Catches degradation early without excessive noise; escalates appropriately for critical issues

---

## Risks Of Wrong Choice

No alerts mean silent failures until user reports. Too-sensitive alerts cause notification fatigue and ignored warnings. Single threshold for all queues misses critical payment queue degradation while paging on batch queue blips.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Horizon notification channels)
* 07-observability: integration-metrics (correlating job metrics with API metrics)
