# Skill: Enforce the Dependency Rule in Laravel

## Purpose
Ensure source code dependencies point inward — outer layers depend on inner layers, never the reverse — by establishing a dependency graph, configuring PSR-4 autoloading, and automating enforcement with architecture tests.

## When To Use
- Any multi-layer architecture (three-layer, Clean, Hexagonal)
- When refactoring from flat Laravel structure to layered architecture
- Onboarding new team members to architectural conventions

## When NOT To Use
- Single-layer (flat) codebase with no architectural separation
- When no layer structure is defined yet — define layers first

## Prerequisites
- Defined layer structure (directories/namespaces)
- PSR-4 autoloading in `composer.json`
- Pest architecture testing library

## Inputs
- Defined layer directory structure
- List of existing dependency violations
- Team conventions on layer boundaries

## Workflow
1. **Document the explicit dependency map.** Create a text/comment map showing each layer and what it can depend on: Presentation → Application → Domain, Infrastructure → Application + Domain, Application → Domain only, Domain → nothing external.

2. **Configure PSR-4 autoloading per layer.** Add multiple PSR-4 roots in `composer.json` (e.g., `"App\\Presentation\\"`, `"App\\Application\\"`, `"App\\Domain\\"`). Run `composer dump-autoload`.

3. **Scan and catalog existing violations.** Use Pest `arch()` or grep to find current violations — Domain importing `DB::`, Application importing `Request`. Create a baseline list.

4. **Write architecture test for each dependency direction.** For each layer pair, write an architecture test that the outer layer may import the inner, but inner may NEVER import outer. Include tests for:
   - Domain imports nothing from Laravel or other layers
   - Application imports only Domain
   - Presentation imports only Application and Domain
   - Infrastructure imports Application and Domain (but not Presentation)

5. **Set up CI enforcement.** Add architecture tests to the CI test suite. Fail the build on any violation.

6. **Fix violations iteratively.** Prioritize fixing violations with test coverage immediately after test creation. Refactor in small, focused commits.

7. **Create a dependency whitelist only as a temporary measure.** For legacy code that cannot be fixed immediately, maintain a list of allowed exceptions with expiration dates. Remove exceptions as technical debt.

## Validation Checklist
- [ ] Dependency map is documented and team-accessible
- [ ] Architecture tests exist for each layer pair
- [ ] CI fails if any architecture test fails
- [ ] All current violations are cataloged and have remediation plans
- [ ] New code is reviewed for arch() test compliance
- [ ] No circular dependencies exist between layers

## Common Failures
- **Circular dependency:** Two layers depending on each other. Split or merge the offending code.
- **Testing too late.** Writing architecture tests only when violations are already entrenched. Write early.
- **Ignoring facade calls.** `\Cache::get()` in Domain is a dependency violation even without imports.
- **Whitelist creep.** Temporary exceptions become permanent. Use expiration dates on whitelist entries.
- **Partial enforcement.** Only testing some layers, leaving gaps. Test every layer pair.

## Decision Points
- **Strict vs Relaxed enforcement?** Start strict; relax only with explicit, reviewed exceptions. Prefer refactoring over relaxing.
- **Framework facades in Domain?** Never — facades are Laravel-specific and violate the Dependency Rule. Use interfaces.

## Performance Considerations
- Architecture tests run only in CI, not in production — zero performance impact.
- Autoloading configuration does not affect runtime performance meaningfully.
- Octane compatibility requires dependency graphs to be stateless — no circular references in constructor injection.

## Security Considerations
- Enforcing dependency direction prevents security logic in the wrong layer (e.g., authorization in Domain).
- Security adapters should follow the same dependency rules as other infrastructure.

## Related Rules
- Rule: Document Dependency Graph (LAP-04/05-rules.md)
- Rule: PSR-4 Autoloading Per Layer (LAP-04/05-rules.md)
- Rule: Write Architecture Tests for Every Layer Pair (LAP-04/05-rules.md)
- Rule: Enforce Dependency Rule in CI (LAP-04/05-rules.md)
- Rule: No Circular Dependencies Between Layers (LAP-04/05-rules.md)
- Rule: Framework Calls in Domain Is Violation (LAP-04/05-rules.md)
- Rule: Whitelist Exceptions Temporarily (LAP-04/05-rules.md)

## Related Skills
- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
- Configure PSR-4 Autoloading for Multi-Layer Projects (LAP-05/06-skills.md)

## Success Criteria
- Architecture tests exist for every layer pair and pass in CI.
- No inner layer imports from any outer layer.
- All current violations are documented with remediation plans.
- Dependency direction is verifiable by automated test, not manual review.
