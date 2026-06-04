# Identity Map — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Identity Map pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Assuming Identity Map Covers All Queries | Critical |
| 2 | Not Refreshing After External DB Change | High |
| 3 | Identity Map Preventing Read-After-Write Consistency | Medium |
| 4 | Cloned Model Same Identity Confusion | Medium |
| 5 | Octane Unbounded Identity Map Growth | High |

---

## 1. Assuming Identity Map Covers All Queries

### Category
Data Integrity

### Description
Believing Eloquent's identity map covers all query types, when it only applies to `find()` and `findOrFail()` by primary key — `where()` queries always return new instances.

### Why It Happens
Partial understanding of identity map scope. Developers assume all model loads return the same instance.

### Warning Signs
- `where()->first()` returns different object than `find()`
- In-memory state changes not reflected in `where()` results
- `==` comparisons failing between `find()` and `where()` results
- Surprise that identity map has limited scope

### Why Harmful
Inconsistent identity across query methods leads to multiple instances for the same row, defeating the purpose of identity map and causing stale data.

### Consequences
- Multiple instances for same DB row
- In-memory inconsistency
- Unpredictable behavior
- Debugging confusion

### Alternative
Use `find()` or `findOrFail()` when you need identity map guarantees. For `where()` queries, explicitly `->find()` the result by ID.

### Refactoring Strategy
1. Educate team on identity map scope
2. Use `find()` for identity map hits
3. Add helper methods that leverage identity map
4. Audit code for identity map assumptions

### Detection Checklist
- [ ] Review identity map understanding
- [ ] Check for `where()` then `find()` patterns
- [ ] Test identity map behavior

### Related Rules/Skills/Trees
- Skills: Identity Map, Eloquent ORM

---

## 2. Not Refreshing After External DB Change

### Category
Data Integrity

### Description
Not calling `refresh()` on a model after another process or request modifies the same row in the database, serving stale data from the identity map.

### Why It Happens
Identity map returns the cached instance. Developers don't consider concurrent modifications.

### Warning Signs
- Stale data served from identity map
- UI showing outdated values
- Concurrent modification issues
- Octane long-running process serving stale data

### Why Harmful
In concurrent or long-running processes, identity map returns stale models that diverge from database state.

### Consequences
- Stale data served to users
- Lost updates (overwrite with stale values)
- Data inconsistency
- Incorrect business decisions

### Alternative
Call `$model->refresh()` to reload from database. Set `$model->fresh()` to get a new instance. Use pessimistic locking for high-contention scenarios.

### Refactoring Strategy
1. Identify stale data patterns
2. Add explicit `refresh()` calls after external modifications
3. For high contention, use database locks
4. Implement freshness tracking

### Detection Checklist
- [ ] Identify stale data occurrences
- [ ] Check for refresh patterns
- [ ] Test concurrent modification scenarios

### Related Rules/Skills/Trees
- Skills: Identity Map, Concurrency Control

---

## 3. Identity Map Preventing Read-After-Write Consistency

### Category
Data Integrity

### Description
Writing to a model and then reading within the same request returns the identity-mapped instance (with changes), not the persisted state, masking write failures.

### Why It Happens
Identity map returns the in-memory object, which has pending or successful changes. The developer doesn't verify persistence.

### Warning Signs
- Code reading model after save assumes persistence
- No save success verification
- Unit tests passing but integration tests failing
- Database inconsistencies in production

### Why Harmful
Read-after-write returns the in-memory state, not confirming database state. Failed saves (constraint violations, connection issues) are masked.

### Consequences
- Silent data loss (save failed but code proceeds)
- Constraint violations not caught
- Inconsistent data state
- Debugging difficulty

### Alternative
Verify save success: `$model->save()` returns boolean. Use transaction scoping. After critical writes, verify via fresh query.

### Refactoring Strategy
1. Add save success verification
2. Use fresh queries after critical writes
3. Implement transaction rollback on failure
4. Add integration tests for write-read consistency

### Detection Checklist
- [ ] Check save verification patterns
- [ ] Test write failures
- [ ] Verify read-after-write behavior with actual DB

### Related Rules/Skills/Trees
- Skills: Identity Map, Unit of Work

---

## 4. Cloned Model Same Identity Confusion

### Category
Operations

### Description
Cloning an Eloquent model creates a new instance with the same identity but different in-memory state, causing confusion about which instance is authoritative.

### Why It Happens
`clone $model` creates PHP object copy. Identity map still references original but both instances have same primary key.

### Warning Signs
- Cloned model used alongside original
- In-memory state differs between clone and original
- `save()` on clone overwrites original's data
- Confusion about which instance is "correct"

### Why Harmful
Clone bypasses identity map. Two instances with same ID but different state cause unpredictable save behavior and overwrite conflicts.

### Consequences
- Last-write-wins data loss
- In-memory state confusion
- Hard-to-debug overwrite issues
- Unpredictable save behavior

### Alternative
Avoid cloning models with same identity. Use `replicate()` for copy-without-identity (sets key to null). For read-only variations, use `fresh()`.

### Refactoring Strategy
1. Identify clone usage on models
2. Replace with `replicate()` for new records
3. Use `fresh()` for read-only copies
4. Add clone detection in code review

### Detection Checklist
- [ ] Scan for model clone usage
- [ ] Check replicate usage for new records
- [ ] Verify identity map behavior after clone

### Related Rules/Skills/Trees
- Skills: Identity Map, Eloquent ORM

---

## 5. Octane Unbounded Identity Map Growth

### Category
Performance

### Description
In Laravel Octane (long-running processes), the identity map grows indefinitely across requests, causing memory leaks and performance degradation.

### Why It Happens
Octane reuses the container across requests. Identity map (which is per-request in traditional PHP) is never cleared.

### Warning Signs
- Memory growth in Octane workers
- Increasing identity map size over time
- Stale model instances from previous requests
- Performance degradation over worker lifetime

### Why Harmful
Unbounded identity map causes memory exhaustion, stale data, and worker restart loops. Each request adds more models that are never freed.

### Consequences
- Memory leaks
- Worker restarts
- Stale data from previous requests
- Performance degradation
- Increased infrastructure costs

### Alternative
Clear identity map between requests: `\Illuminate\Database\Eloquent\Model::clearBootedModels()`. Or disable identity map in Octane configuration.

### Refactoring Strategy
1. Add identity map cleanup between Octane requests
2. Configure model cache clearing
3. Monitor per-worker memory usage
4. Test with high-volume load
5. Consider disabling identity map for long-running processes

### Detection Checklist
- [ ] Check Octane identity map behavior
- [ ] Monitor memory growth in workers
- [ ] Verify identity map cleanup exists

### Related Rules/Skills/Trees
- Skills: Identity Map, Laravel Octane
- Decision Trees: Octane Identity Map Strategy
