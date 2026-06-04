# Skill: Incrementally Migrate from MVC to Layered Architecture
## Purpose
Migrate an existing Laravel MVC application to layered architecture (Clean/Hexagonal) incrementally using the Strangler Fig pattern — extracting services (Phase 1), isolating actions (Phase 2), introducing interfaces (Phase 3), and restructuring into layers (Phase 4) — stopping at any phase when cost exceeds benefit.
## When To Use
- Existing Laravel application growing beyond simple MVC with fat controllers
- Services becoming god objects with too many responsibilities
- Testing requires mocking but no abstraction layer exists
- Business logic is complex enough to warrant framework separation
## When NOT To Use
- Application is stable, not growing, and has no concrete architectural pain
- Team has no time or motivation for migration
- Simple CRUD with minimal business logic
- No concrete pain from current architecture
## Prerequisites
- Understanding of current architecture pain points (documented)
- Current migration phase decided and documented in MIGRATION.md
- Architecture test infrastructure (Pest arch tests or similar)
- Both old and new PSR-4 roots configured in composer.json
## Inputs
- Existing application codebase (controllers, models, services)
- List of pain points (fat controllers, slow tests, duplicated logic)
- Feature roadmap — which features will be touched next
- Team capacity for migration alongside feature work
## Workflow
1. Document current phase and target phase in MIGRATION.md — ensure all developers know which conventions to follow
2. **Phase 1 (Controller Thinning):** Extract business logic from controllers into Service classes — inject services into controllers, keep one service per domain concept
3. **Phase 2 (Action Isolation):** Break large Service classes into single-purpose Action classes — one public method per action, inject only what each action needs
4. Evaluate at Phase 2: does this solve the concrete pain? If yes, stop and document. If no, proceed.
5. **Phase 3 (Interface Introduction):** Add interface abstractions for infrastructure (repositories, mail, queue) where variation exists or testing requires mocking
6. **Phase 4 (Full Restructuring):** Move code into `src/Domain/`, `src/Application/`, `src/Infrastructure/` — enforce strict dependency rules with architecture tests
7. Use Strangler Fig: write NEW code in new structure; migrate EXISTING features when touched (Boy Scout Rule)
8. Create adapter classes to bridge old and new code — don't modify old code to match new patterns
9. Enforce new structure strictly from day one — architecture tests for new directories fail CI on violations
10. After each phase, evaluate cost/benefit: is the next phase justified by concrete pain?
## Validation Checklist
- [ ] Current migration phase documented in MIGRATION.md
- [ ] Old (app/) and new (src/) structures coexist with clear boundaries
- [ ] If Phase 1: Controllers delegate to Services (no business logic in controllers)
- [ ] If Phase 2: Services broken into single-purpose Action classes
- [ ] If Phase 3: Port interfaces exist for infrastructure where variation exists
- [ ] If Phase 4: Domain, Application, Infrastructure directories exist with arch tests
- [ ] Architecture tests enforce on new directories (old directories have relaxed rules)
- [ ] Adapter classes bridge old-new boundaries (no old code modified for new structure)
- [ ] Each feature migration includes equivalent or better test coverage
- [ ] Stopping point documented as intentional decision (not default half-state)
## Common Failures
- **Big-bang rewrite:** Migrating everything at once. Fix: use Strangler Fig — new code in new structure, old code stays.
- **Deciding Phase 4 on day one:** Full Clean Architecture before justifying complexity. Fix: stop at each phase and evaluate.
- **Permanent half-migration:** Stopped at Phase 2 but never documented the decision. Fix: write ADR with intentional stopping point and triggers for resuming.
- **Inconsistent enforcement:** Old patterns leaking into new directories. Fix: architecture tests on new directories from day one.
- **Feature Boy Scout Rule violation:** Fixing a bug in old feature without migrating it. Fix: migrate the feature when touching it.
## Decision Points
- **When to stop:** Phase 1 solves fat controllers. Phase 2 solves god objects. If these are the only pain points, stop here.
- **When to proceed to Phase 3:** Testing requires mocking but no abstraction exists. Need to swap infrastructure implementation.
- **When to proceed to Phase 4:** Need framework-independent testing, multiple delivery mechanisms, or the Domain is the primary application asset.
- **Old vs new parallelism:** Run both structures simultaneously with adapter bridging. Redirect old routes to new code gradually.
## Performance Considerations
- During migration, two structures coexist with different performance profiles
- Old pattern (Eloquent direct) is faster to write; new pattern (mapping layer) has slight overhead
- Adapter layer adds minimal indirection — usually <1ms per call
- No significant runtime performance difference for end users at any phase
## Security Considerations
- Migration does not change security boundaries — ensure access controls preserved during restructuring
- Verify authorization logic correctly ported when moving code between layers
- Old and new code share same authentication middleware and session handling
- Architecture tests should verify security rules are not bypassed in migrated code
## Related Rules (from 05-rules.md)
- Use Strangler Fig Pattern
- Stop at Any Phase When Cost Exceeds Benefit
- Migrate Feature-by-Feature
- Use Adapters as Glue
- Enforce New Structure Strictly From Day One
- Document Current Migration Phase
- No Big-Bang Rewrites
- Evaluate Stopping Point Consciously
## Related Skills
- Real-World Architecture Tradeoffs (LAP-14)
- Architecture Tests (LAP-13)
- Framework Independence Decisions (LAP-09)
- Controller Thinning (Presentation layer patterns)
## Success Criteria
- Migration phase is explicitly documented and known by all developers
- New code written in target architecture; old code left untouched until feature is touched
- Adapter classes bridge old and new without modifying old code
- Architecture tests pass for new directories; old directories have relaxed rules
- Each phase transition is an intentional, documented decision (not accidental drift)
