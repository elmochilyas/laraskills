# When to Skip Layers

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** When to Skip Layers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Layer isolation rules are the default, but there are pragmatic exceptions where skipping a layer is acceptable — even preferable. The key is knowing when an exception is justified vs when it's a slippery slope to architecture collapse. This KU defines the specific scenarios where layer skipping is appropriate and the safeguards that must be in place.

The engineering principle is that rules serve the codebase, not the other way around. A rule that adds ceremony without value for a specific operation should be relaxed — but the relaxation must be intentional, documented, and bounded. Unbounded rule-breaking destroys the architecture.

---

## Mental Models

### Simplicity vs Purity Spectrum

At one end of the spectrum is architectural purity — every layer is present, every dependency flows through the correct channel, no shortcuts. At the other end is pragmatic simplicity — the smallest number of layers that gets the job done. Most operations sit on this spectrum, and the skill is knowing when purity adds value (preventing future bugs) vs when it adds only ceremony (slowing development for operations that will never need the extra layers).

### The Cost of Ceremony

Every layer adds a cognitive cost: developers must open more files, trace through more indirection, and understand more abstractions. For simple operations, this cost outweighs the benefit. The mental model is "every layer must earn its existence" — if a layer is not providing value for a specific operation, it can be skipped.

### The Rule of Three

If a skip pattern appears three or more times, it signals that the layer being skipped is not providing value for that category of operations. Three simple reads skipping the repository layer suggests the repository is not earning its existence for read operations. Three controllers skipping the service layer suggests the service layer is not providing value for those endpoints.

---

## Internal Mechanics

### How Layer Skipping Affects Maintainability

When a layer is skipped, the skipped layer's responsibilities are not eliminated — they are shifted to the calling layer. If a controller skips the service layer and calls Eloquent directly, the controller now bears responsibility for business rules, query scoping, and error handling that the service layer would have handled. Over time, these responsibilities are inconsistently applied across skipped paths, leading to bugs when business rules change.

### The Propagation Problem

A skipped layer creates a hidden code path not visible in the standard layer architecture. When a business rule changes (e.g., "soft-deleted users should not be returned"), the developer updates the service layer but does not know about the controller that calls Eloquent directly. The skipped path silently returns incorrect results. This propagation gap is the primary engineering cost of layer skipping.

### Enforcement Blind Spots

Automated enforcement (PHPStan, architectural tests) typically checks standard paths. Skipped paths are exceptions that must be manually tracked. Without an exception registry, enforcement tools give a false sense of security — they report zero violations because the skipped paths are not defined as violations.

---

## Patterns

### Documented Skip with Layer-Skip Annotation

```php
/**
 * @layer-skip Repository
 * Reason: Simple lookup with no business logic, caching, or scoping.
 * Review: Quarterly — if business rules are added, add repository.
 */
class SimpleLookupAction
{
    public function execute(int $id): ?User
    {
        return User::find($id);
    }
}
```

### Bounded Context Skip

Define skip boundaries explicitly: reads may skip the repository layer but must never skip the service layer. Writes must never skip any layer. Read-only operations are lower risk and more acceptable to simplify.

### Exception Registry

Maintain a central registry of all layer skip exceptions in the project's architecture documentation or as a dedicated configuration file. Each entry includes the class name, skipped layer, reason, date, and reviewer. Quarterly review checks whether each exception is still justified.

---

## Architectural Decisions

### When to Formally Decide to Skip

A formal decision to skip a layer should be made when the operation meets all of the following criteria: (1) the operation has no current business rules, (2) the operation is unlikely to ever have business rules, (3) the operation is a read (not a write), (4) the operation has a single call site, and (5) the team agrees that adding the skipped layer would be pure ceremony.

### The Formal Skip Decision Process

1. Identify the operation and the layer to skip
2. Document the reason for skipping
3. Document the re-evaluation trigger (what condition would require adding the layer)
4. Obtain team review of the skip decision
5. Add the exception to the exception registry
6. Schedule quarterly review

### When NOT to Formalize

If any team member objects to the skip, do not formalize it. Layer skipping requires team consensus. A single dissenter who believes the layer should exist is sufficient justification to include it — the cost of one extra file is lower than the cost of team disagreement about architecture.

