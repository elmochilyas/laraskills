---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K045 — Job Tags for Filtering and Monitoring
Knowledge ID: K045
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | PII in Tags | Security | Critical |
| 2 | High-Cardinality Tags — Unbounded Redis Memory | Performance | High |
| 3 | Overriding `tags()` Without `parent::tags()` | Implementation | Medium |
| 4 | Tagging Full Model Serialization | Performance | High |
| 5 | Assuming Tags Affect Job Execution | Architecture | Low |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| PII Exposure in Dashboard | Critical — data breach risk | Never put PII in tags; use entity IDs only |
| Unbounded Tag Growth | High — Redis memory exhaustion | Use grouping tags, monitor cardinality |
| Lost Automatic Tags | Medium — reduced debugging capability | Always merge `parent::tags()` |

---

## 1. PII in Tags

### Category
Security

### Description
Including personally identifiable information (email addresses, names, phone numbers) in job tags. Tags are visible to anyone with Horizon dashboard access and stored unencrypted in Redis — PII in tags creates a data exposure risk.

### Why It Happens
- Convenience: email is a natural identifier for debugging
- Not considering tags as publicly visible data
- Not aware of data protection requirements (GDPR, CCPA, HIPAA)
- Using `$user->email` in tags without considering the implications
- "Only internal team sees the dashboard" — false sense of security

### Warning Signs
- Tags like `email:john@example.com` or `customer:john.doe` in Horizon dashboard
- Tag values that can identify a natural person
- No data protection review for tag values
- Tags used for direct personal identification ("find all jobs for John")
- Horizon dashboard screenshots shared internally showing PII in tags

### Why Harmful
An operator with read-only Horizon access searches for a user's email — the dashboard displays the tag `email:john@example.com`. This PII exposure violates data protection requirements (GDPR Art. 32: "appropriate technical measures to protect personal data"). Tags are also stored in Redis without encryption — anyone with Redis access can read all tags. A Redis compromise leaks all PII embedded in tags across all past and present jobs.

### Consequences
- Data breach: PII exposed in Horizon dashboard
- GDPR/HIPAA/CCPA compliance violation
- Regulatory fines for inadequate data protection
- Reputational damage if dashboard is compromised
- Redis compromise leaks all PII in tags
- Legal liability from exposed personal data

### Alternative
- Use entity IDs only:
  ```php
  // Good
  public function tags(): array
  {
      return ['user:' . $this->user->id]; // Entity ID only
  }
  
  // BAD — PII exposure
  public function tags(): array
  {
      return ['email:' . $this->user->email]; // Personal data
  }
  ```
- Never reference personal data in tags
- If human-readable identification is needed, use opaque entity references

### Refactoring Strategy
1. Audit all job classes for PII in tags
2. Replace PII with entity IDs (e.g., `email:...` → `user:42`)
3. Remove any tag that contains personal data
4. Add code review rule: no PII in tags
5. Monitor Horizon dashboard for any remaining PII
6. Document data protection requirements for tags

### Detection Checklist
- [ ] No PII (email, name, phone) in any job tag
- [ ] Tags use entity IDs only
- [ ] Code review checks for PII in tags
- [ ] Data protection requirements documented for tags
- [ ] Redis access does not expose personal data through tags

### Related Rules
- never-put-pii-in-tags

### Related Skills
- Tag Jobs for Horizon Dashboard Filtering

### Related Decision Trees
- Job Tagging Strategy for Horizon Filtering

---

## 2. High-Cardinality Tags — Unbounded Redis Memory

### Category
Performance

### Description
Creating a unique tag value for every entity instance (e.g., `order:1`, `order:2`, ..., `order:10M`). Each unique tag is stored as a Redis key — with millions of entities, Redis memory grows unboundedly and nowhere is there a cleanup mechanism.

### Why It Happens
- Per-entity tagging seems natural: "tag each job with its order ID"
- Not realizing tags are stored as Redis keys
- Not knowing tags never expire in Redis
- No monitoring of Redis memory from tag growth
- Application has many entities but tag cardinality wasn't considered

### Warning Signs
- Redis `INFO` shows millions of keys matching `horizon:tags:*`
- Redis memory usage grows continuously over time
- No Redis key expiry for tag keys
- Dashboard tag search is slow or times out
- Redis memory alert fires for Horizon tags

### Why Harmful
Over 6 months, 10 million unique order tags accumulate in Redis — each tag is a Redis key. Redis memory grows to 500MB+ just for tags, and dashboard tag search queries slow to a crawl. Tags never expire — once written, they persist forever. If the application processes 10,000 orders per day, that's 3.65 million new tags per year, growing Redis memory by 200MB+ annually. This is entirely wasted storage — old tags for long-completed jobs are never needed for filtering.

