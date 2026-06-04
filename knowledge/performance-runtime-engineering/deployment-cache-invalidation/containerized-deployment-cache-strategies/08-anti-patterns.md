# Anti-Patterns: Standardized Knowledge: Containerized Deployment Cache Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Standardized Knowledge: Containerized Deployment Cache Strategies |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | No Post-Deployment Cache Reset | Operations | Critical |
| 2 | OpCache validate_timestamps = 1 in Production | Configuration | High |
| 3 | Cold-Start Cache Building on First Request | Operations | High |
| 4 | Invalidating Too Much Cache on Every Deploy | Operations | Medium |
| 5 | Deploying During Peak Traffic Without Blue-Green | Operations | Critical |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: No Post-Deployment Cache Reset

### Category
Operations

### Description
Deploying new code without resetting OpCache, config cache, route cache, or view cache.

### Why It Happens
CI/CD does not include cache reset. Manual deployment forgets.

### Warning Signs
Stale code executing after deploy. Config changes not reflected.

### Why Harmful
Stale OpCache means old PHP executes. Users see broken app.

### Consequences
Application broken after deploy. Rollback needed.

### Alternative
Automate cache reset: opcache_reset(), config:cache, route:cache.

### Refactoring Strategy
1. Add reset step in deployment. 2. Run opcache_reset(). 3. Warm caches after.

### Detection Checklist
- [ ] Cache reset automated
- [ ] OpCache reset executed
- [ ] Framework caches cleared

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Containerized Deployment Cache Strategies
- 05-rules.md: Reset caches after every deployment
- 05-rules.md: Automate invalidation in CI/CD
- 06-skills.md: Design Post-Deployment Cache Invalidation
- 07-decision-trees.md: Deployment Cache Strategy

---

## Anti-Pattern 2: OpCache validate_timestamps = 1 in Production

### Category
Configuration

### Description
Leaving validate_timestamps=1 in production causing stat syscalls on every request.

### Why It Happens
Default setting. Copying php.ini from dev to production.

### Warning Signs
High syscall rate (stat). File checks despite no deployments.

### Why Harmful
Each check requires stat syscall O(n). Adds 5-20ms per request.

### Consequences
5-20ms latency added. CPU wasted on stat syscalls.

### Alternative
Set validate_timestamps=0. Reset explicitly via deployment.

### Refactoring Strategy
1. Set to 0 in php.ini production. 2. Add opcache_reset() to deploy. 3. Verify via get_status().

### Detection Checklist
- [ ] validate_timestamps=0
- [ ] Deployment includes reset
- [ ] No stat overhead

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Containerized Deployment Cache Strategies
- 05-rules.md: Disable validate_timestamps in production
- 05-rules.md: Reset via deployment script
- 06-skills.md: Configure OpCache for Production Deployment
- 07-decision-trees.md: OpCache Production Configuration

---

## Anti-Pattern 3: Cold-Start Cache Building on First Request

### Category
Operations

### Description
Not warming caches after deployment so first requests pay compilation cost.

### Why It Happens
Deployment ends at code deploy. No warming step.

### Warning Signs
First requests after deploy 2-10x slower. Hit rate starts low and climbs.

### Why Harmful
Multiple concurrent requests all pay compilation cost simultaneously.

### Consequences
Latency spike during deployment. User-facing timeout risk.

### Alternative
Cache warming step: hit key endpoints, precompile caches.

### Refactoring Strategy
1. Add cache warm script. 2. Pre-warm OpCache. 3. Hit health endpoints.

### Detection Checklist
- [ ] Cache warming automated
- [ ] OpCache pre-compiled
- [ ] Health check warm

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Containerized Deployment Cache Strategies
- 05-rules.md: Warm caches after deployment
- 05-rules.md: Prevent cold-start latency
- 06-skills.md: Implement Cache Warming Strategies
- 07-decision-trees.md: Cache Warming Strategy

---

## Anti-Pattern 4: Invalidating Too Much Cache on Every Deploy

### Category
Operations

### Description
Flushing entire Redis/memcached or CDN cache on every deploy.

### Why It Happens
Better safe than sorry. No granular invalidation.

### Warning Signs
Full cache flush on deploy. Hit rate drops to 0. Slow recovery.

### Why Harmful
Full flush evicts useful data. CDN re-cache causes origin spike.

### Consequences
30-60 min reduced performance. 10x origin load.

### Alternative
Cache tags or prefix-based invalidation per changed resource.

### Refactoring Strategy
1. Implement cache tags. 2. Invalidate only affected. 3. Use version prefix.

### Detection Checklist
- [ ] Granular invalidation
- [ ] No full flush
- [ ] Hit rate recovery < 5min

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Containerized Deployment Cache Strategies
- 05-rules.md: Invalidate only changed entries
- 05-rules.md: Use cache tagging
- 06-skills.md: Design Granular Cache Invalidation Strategy
- 07-decision-trees.md: Cache Invalidation Strategy

---

## Anti-Pattern 5: Deploying During Peak Traffic Without Blue-Green

### Category
Operations

### Description
Deploying directly to production servers during peak traffic hours.

### Why It Happens
No deployment window. No staging environment.

### Warning Signs
Deployments at any time. Incidents correlate with deploy times.

### Why Harmful
Cache reset + compilation + restart during peak reduces capacity.

### Consequences
Revenue loss during peak. SLA violations.

### Alternative
Blue-green with traffic switching. Deploy during low traffic.

### Refactoring Strategy
1. Set deployment window. 2. Implement blue-green. 3. Warm passive before switch.

### Detection Checklist
- [ ] Deployment window defined
- [ ] Blue-green implemented
- [ ] Warm passive before switch

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Containerized Deployment Cache Strategies
- 05-rules.md: Deploy during low-traffic windows
- 05-rules.md: Use blue-green or rolling
- 06-skills.md: Design Blue-Green Deployment for PHP Apps
- 07-decision-trees.md: Deployment Strategy Decision

---
