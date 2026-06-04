# Skill: Extract a Module to an Independent Microservice

## Purpose
Move a module from the modular monolith to a standalone microservice using the Strangler Fig pattern, with contract hardening, parallel run verification, feature-flagged cutover, and separate database.

## When To Use
- Module resource requirements (CPU, memory, scaling) diverge significantly
- Team requires independent deployment for this module
- Module needs different technology stack
- Performance isolation required

## When NOT To Use
- Only reason is "microservices are trendy"
- Module contracts are still evolving
- Module shares database tables with other modules (need to separate first)

## Prerequisites
- Module has been designed as extraction-ready (contracts, schema ownership)
- Extraction triggers are documented and measurable
- Feature flag infrastructure in place
- CI for both monolith and new service

## Inputs
- Module to extract
- Contracts that the module provides and consumes
- Database schema ownership map
- Traffic patterns and route registry

## Workflow
1. **Verify extraction triggers are met.** Confirm measurable resource divergence, team independence requirement, or technology divergence. Document triggers in an ADR.

2. **Harden and freeze module contracts.** Ensure all contracts are stable (no changes in 4+ weeks), documented, versioned, and have comprehensive contract tests. Freeze contracts for extraction duration.

3. **Extract database schema first.** Move the module's tables to their own database connection while the code is still in the monolith. Verify everything works. This is the hardest step — do it first with easy rollback.

4. **Create the independent service.** Set up a new Laravel application with its own database. Copy the module code. Replace in-process contract calls with HTTP/queue calls. Add authentication/authorization.

5. **Implement parallel run.** Run both the monolith module and new service simultaneously for the same requests. Compare outputs. Fix discrepancies before cutting over.

6. **Feature-flag the cutover.** Wrap the route redirection in a feature flag. Shift traffic gradually (10% → 50% → 100%). Maintain instant rollback via the feature flag.

7. **Never share the database after extraction.** The extracted service must have its own database. Communication is only via HTTP/queue. Shared database = distributed monolith.

## Validation Checklist
- [ ] Extraction triggers are documented and verified
- [ ] Module contracts are stable, versioned, and tested
- [ ] Database schema is separated before code extraction
- [ ] New service has its own database
- [ ] Parallel run mode detects discrepancies before cutover
- [ ] Feature flag controls cutover with instant rollback
- [ ] Extraction follows Strangler Fig pattern (gradual, not big bang)
- [ ] New service has its own auth/authorization
- [ ] Rollback plan exists and is tested

## Common Failures
- **Extracting too early.** Before contracts stabilize — every contract change doubles the work.
- **Extracting too late.** Monolith grew without enforcement — module was never truly isolated.
- **Big bang extraction.** One massive cutover with no rollback plan.
- **Forgetting shared database.** Extracted service continues using monolith's database — creates distributed monolith.

## Decision Points
- **Code-first vs database-first extraction?** Database-first: separate DB while code is still in monolith. This is safer and enables easier rollback.
- **Gradual vs full cutover?** Always gradual (Strangler Fig). Full cutover is high-risk.

## Performance Considerations
- Extracted communication adds network latency (in-process µs → HTTP ms).
- Batch or cache data previously accessed via in-process contract calls.
- Consider async communication for non-critical cross-service calls.

## Security Considerations
- Extracted service needs its own authentication/authorization — no longer shares monolith's security context.
- Network communication between services must be encrypted and authenticated.
- API keys, tokens, and secrets must be managed per service.

## Related Rules
- Rule: Extract Only When Triggers Met (MMD-11/05-rules.md)
- Rule: Harden Contracts Before Extraction (MMD-11/05-rules.md)
- Rule: Strangler Fig Extraction (MMD-11/05-rules.md)
- Rule: Never Share Database After Extraction (MMD-11/05-rules.md)
- Rule: Feature-Flag Cutover (MMD-11/05-rules.md)
- Rule: Parallel Run Verification (MMD-11/05-rules.md)
- Rule: Extract Database First (MMD-11/05-rules.md)

## Related Skills
- Decide Modular Monolith vs Microservices (MMD-01/06-skills.md)
- Manage Module Dependencies (MMD-09/06-skills.md)
- Handle Cross-Module Data Access (MMD-10/06-skills.md)
- Apply Strangler Fig Pattern (DBC-10/06-skills.md)

## Success Criteria
- Module is successfully running as an independent microservice with its own database.
- All consumers have been migrated from monolith module to new service.
- The monolith module code has been removed.
- Rollback is possible via feature flags during the transition period.