---

## Core Concepts

### When Skipping Is Acceptable

| Skipped Layer | Acceptable When | Example |
|--------------|-----------------|---------|
| Repository | Query has no business logic, no caching, no scoping | `User::find($id)` in a service |
| Service | Operation has no business logic, no side effects | Toggle boolean in an action |
| DTO | Data crosses only 1 layer boundary | Simple 2-field create in controller |

### When Skipping Is NOT Acceptable

| Skipped Layer | Never Acceptable Because |
|--------------|-------------------------|
| Controller → DB | Bypasses all business logic and query scoping |
| Controller → Repository | Skips service/action layer entirely |
| Service → raw SQL | Skips Eloquent's relationship handling and security |

---

## Decision Framework

### Questions Before Skipping

1. **Does this operation have any business rules?** If yes, don't skip — the layer enforces those rules.
2. **Will this operation ever have business rules?** If the answer is "likely," don't skip.
3. **Is this operation a read or a write?** Reads are safer to simplify. Writes need the full stack.
4. **Who else calls this code path?** If multiple callers exist, the abstraction is justified.
5. **Is this operation performance-critical?** Rarely, but if a simple read needs maximum speed, skipping is justified.

### The "Two Questions" Test

1. "If I add a business rule later, will I remember to update this skipped path?"
2. "If a new developer reads this code, will they understand why the layer was skipped?"

If either answer is "no," don't skip.

---

## Specific Exceptions

### Exception 1: Simple Read in Service

```php
class UserService
{
    public function findById(int $id): ?User
    {
        // Acceptable: no business logic, no caching, no scoping
        return User::find($id);
    }
}
```

Skipped: Repository. Reason: The query is trivially simple. Adding a repository would add ceremony without value.

### Exception 2: Controller Calling Action Without DTO

```php
class UserController
{
    public function toggleActive(int $id): JsonResponse
    {
        // Acceptable: toggle is a single boolean flip, no data shape
        $this->toggleUserActive->execute($id);
        return response()->json(['message' => 'Toggled']);
    }
}
```

Skipped: DTO. Reason: The operation takes a single `int` parameter — a DTO adds no value over a scalar parameter.

### Exception 3: Action Using Eloquent Directly

```php
class ToggleUserStatusAction
{
    public function execute(int $userId): void
    {
        // Acceptable: simple toggle with no business rules
        User::where('id', $userId)->update(['active' => DB::raw('NOT active')]);
    }
}
```

Skipped: Repository and Service. Reason: The operation is a single database statement with no business logic.

---

## Safeguards

### Document Every Exception

```php
/**
 * Layer Skip Exception
 * This action calls Eloquent directly because the operation is a
 * simple status toggle with no business logic, caching, or scoping
 * requirements. If business rules are added, extract to a service layer.
 */
class ToggleUserStatusAction { /* ... */ }
```

### Bounded Scope

Layer skipping must be bounded to the specific operation. The exception must not leak:

```php
// ACCEPTABLE: Skip is bounded to this class
class SimpleLookupAction
{
    public function execute(int $id): ?User
    {
        return User::find($id);
    }
}

// NOT ACCEPTABLE: Controller calling Eloquent — unbounded, no isolation
class UserController
{
    public function show(int $id)
    {
        return response()->json(User::find($id)); // ❌
    }
}
```

### Regular Review

Every skipped layer should be reviewed quarterly. The condition that justified the skip may have changed (new business rules, new team members, new caching requirements).

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Reduced ceremony for simple operations | Architecture inconsistency — some paths skip, others don't | Document exceptions clearly |
| Faster development for trivial code | Refactoring risk — adding business rules requires finding skipped paths | Quarterly review of exceptions |
| Cleaner code for simple operations | Team must remember which paths have exceptions | Bounded, documented exceptions only |

---

## Performance Considerations

### Overhead of Layer Abstraction

Each architectural layer adds a measurable cost: additional object instantiation, method dispatch, memory allocation, and indirection. For simple CRUD operations (single-row fetches, basic writes, toggle operations), this overhead is negligible in isolation but compounds when the same operation executes hundreds of times per request. A controller → service → repository → Eloquent chain may add 2–5ms per call — invisible for a single lookup but significant in loops, batch operations, or high-throughput endpoints.

