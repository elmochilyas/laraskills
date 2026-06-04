# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K045 — Job Tags for Filtering and Monitoring
- **Knowledge ID:** K045
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Tags
  - Laravel Source — `Laravel\Horizon` tag indexing

---

# Overview

Horizon displays job tags in the dashboard for filtering and monitoring. Tags are short strings (typically model identifiers) returned by the job's `tags()` method. Built-in tags include the job class name and, when using `SerializesModels`, the Eloquent model's class and key (e.g., `App\Models\Order:42`). Tags enable operators to filter the dashboard by specific model, find all jobs related to a particular entity, and correlate failures across job types.

---

# Core Concepts

- **`tags()` method:** Return an array of strings from the job class. Horizon displays these in the dashboard.
- **Automatic tags:** Jobs using `SerializesModels` automatically get tags like `App\Models\Order:42`.
- **Filtering:** Horizon dashboard supports filtering by tag text.
- **Search:** Tags are indexed in Redis for search. Each tag is stored as a key in Horizon's Redis keyspace.
- **Silenced tags:** Jobs with certain tags can be silenced (hidden from dashboard).

---

# When To Use

- Entity-based correlation — tag jobs with the entity they process (order:42, user:17)
- Workflow tracking — tag jobs with batch or pipeline identifiers
- Environment/version tracking — tag jobs with deployment version for debugging
- Operational monitoring — filter dashboard by specific entity during incident response

---

# When NOT To Use

- Putting sensitive/PII data in tags — tags are visible to all Horizon dashboard users
- High-cardinality unique values that create millions of Redis keys
- Very long tags (>100 chars) — waste Redis memory and degrade dashboard UX
- Tags that should affect job routing — tags are Horizon-only metadata with no effect on execution

---

# Best Practices

- **Keep tags short and consistent.** Follow a convention like `{entity_type}:{id}` (e.g., `order:42`). *Why: Tags are stored as Redis keys — short consistent tags reduce memory usage and enable predictable filtering.*
- **Call `parent::tags()` if overriding.** Overriding `tags()` without calling parent loses automatic model tags from `SerializesModels`. *Why: Automatic tags provide entity-level correlation — losing them reduces debugging capability.*
- **Monitor Redis memory from tag growth.** High-cardinality tags (unique per entity) create many Redis keys. *Why: Tags never expire in Redis — unbounded growth consumes memory and may require pruning strategies.*
- **Never put PII in tags.** Tags are visible in the dashboard to anyone with Horizon access. *Why: Tags like `email:user@example.com` expose personal data and violate data protection requirements.*

---

# Architecture Guidelines

- Tags are purely for Horizon's dashboard — they have NO effect on job execution, routing, or behavior.
- The `tags()` method is called at dispatch time in the dispatching process (web request). Keep it fast.
- Tags are stored in Redis sorted sets: `horizon:tags:{tag_value}` with job IDs as members.
- Tag search in the dashboard is Redis-backed — fast but not real-time indexed.
- Silenced tags don't reduce Redis storage — they only hide from the dashboard view.

---

# Performance Considerations

- Each unique tag is stored as a Redis key. 100K unique tags = 100K Redis keys.
- Tags are written on job dispatch — no worker performance impact.
- At high dispatch rates, tag writes contribute to Horizon's Redis write load.
- Automatic model tags from `SerializesModels` are written on EVERY dispatch for model-typed jobs.
- Dashboard tag filtering scans Redis sorted sets — may be slow at very high tag volumes.

---

# Security Considerations

- Tags are visible to anyone with Horizon dashboard access — do not include sensitive data.
- Tags are stored in Redis without encryption — anyone with Redis access can read them.
- Automated model tags expose model IDs — this reveals entity existence (e.g., user:1 exists) to dashboard users.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| PII in tags | Putting email, name in tags | PII exposed in Horizon dashboard | Use entity IDs only, not descriptive data |
| High-cardinality tags | Unique tag per entity (order:1 to order:10M) | 10M Redis keys — memory pressure | Use lower-cardinality grouping tags |
| Overriding `tags()` without parent call | Custom `tags()` returns only custom tags | Loss of automatic model tags | Merge parent::tags() with custom tags |
| Assuming tags affect execution | Expecting tags to route or filter jobs | Tags have no effect on processing | Use queue/supervisor for routing |

---

# Anti-Patterns

- **Tagging with full model serialization:** `tags()` returning `json_encode($model->toArray())` — enormous Redis memory consumption.
- **Tagging every dispatch with a unique UUID:** No filtering value — cannot be used to group related jobs.
- **Relying on tags for security:** Tags provide no access control — they are metadata for filtering only.

---

# Examples

```php
// Custom tags for entity correlation
class ProcessOrder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public string $workflowId,
    ) {}

    public function tags(): array
    {
        return array_merge(parent::tags(), [
            'order:'.$this->order->id,
            'workflow:'.$this->workflowId,
            'region:'.$this->order->region,
        ]);
    }
}
// Tags produced: App\Models\Order:42, order:42, workflow:abc-123, region:eu-west
```

---

# Related Topics

- **K046 Silenced Jobs and Silenced Tags (K046)** — Using tags for silencing
- **K047 Horizon Metrics (K047)** — Metrics overview in Horizon

---

# AI Agent Notes

- When generating jobs, include `tags()` returning entity identifiers for dashboard filtering.
- Always merge `parent::tags()` when overriding — otherwise automatic model tags are lost.
- Tag cardinality affects Redis memory — use grouping tags (e.g., `region:eu`) over per-entity tags when entity count is very large.

---

# Verification

- [ ] Custom tags appear in Horizon dashboard — verify tag filter works
- [ ] Automatic model tags present — verify `App\Models\Order:42` style tags appear
- [ ] `parent::tags()` called in override — verify no loss of automatic tags
- [ ] No PII in tags — audit all tag values for sensitive data
- [ ] Tag search returns expected results — verify dashboard tag filter finds related jobs
