# Skill: Integrate Legacy Systems at Context Boundaries

## Purpose
Integrate legacy systems at bounded context boundaries using Anti-Corruption Layer (ACL) and Strangler Fig patterns. Build ACL in the new context's boundary, pair Strangler Fig with ACL, use feature-flag based routing, implement write-through/read-through during migration, and include compensating rollback logic.

## When To Use
- Legacy system with fundamentally different model that would corrupt new context
- Large legacy system that cannot be replaced in one effort

## When NOT To Use
- Strangler Fig without ACL (passes legacy data structures through)
- Full rewrite attempt (high risk of failure)

## Prerequisites
- ACL pattern knowledge (DBC-04)
- Bounded contexts identified for the new system

## Inputs
- Legacy system API/schema documentation
- New bounded context domain model
- Feature migration priority list

## Workflow
1. **Always pair Strangler Fig with ACL.** Strangler replaces functionality but without ACL, legacy data structures pass through. The new system inherits legacy model problems.

2. **Use feature-flag based routing for Strangler Fig migration.** Route traffic between legacy and new systems using feature flags. Each feature independently testable, verifiable, and rollback-able.

3. **Implement write-through and read-through during migration.** Write data to both systems (legacy + new). Read from new system. Verify correctness without user-facing impact.

4. **Never attempt a full legacy system rewrite.** Replace feature by feature incrementally. Full rewrites have high failure rates — the legacy system embodies years of bug fixes.

5. **Build the ACL in the new context's boundary, not in legacy.** The new context protects its own model integrity. Placing ACL in legacy requires modifying legacy, which is often impossible.

6. **Ensure the ACL translates both directions.** If the new context sends data back to legacy, implement bidirectional translation (`toNewOrder()`, `toLegacyFormat()`).

7. **Never import legacy system classes directly into the new context.** No legacy class, model, or DTO is imported outside the ACL. The ACL is the only bridge.

8. **Include compensating rollback logic in the migration plan.** If the new system fails, traffic can be routed back to legacy. Each migration step must be reversible.

9. **Monitor the migration process with key metrics.** Track error rate in new system, data consistency checks, latency comparison, and rollback readiness.

## Validation Checklist
- [ ] ACL translates between legacy and new models
- [ ] Strangler Fig replaces functionality incrementally
- [ ] No direct legacy model imports in new context
- [ ] Feature flags control migration routing
- [ ] Write-through verifies correctness during migration
- [ ] Rollback plan exists for each migration step
- [ ] Migration is monitored (error rate, consistency, latency)

## Common Failures
- **No ACL.** Importing legacy models directly into new context — legacy schema infects new domain model.
- **Strangler Fig without ACL.** Replaces functionality but passes legacy data structures through — new system inherits legacy problems.
- **Full rewrite attempt.** Replace entire legacy at once — high failure risk.

## Decision Points
- **Strangler Fig vs full rewrite?** Always Strangler Fig for anything beyond trivial scope. Never full rewrite.

## Performance Considerations
- ACL adds translation overhead per call (microseconds).
- Dual operation during migration doubles write workload.

## Security Considerations
- ACL provides security isolation — only translated data crosses the boundary.
- Rollback logic must handle security context correctly when reverting to legacy.

## Related Rules
- Rule: Always pair Strangler Fig with an Anti-Corruption Layer (DBC-10/05-rules.md)
- Rule: Use feature-flag based routing for Strangler Fig migration (DBC-10/05-rules.md)
- Rule: Implement write-through and read-through during migration (DBC-10/05-rules.md)
- Rule: Never attempt a full legacy system rewrite (DBC-10/05-rules.md)
- Rule: Ensure the ACL translates both directions (DBC-10/05-rules.md)
- Rule: Build the ACL in the new context's boundary (DBC-10/05-rules.md)
- Rule: Never import legacy system classes directly (DBC-10/05-rules.md)
- Rule: Include compensating rollback logic (DBC-10/05-rules.md)
- Rule: Monitor the migration process (DBC-10/05-rules.md)

## Related Skills
- Build Anti-Corruption Layer (DBC-04/06-skills.md)
- Split Monolithic Models Incrementally (DBC-08/06-skills.md)
- Use Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Extract Modules Incrementally (MMD-11/06-skills.md)
- Refactor and Remediate Architecture (AEG-09/06-skills.md)

## Success Criteria
- ACL exists between new context and legacy system with bidirectional translation.
- Strangler Fig migrates features incrementally using feature flags.
- No legacy class is imported outside the ACL boundary.
- Each migration step has a rollback plan with feature-flag toggle.
- Migration monitoring tracks error rate, data consistency, and latency.
