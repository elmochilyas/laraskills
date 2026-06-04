# ECC Anti-Patterns — Queue Worker Lifecycle

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Queue Worker Lifecycle |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Unbounded Queue Workers
2. Job Constructor Injection of Request-Scoped Services
3. Singleton-as-Cache in Job Classes
4. Over-Reliance on Horizon Defaults
5. Storing State on `$this` in Job

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — queue workers are about job processing, not direct queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Unbounded Queue Workers

### Category
Reliability

### Description
Running `queue:work` without `--max-jobs` or `--max-time`.

### Why It Happens
Developers don't know about the flags or assume memory leaks won't happen.

### Warning Signs
- `queue:work` with no limits
- OOM crashes in long-running workers
- Worker memory grows over time

### Why It Is Harmful
Queue workers persist the same container across thousands of jobs. Static accumulation and singleton leaks cause unbounded memory growth. Worker eventually OOM crashes, losing the current job.

### Preferred Alternative
Always set `--max-jobs=500` and `--max-time=3600`.

### Detection Checklist
- [ ] `queue:work` without `--max-jobs`
- [ ] Worker memory growth trend
- [ ] OOM crashes

### Related Rules
Queue Worker (05-rules.md): N/A

### Related Skills
Queue Worker (06-skills.md): N/A

### Related Decision Trees
Queue Worker (07-decision-trees.md): D01 — Worker Configuration.

---

## Anti-Pattern 2: Job Constructor Injection of Request-Scoped Services

### Category
Reliability

### Description
Injecting `Request`, `Auth`, or session in job constructor.

### Preferred Alternative
Fetch request-scoped dependencies in `handle()` method.

### Detection Checklist
- [ ] Request/Auth/session in job constructor
- [ ] Not available in queue context

### Related Rules
Queue Worker (05-rules.md): N/A

### Related Skills
Queue Worker (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Singleton-as-Cache in Job Classes

### Category
Reliability

### Description
Using singleton properties to cache data across jobs — leaks between unrelated jobs.

### Preferred Alternative
Use job instance properties or injected services via `handle()`.

### Detection Checklist
- [ ] Singleton used as job cache
- [ ] Data leaks between job types

### Related Rules
Queue Worker (05-rules.md): N/A

### Related Skills
Queue Worker (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Over-Reliance on Horizon Defaults

### Category
Performance

### Description
Using Horizon's default `maxJobs` without profiling application memory needs.

### Preferred Alternative
Profile memory and set `maxJobs` based on application leak profile.

### Detection Checklist
- [ ] Default Horizon config
- [ ] No memory profiling

### Related Rules
Queue Worker (05-rules.md): N/A

### Related Skills
Queue Worker (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Storing State on `$this` in Job

### Category
Reliability

### Description
Storing computed values on `$this->property` between retries — state leaks across attempts.

### Preferred Alternative
Use fresh state per `handle()` call.

### Detection Checklist
- [ ] Job properties set during `handle()`
- [ ] State persists across retries

### Related Rules
Queue Worker (05-rules.md): N/A

### Related Skills
Queue Worker (06-skills.md): N/A

### Related Decision Trees
N/A
