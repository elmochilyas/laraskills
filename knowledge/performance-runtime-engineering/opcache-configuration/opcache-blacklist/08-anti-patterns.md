# Anti-Patterns: OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching |

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration |
| Knowledge Unit | OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching | |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Undersized OpCache Memory Allocation | Configuration | Critical |
| 2 | Not Configuring max_accelerated_files | Configuration | High |
| 3 | Disabling validate_timestamps in Development | Configuration | Medium |
| 4 | Not Monitoring OpCache Hit Rate | Operations | High |
| 5 | Forgetting opcache_reset() After Deployment | Operations | High |

---

## Anti-Pattern 1: Undersized OpCache Memory Allocation

### Category
Configuration

### Description
Setting opcache.memory_consumption too low (default 64MB) for the application, causing cache full and file eviction.

### Why It Happens
Default configuration used without checking application size. No monitoring of OpCache memory utilization.

### Warning Signs
opcache_get_status() shows cache full. Low hit rate. Files constantly evicted and recompiled.

### Why Harmful
When memory is full, OpCache evicts cached opcodes. Evicted files must be recompiled on next request, adding compilation overhead.

### Consequences
OpCache hit rate below 99%. Compilation overhead on every request for evicted files. 2-4x throughput loss.

### Alternative
Monitor OpCache memory utilization. Set memory_consumption based on application size (256MB for most, 512MB+ for large apps).

### Refactoring Strategy
1. Check current memory_consumption and hit rate 2. Increase to 256MB 3. Monitor hit rate over 24h 4. Verify hit rate > 99%

### Detection Checklist
- [ ] OpCache memory sized for application
- [ ] Hit rate > 99% at steady state
- [ ] No cache full events
- [ ] Memory utilization monitored

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching |
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 2: Not Configuring max_accelerated_files

### Category
Configuration

### Description
Leaving opcache.max_accelerated_files at default, which may be insufficient for the number of PHP files.

### Why It Happens
Default value works for small apps. Unawareness of the limit. No file count monitoring.

### Warning Signs
OpCache reports num_cached_keys near max_accelerated_files. Some files not cached. Hit rate low.

### Why Harmful
Files exceeding the limit are not cached. They must be compiled on every request, adding overhead.

### Consequences
Partial OpCache coverage. Some requests pay compilation cost. Inconsistent performance.

### Alternative
Set max_accelerated_files to approximate number of PHP files + 20% headroom.

### Refactoring Strategy
1. Count PHP files: find . -name '*.php' | wc -l 2. Set max_accelerated_files to count + 20% 3. Monitor num_cached_keys

### Detection Checklist
- [ ] max_accelerated_files set above file count
- [ ] No files left uncached
- [ ] num_cached_keys below limit
- [ ] Hit rate verified

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching |
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 3: Disabling validate_timestamps in Development

### Category
Configuration

### Description
Setting validate_timestamps=0 in development, requiring manual cache resets for code changes to take effect.

### Why It Happens
Copying production configuration to development. Not understanding the trade-off. Convenience of faster execution.

### Warning Signs
validate_timestamps=0 in dev. Code changes don't take effect. Need opcache_reset() after changes.

### Why Harmful
validate_timestamps=0 improves performance but means file changes are not detected. In development, this breaks the edit-refresh cycle.

### Consequences
Developers confused by stale code. Wasted time debugging cache issues. Unnecessary opcache_reset() calls.

### Alternative
Use validate_timestamps=1 in development for instant code refresh. Use validate_timestamps=0 in production for maximum performance.

### Refactoring Strategy
1. Set validate_timestamps=1 in dev php.ini 2. Set validate_timestamps=0 in production 3. Maintain separate configs

### Detection Checklist
- [ ] validate_timestamps=1 in development
- [ ] validate_timestamps=0 in production
- [ ] Separate configs per environment
- [ ] Production has deployment cache reset strategy

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching |
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 4: Not Monitoring OpCache Hit Rate

### Category
Operations

### Description
Not tracking OpCache hit rate in monitoring dashboards, missing early warning signs of misconfiguration.

### Why It Happens
No monitoring setup for OpCache metrics. Assuming default configuration is adequate.

### Warning Signs
No OpCache metrics in dashboards. No alerting on low hit rate. Team unaware of cache health.

### Why Harmful
Without monitoring, configuration issues go undetected. Low hit rate silently degrades performance.

### Consequences
Gradual performance degradation from OpCache issues. Difficult root cause analysis without metrics.

### Alternative
Add OpCache hit rate to monitoring dashboards. Alert on < 99% hit rate.

### Refactoring Strategy
1. Add opcache_get_status() metrics to monitoring 2. Set alert at < 99% hit rate 3. Investigate when alert fires

### Detection Checklist
- [ ] OpCache hit rate monitored
- [ ] Alert on < 99% hit rate
- [ ] Historical data available
- [ ] Team responds to alerts

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching |
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 5: Forgetting opcache_reset() After Deployment

### Category
Operations

### Description
Deploying code changes without resetting OpCache, serving stale opcodes from shared memory.

### Why It Happens
Deployment scripts don't include cache reset step. Not understanding OpCache serves cached opcodes until reset.

### Warning Signs
Code changes deployed but not reflected. Old behavior persists despite new files.

### Why Harmful
OpCache serves cached opcodes until explicitly reset or file timestamps trigger revalidation.

### Consequences
Stale code in production. Deployments ineffective until manual cache reset. User-facing issues from outdated behavior.

### Alternative
Always include opcache_reset() or graceful PHP-FPM reload in deployment pipeline.

### Refactoring Strategy
1. Add opcache_reset() to deployment script 2. Or config graceful PHP-FPM reload 3. Verify cache reset in deployment logs

### Detection Checklist
- [ ] Deployment includes cache reset or FPM reload
- [ ] Deployment verification checks cache state
- [ ] Rollback plan includes cache reset
- [ ] Validate timestamps strategy documented

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: OpCache Blacklist — opcache.blacklist_filename, Excluding Files from Caching |
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees
