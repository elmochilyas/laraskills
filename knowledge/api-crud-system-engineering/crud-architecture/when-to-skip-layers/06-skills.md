# Skill: Decide When to Skip Architectural Layers

## Purpose
Make intentional, documented, and bounded exceptions to layer isolation rules — skipping repository, service, or DTO layers only for simple read operations where the layer provides zero value.

## When To Use
- Simple read operations with no business logic, caching, or scoping
- Boolean toggles or scalar operations where DTO adds no value
- Lookup queries where skipped layer provides zero benefit
- MVPs and prototypes where speed is priority (document for hardening later)

## When NOT To Use
- Write operations — data integrity matters, always follow layer rules
- Operations with current or likely future business rules
- When skip would create undocumented hidden code path
- When skip pattern appears 3+ times — signals layer isn't earning existence
- Any operation where team consensus cannot be reached

## Prerequisites
- Understanding of the standard layer flow
- Knowledge of what each layer provides

## Inputs
- Operation complexity assessment
- Team consensus on skip justification

## Workflow
1. Assess operation: no current business rules, unlikely to need them, is a read (not write), single call site
2. Pass the "Two Questions" test: (1) Will you remember to update this skipped path when business rules are added? (2) Will a new developer understand why the layer was skipped?
3. Document every skip with `@layer-skip` annotation — reason, date, reviewer
4. Never skip layers for write operations — full stack required
5. Maintain exception registry in architecture docs — review quarterly
6. Apply the Rule of Three — if same skip pattern appears 3+ times, re-evaluate layer
7. Require team consensus for every skip — if any team member objects, add the layer

## Validation Checklist
- [ ] Layer skip documented with `@layer-skip` annotation
- [ ] Skip registered in project exception registry
- [ ] Quarterly review scheduled for active exceptions
- [ ] Writes never skip layers
- [ ] Undocumented skips treated as bugs
- [ ] Two Questions test passes for every skip
- [ ] Team consensus exists for every skip

## Common Failures
- Treating exceptions as default — skipping becomes norm because "it's faster"
- Skipping writes — simple creates/updates "with no business logic"
- Skipping without documentation — developer knows why but doesn't document
- Exception creep — 2 documented exceptions grow to 20 undocumented ones

## Decision Points
- Read vs write — reads safer to simplify, writes need full stack always
- DTO vs no DTO — DTO for >2 fields, skip for simple scalars
- Repository vs direct Eloquent — repository for scoped/cached, skip for trivial lookups

## Performance Considerations
- Each layer adds ~2-5ms for full chain — invisible for single lookups, significant in loops
- Cache first, optimize queries second, skip layers last
- Performance-driven skipping is highest-risk category
- Skip justified by performance becomes permanent architectural debt

## Security Considerations
- Skipping layers bypasses authorization, query scoping, business rules in skipped layer
- Propagation problem: when business rule changes, skipped path silently returns incorrect results
- Writes skipping layers miss validation, scoping, event dispatching
- Exception registry prevents skipped paths from becoming security blind spots

## Related Rules
- Never Skip Layers for Write Operations
- Document Every Skip with @layer-skip Annotation
- Pass the "Two Questions" Test for Every Skip
- Maintain an Exception Registry and Review Quarterly
- The Rule of Three — Re-evaluate at 3+ Patterns
- Require Team Consensus for Every Skip

## Related Skills
- Thin Controller Principle — the rule that defines what skipping means
- Controller-DTO-Action Flow — standard flow to deviate from
- Repository vs Eloquent Decision — choosing repository vs direct Eloquent

## Success Criteria
- All layer skips are documented with annotations
- No write operations skip layers
- Exception registry is maintained and reviewed quarterly
- Team consensus exists for every skip exception
- Rule of Three prevents pattern proliferation