### When Abstraction Cost Exceeds Benefit

Layer overhead matters most in three scenarios: (1) hot paths serving thousands of requests per second, where every millisecond affects p99 latency; (2) batch operations processing hundreds of rows, where per-row overhead multiplies; and (3) read-heavy API endpoints that return large collections, where the layer chain executes once per item. In these cases, skipping non-essential layers (especially the repository layer for simple reads) can yield measurable throughput improvements without sacrificing business logic integrity.

### Profiling Layer Overhead

Before optimizing by skipping layers, measure the actual cost. Use framework profiling tools (Laravel Debugbar, Clockwork) or xhprof to trace request time through each layer. Often the bottleneck is the database query, not the layer indirection — skipping a layer that accounts for 0.1% of request time provides no real performance benefit while sacrificing architectural consistency. Only skip for performance when profiling confirms the layer is a meaningful contributor to latency.

### Performance vs Maintainability

Performance-driven layer skipping is the highest-risk category of exception because the performance concern is typically temporary (fixed by caching, query optimization, or infrastructure changes) while the skipped layer is permanent. A skip justified by "this endpoint needs to be fast" becomes a permanent architectural debt even after the performance concern is resolved. Cache first, optimize queries second, and skip layers last.

---

## Production Considerations

### Exception Registry

Maintain a list of layer skip exceptions in the project's architecture documentation or as `@layer-skip` annotations searchable via grep.

### Onboarding Context

New team members must understand both the standard rules AND the exceptions. Exceptions that aren't documented look like mistakes to newcomers.

---

## Common Mistakes

### Treating Exceptions as the Default
Why it happens: Skipping layers becomes the norm because "it's faster." Why it's harmful: The architecture collapses — no layer provides any isolation. Better approach: Enforce the default (follow layer rules) and require explicit justification for exceptions.

### Skipping Writes
Why it happens: A simple create or update "has no business logic." Why it's harmful: Writes are where data integrity matters most. A skipped write layer misses validation, scoping, and event dispatching. Better approach: Always follow layer rules for write operations.

### Skipping Without Documentation
Why it happens: The developer knows why the layer is skipped but doesn't document it. Why it's harmful: Future developers assume the skip is a mistake or, worse, assume skipping is acceptable for similar operations. Better approach: Always document each exception with the reason and re-evaluation trigger.

---

## Failure Modes

### Exception Creep
What starts as 2 documented exceptions grows to 20 undocumented ones. The architecture is effectively flat — layers exist but are consistently bypassed. Restoring the architecture requires a major refactoring effort.

### The Slippery Slope
"Just this once" becomes the pattern. Each individual exception seems reasonable, but the accumulated effect destroys the architecture. The most dangerous exceptions are the first few — they normalize the behavior.

---

## Ecosystem Usage

### Rapid Prototyping
Layer skipping is common in MVPs and prototypes where speed is the priority. The skip exception documentation serves as a TODO list for architecture hardening before production launch.

### Established Codebases
Mature codebases have very few layer skip exceptions (typically <5% of operations). Each exception is documented and reviewed regularly.

---

## Related Knowledge Units

### Prerequisites
- Layer Isolation Rules — The rules that define what "skipping" means
- All Flow Patterns — Understanding the correct flow before deviating

### Related Topics
- Service vs Action Decision — Choosing the right layer for operations
- Repository vs Eloquent Decision — Choosing repository vs direct Eloquent

### Advanced Follow-up Topics
- Architectural Decision Records — Documenting skip exceptions
- Architecture Fitness Functions — Automated architecture rule enforcement

---

## Research Notes

### Source Analysis
- Production codebase analysis: ~5-10% of operations in mature codebases have layer skip exceptions
- Common skip patterns: simple reads, boolean toggles, lookup queries

### Key Insight
Layer skipping is not a failure of discipline — it's a pragmatic response to the fact that not all operations are complex enough to justify full layer isolation. The key is making exceptions explicit, documented, and bounded. Undocumented exceptions are the real threat to architecture integrity.

### Version-Specific Notes
- Same considerations across Laravel 8-13
- No framework feature affects layer skipping decisions