### Consequences
- Redis memory grows without bound
- Redis reaches memory limit → eviction or OOM
- Dashboard tag search becomes unusably slow
- Redis memory cost increases linearly with business growth
- No way to "prune" old tags without custom Redis scripting
- Team eventually hits Redis memory limit and must migrate or scale up

### Alternative
- Use grouping tags with lower cardinality:
  ```php
  // Instead of: 'order:' . $this->order->id  (10M unique values)
  // Use:
  public function tags(): array
  {
      return [
          'order:' . $this->order->id,          // Keep for debugging — manage cardinality
          'region:' . $this->order->region,      // 10-20 unique values
          'date:' . $this->order->created_at->format('Y-m-d'), // 365 per year
      ];
  }
  ```
- Use per-entity tags only when entity count is manageable (< 100K)
- Implement tag pruning for old entities (custom Redis cleanup)

### Refactoring Strategy
1. Measure current tag cardinality and Redis memory usage
2. Audit which tags are actually used for filtering
3. Replace per-entity tags with grouping tags where possible
4. If per-entity tags are needed, implement tag pruning (TTL or cleanup job)
5. Set Redis memory alert for tag keyspace growth
6. Monitor Redis memory after changes

### Detection Checklist
- [ ] Tag cardinality is monitored and bounded
- [ ] No unbounded per-entity tags without pruning
- [ ] Grouping tags used for high-cardinality entities
- [ ] Redis memory usage from tags is stable
- [ ] Tag pruning implemented if per-entity tags are required
- [ ] Redis memory alert configured for tag growth

### Related Rules
- monitor-tag-cardinality-redis

### Related Skills
- Tag Jobs for Horizon Dashboard Filtering

### Related Decision Trees
- Job Tagging Strategy for Horizon Filtering

---

## 3. Overriding `tags()` Without `parent::tags()`

### Category
Implementation

### Description
Implementing a custom `tags()` method on a job class without calling `parent::tags()`. This silently drops the automatic model tags provided by Horizon's `SerializesModels` trait, such as `App\Models\Order:42`.

### Why It Happens
- Not knowing Horizon provides automatic tags
- Not reading the documentation about `parent::tags()`
- Assuming the custom tags are sufficient
- Not noticing that automatic tags are missing
- Copying a custom `tags()` implementation that doesn't call parent

### Warning Signs
- Custom tags appear in dashboard but `App\Models\Order:42` tags are missing
- Cannot find a job by searching for `App\Models\Order:42`
- Horizon dashboard shows no model-based tags for jobs with `SerializesModels`
- All tags are custom — no automatic tags visible
- Code review missed the missing `parent::tags()` call

### Why Harmful
The `App\Models\Order:42` automatic tag is lost — operators can't find this job by searching for `App\Models\Order:42`, breaking entity-level correlation across all job types. If five different job types process the same order, operators can't search for the order model ID and see all related jobs. This loss of automatic tagging reduces debugging capability — finding "all jobs related to Order 42" requires checking each job type individually.

