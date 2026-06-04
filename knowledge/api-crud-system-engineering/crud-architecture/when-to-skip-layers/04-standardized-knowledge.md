# ECC Standardized Knowledge — When to Skip Layers

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | When to Skip Layers |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Layer isolation rules are the default, but there are pragmatic exceptions where skipping a layer is acceptable — even preferable. The key is knowing when an exception is justified vs when it's a slippery slope to architecture collapse. Each exception must be intentional, documented, and bounded. Unbounded rule-breaking destroys the architecture. The mental model is "every layer must earn its existence" — if a layer is not providing value for a specific operation, it can be skipped with explicit justification.

## Core Concepts

- **Acceptable Skips**: Repository (query has no logic, caching, scoping), Service (operation has no business logic), DTO (data crosses only 1 layer with simple 2-3 fields)
- **Never Acceptable Skips**: Controller → DB (bypasses all logic), Controller → Repository (skips service/action entirely), Service → raw SQL (skips Eloquent's relationship handling)
- **The Two Questions Test**: (1) If I add a business rule later, will I remember to update this skipped path? (2) If a new developer reads this code, will they understand why the layer was skipped? If either answer is "no," don't skip.
- **Read vs Write**: Reads are safer to simplify. Writes need the full stack — always follow layer rules for write operations.

## When To Use

- Simple read operations with no business logic, caching, or scoping
- Boolean toggles or scalar operations where a DTO adds no value
- Lookup queries where the skipped layer provides zero benefit
- MVPs and prototypes where speed is the priority (document skips for hardening later)

## When NOT To Use

- Write operations — data integrity matters most, always follow layer rules
- Operations with current or likely future business rules
- When the skip would create an undocumented hidden code path
- When the skip pattern appears 3+ times — signals the layer isn't earning its existence
- Any operation where team consensus cannot be reached

## Best Practices

- Document every exception with `@layer-skip` annotation including reason, date, and reviewer
- Bound the skip to the specific operation — use a dedicated class, not inline in a controller
- Maintain an exception registry in architecture documentation
- Review all exceptions quarterly — the condition that justified the skip may have changed
- Treat skipping writes as unacceptable unless there is an extraordinary justification

## Architecture Guidelines

- Formal skip decision: (1) operation has no current business rules, (2) unlikely to ever have them, (3) is a read (not write), (4) has a single call site, (5) team agrees the layer would be pure ceremony
- If any team member objects to the skip, do not formalize it — the cost of one extra file is lower than team disagreement
- The "Rule of Three": if a skip pattern appears 3+ times, the layer should be removed or justified properly for that category
- A skip must not leak beyond its bounded scope — the exception class is the skip boundary

## Performance Considerations

- Each architectural layer adds ~2-5ms overhead for the full chain (controller → service → repository → Eloquent)
- Invisible for single lookups but significant in loops, batch operations, or high-throughput endpoints
- Cache first, optimize queries second, skip layers last — performance-driven skipping is the highest-risk category
- Profile before optimizing by skipping layers — often the bottleneck is the database query, not the layer indirection
- A skip justified by performance becomes permanent architectural debt even after the performance concern is resolved

## Security Considerations

- Skipping layers bypasses authorization checks, query scoping, and business rule enforcement in the skipped layer
- The propagation problem: when a business rule changes, the skipped path silently returns incorrect results
- Writes that skip layers miss validation, scoping, and event dispatching — creating data integrity and security gaps
- An exception registry prevents skipped paths from becoming security blind spots

## Common Mistakes

- **Treating Exceptions as the Default**: Skipping becomes the norm because "it's faster." Solution: Enforce the default and require explicit justification for exceptions.
- **Skipping Writes**: Simple creates/updates "with no business logic." Solution: Always follow layer rules for write operations.
- **Skipping Without Documentation**: Developer knows why but doesn't document it. Solution: Always document each exception with reason and re-evaluation trigger.
- **Exception Creep**: 2 documented exceptions grow to 20 undocumented ones. Solution: Quarterly review and exception registry.

## Anti-Patterns

- **The Slippery Slope**: "Just this once" becomes the pattern. Each individual exception seems reasonable, but accumulated effect destroys the architecture.
- **Architecture Collapse**: Layers exist but are consistently bypassed. The architecture is effectively flat — no layer provides any isolation.
- **Silent Skip in Controller**: Controller calls Eloquent directly in one method but uses services in all others. Unbounded, undocumented, invisible to enforcement tools.
- **Skip as Default for New Features**: New development skips layers by default and only adds them when forced. Creates inconsistent architecture from day one.

## Examples

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

### Bounded Context Skip Rules
```
✓ Acceptable: Service using Eloquent directly for simple reads
✓ Acceptable: Action with scalar parameter (no DTO) for simple toggles
✗ NEVER: Controller calling Eloquent directly
✗ NEVER: Any write operation skipping layers
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Layer Isolation Rules | The rules that define what "skipping" means | Prerequisite |
| All Flow Patterns | Understanding the correct flow before deviating | Prerequisite |
| Service vs Action Decision | Choosing the right layer for operations | Related |
| Repository vs Eloquent Decision | Choosing repository vs direct Eloquent | Related |
| Architectural Decision Records | Documenting skip exceptions | Follow-up |
| Architecture Fitness Functions | Automated architecture rule enforcement | Follow-up |

## AI Agent Notes

- Layer skipping is not a failure of discipline — it's a pragmatic response to the fact that not all operations are complex enough to justify full layer isolation
- The key is making exceptions explicit, documented, and bounded — undocumented exceptions are the real threat to architecture integrity
- Mature codebases typically have very few layer skip exceptions (<5% of operations)
- When generating code, always generate the full layer stack by default — only add skip annotations when the team explicitly decides
- Default to following layer isolation rules; require explicit team consensus for exceptions

## Verification

- [ ] Layer skip exceptions are documented with `@layer-skip` annotations
- [ ] Skip exceptions are registered in the project's exception registry
- [ ] Quarterly review is scheduled for all active exceptions
- [ ] Writes never skip layers — the full stack is always followed
- [ ] Undocumented skips are treated as bugs, not accepted patterns
- [ ] The "Two Questions" test passes for every skip exception
- [ ] Exception creep is monitored — if a pattern appears 3+ times, the layer should be re-evaluated
- [ ] Team consensus exists for every skip exception
