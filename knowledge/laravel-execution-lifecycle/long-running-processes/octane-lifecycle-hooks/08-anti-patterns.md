# ECC Anti-Patterns — Octane Lifecycle Hooks

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Octane Lifecycle Hooks |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Tick as Cron Replacement
2. Listener That Re-Requests
3. Tick Mutating Shared State Without Coordination
4. Ignoring Runtime-Specific Behavior
5. Heavy Listeners in RequestTerminated

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — lifecycle hooks manage state, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Tick as Cron Replacement

### Category
Architecture

### Description
Using `Octane::tick()` for heavy periodic tasks (report generation, data exports).

### Why It Happens
Ticks seem like a convenient way to run background work.

### Warning Signs
- Tick handler generates reports or exports
- Tick handler makes HTTP calls or processes large datasets
- Worker blocked during tick execution

### Why It Is Harmful
Ticks run synchronously in the worker between requests. A long tick blocks the worker from accepting new requests. For heavy background work, queued jobs are the correct mechanism — they run on separate workers.

### Preferred Alternative
Use queued jobs for heavy periodic work. Use ticks only for lightweight maintenance (health metrics, connection pruning).

### Detection Checklist
- [ ] Heavy I/O in tick callbacks
- [ ] Workers blocked during tick execution
- [ ] Request latency correlated with tick intervals

### Related Rules
Octane Hooks (05-rules.md): N/A

### Related Skills
Octane Hooks (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Listener That Re-Requests

### Category
Reliability

### Description
A `RequestTerminated` listener that sends HTTP requests — risks infinite loops.

### Preferred Alternative
Use async logging or queues for post-request side effects.

### Detection Checklist
- [ ] HTTP calls in `RequestTerminated` listener
- [ ] Risk of monitored request recursion

### Related Rules
Octane Hooks (05-rules.md): N/A

### Related Skills
Octane Hooks (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Tick Mutating Shared State Without Coordination

### Category
Reliability

### Description
Multiple ticks writing to the same static array — race conditions and data corruption.

### Preferred Alternative
Use thread-safe data structures or coordinate access.

### Detection Checklist
- [ ] Multiple ticks writing to same array
- [ ] Race conditions between ticks

### Related Rules
Octane Hooks (05-rules.md): N/A

### Related Skills
Octane Hooks (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Ignoring Runtime-Specific Behavior

### Category
Reliability

### Description
Assuming Swoole hooks work identically in RoadRunner or FrankenPHP.

### Preferred Alternative
Test hooks with each runtime.

### Detection Checklist
- [ ] Runtime-specific behavior not tested
- [ ] Hooks behave differently per runtime

### Related Rules
Octane Hooks (05-rules.md): N/A

### Related Skills
Octane Hooks (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Heavy Listeners in RequestTerminated

### Category
Performance

### Description
Heavy listeners delay next request's sandbox creation.

### Preferred Alternative
Keep `RequestTerminated` listeners fast and focused.

### Detection Checklist
- [ ] Heavy I/O in `RequestTerminated`
- [ ] Next request delayed by cleanup

### Related Rules
Octane Hooks (05-rules.md): N/A

### Related Skills
Octane Hooks (06-skills.md): N/A

### Related Decision Trees
N/A