### Consequences
- Lost entity-level correlation across job types
- Cannot search for all jobs related to a specific model
- Reduced debugging capability during incident response
- Inconsistent tagging across the codebase (some jobs have model tags, some don't)
- Time wasted manually finding related jobs

### Alternative
- Always merge `parent::tags()` with custom tags:
  ```php
  public function tags(): array
  {
      return array_merge(parent::tags(), [
          'order:' . $this->order->id,
          'workflow:' . $this->workflowId,
      ]);
  }
  ```

### Refactoring Strategy
1. Audit all job classes with custom `tags()` methods
2. Add `return array_merge(parent::tags(), [...]))` to each
3. Verify automatic model tags appear in dashboard
4. Confirm search by model ID finds all related job types
5. Add code review check: custom `tags()` must call `parent::tags()`

### Detection Checklist
- [ ] All job classes with custom `tags()` call `parent::tags()`
- [ ] Automatic model tags visible in Horizon dashboard
- [ ] Can search by model ID and find related jobs across types
- [ ] No job classes silently dropping automatic tags
- [ ] Code review enforces `parent::tags()` usage

### Related Rules
- call-parent-tags-in-override

### Related Skills
- Tag Jobs for Horizon Dashboard Filtering

### Related Decision Trees
- Job Tagging Strategy for Horizon Filtering

---

## 4. Tagging Full Model Serialization

### Category
Performance

### Description
Returning the full serialized model or large data structures from `tags()`. For example, `json_encode($model->toArray())` or tagging with the entire model object. This generates enormous tag strings that consume Redis memory and clutter the dashboard.

### Why It Happens
- Misunderstanding the purpose of tags (thinking they should store job data)
- Wanting all job data visible in the dashboard without clicking through
- Not knowing that tags are indexed Redis keys
- Using `serialize()` or `toJson()` directly on the model
- Copying a misguided implementation from a codebase

### Warning Signs
- Tag values are large strings (1000+ characters)
- Tags contain full model data (all attributes, relationships)
- Redis memory grows rapidly (tag keys are megabytes each)
- Horizon dashboard shows truncated tag values
- Tag filter input has enormous data strings in suggestion dropdown

### Why Harmful
A tag like `json_encode($model->toArray())` for an order model with 50 fields produces a 2KB string. With 10,000 orders per day, that's 20MB of tag data per day added to Redis — for tags alone. Each tag value is stored as a Redis key member. The dashboard tag filter dropdown becomes unusable, and Redis memory balloons. Tags are for filtering, not data storage — the full payload is already available by clicking the job in the dashboard.

### Consequences
- Excessive Redis memory consumption from large tag values
- Slow dashboard tag search (scanning large keys)
- Dashboard UI degraded by large tag data in dropdowns
- Redis memory may fill up from oversized tags
- No benefit: the job payload is already visible in the dashboard

### Alternative
- Keep tags short (< 100 characters) — just identifiers:
  ```php
  // Good — short identifiers
  public function tags(): array
  {
      return [
          'order:' . $this->order->id,
          'user:' . $this->user->id,
          'region:' . $this->order->region,
      ];
  }
  
  // BAD — full model data
  public function tags(): array
  {
      return ['data:' . json_encode($this->order->toArray())];
  }
  ```
- Job payload is accessible via the Horizon dashboard job detail view

### Refactoring Strategy
1. Audit all job classes for oversized tag values
2. Replace full model serialization with short entity IDs
3. Remove any tag larger than 100 characters
4. Check Redis memory savings after changes
5. Add code review rule: tag values must be < 100 characters

### Detection Checklist
- [ ] All tag values are < 100 characters
- [ ] No full model serialization in tags
- [ ] Tags are short identifiers, not data payloads
- [ ] Redis memory from tags is reasonable
- [ ] Code review enforces tag size limit

### Related Rules
- keep-tags-concise-consistent, never-put-pii-in-tags

### Related Skills
- Tag Jobs for Horizon Dashboard Filtering

### Related Decision Trees
- Job Tagging Strategy for Horizon Filtering

---

## 5. Assuming Tags Affect Job Execution

### Category
Architecture

### Description
Believing that Horizon job tags influence routing, prioritizing, or processing behavior. Tags are purely metadata for the Horizon dashboard — they have no effect on job execution, queue selection, worker allocation, or any other runtime behavior.

### Why It Happens
- "Tag" name suggests metadata that could affect behavior
- Not reading that tags are "for filtering and monitoring" in the documentation
- Confusing tags with queue names or priorities
- Expecting tags to route jobs to specific supervisors
- No clear documentation in the codebase about tags being cosmetic only

### Warning Signs
- Code comments suggest tags affect job routing
- Attempts to use tags for priority queue assignment
- Confusion during code review: "does this tag affect processing?"
- Questions in team chat: "how do I route by tag?"
- Supervisor config references tags (tags are not supervisor-level concepts)

### Why Harmful
A developer spends hours trying to configure tag-based routing, only to discover tags have no effect. Or worse, they implement a custom routing system on top of tags (reading tags in middleware, dispatching to different queues) that duplicates Horizon's built-in queue routing. Time is wasted, and the resulting custom system is fragile and non-standard.

### Consequences
- Wasted development time on tag-based routing
- Custom routing logic that duplicates built-in queue routing
- Confusion about how Horizon works
- Inefficient architecture: custom code where standard queue handling would work
- Onboarding friction: new developers learn incorrect assumptions about tags

### Alternative
- Use queues for routing, tags for filtering:
  - Route jobs: specify `->onQueue('webhooks')` when dispatching
  - Filter jobs: use tags for dashboard searching
- Tags are cosmetic — their only purpose is UI filtering in the Horizon dashboard
- If routing by tag attribute is needed, use queue selection based on job data

### Refactoring Strategy
1. Identify any tag-based routing logic in the codebase
2. Replace with proper queue assignment (`->onQueue()`)
3. Remove custom tag-based routing middleware
4. Document in project conventions: "tags are for dashboard filtering only"
5. Educate the team on proper routing via queues and supervisors

### Detection Checklist
- [ ] Team understands tags are dashboard-only metadata
- [ ] No custom routing logic based on tags
- [ ] Queue assignment uses `->onQueue()`, not tags
- [ ] Documentation clarifies tags have no execution effect
- [ ] No ongoing confusion about tags vs routing

### Related Rules
- call-parent-tags-in-override

### Related Skills
- Tag Jobs for Horizon Dashboard Filtering

### Related Decision Trees
- Job Tagging Strategy for Horizon Filtering
