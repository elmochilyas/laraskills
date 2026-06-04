# ECC Anti-Patterns — Octane Configuration and Workers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Octane Configuration and Workers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Over-Provisioning Workers
2. Single max_requests for All Routes
3. Ignoring RoadRunner `.rr.yaml`
4. No Graceful Shutdown Timeout
5. Disabling max_requests Entirely

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — configuration affects worker lifecycle, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Over-Provisioning Workers

### Category
Performance

### Description
Setting `worker_count` higher than CPU cores for CPU-bound applications.

### Why It Happens
Developers think more workers = more throughput, regardless of workload type.

### Warning Signs
- `worker_count` = 100 on 4-core machine
- Context-switching overhead visible in profiling
- Throughput drops with more workers

### Why It Is Harmful
CPU-bound workloads cannot benefit from more workers than CPU cores. Over-subscription causes context-switch thrashing — each request takes 10x longer, queue backs up, system collapses.

### Preferred Alternative
Set `worker_count` to CPU core count for CPU-bound. For I/O-bound with Swoole, rely on coroutines.

### Detection Checklist
- [ ] Worker count > CPU cores for CPU-bound app
- [ ] Throughput decreases with more workers
- [ ] High context-switch rates

### Related Rules
Octane Config (05-rules.md): N/A

### Related Skills
Octane Config (06-skills.md): N/A

### Related Decision Trees
Octane Config (07-decision-trees.md): D01 — Worker Count Tuning.

---

## Anti-Pattern 2: Single max_requests for All Routes

### Category
Performance

### Description
Using the same `max_requests` for memory-intensive routes (reports, exports) and lightweight routes.

### Preferred Alternative
Consider separate Octane instances with different `max_requests` for different route profiles.

### Detection Checklist
- [ ] All routes share same max_requests
- [ ] Memory-intensive routes cause early churn

### Related Rules
Octane Config (05-rules.md): N/A

### Related Skills
Octane Config (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Ignoring RoadRunner `.rr.yaml`

### Category
Reliability

### Description
Not configuring RoadRunner's `.rr.yaml` while assuming `octane.php` covers everything.

### Preferred Alternative
Configure both `octane.php` and `.rr.yaml` for RoadRunner deployments.

### Detection Checklist
- [ ] RoadRunner deployed without `.rr.yaml`
- [ ] Default configs may not suit workload

### Related Rules
Octane Config (05-rules.md): N/A

### Related Skills
Octane Config (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: No Graceful Shutdown Timeout

### Category
Reliability

### Description
Setting `max_wait_time` too short — workers killed mid-request, losing work.

### Preferred Alternative
Set `max_wait_time` based on longest expected request duration.

### Detection Checklist
- [ ] Short `max_wait_time`
- [ ] Mid-request worker kills

### Related Rules
Octane Config (05-rules.md): N/A

### Related Skills
Octane Config (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Disabling max_requests Entirely

### Category
Reliability

### Description
Setting `max_requests` to 0 or null — no safety valve for memory leaks.

### Preferred Alternative
Always set `max_requests` based on leak profile.

### Detection Checklist
- [ ] `max_requests=0`
- [ ] No worker recycling

### Related Rules
Octane Config (05-rules.md): N/A

### Related Skills
Octane Config (06-skills.md): N/A

### Related Decision Trees
N/A
