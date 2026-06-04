# Skill: Write Pest Architecture Tests for Custom Rules

## Purpose
Write custom architecture tests with Pest's `arch()` assertion to enforce project-specific naming conventions, directory structure, dependency rules, and code quality standards.

## When To Use
- When enforcing naming conventions (services end with `Service`, controllers have proper suffixes)
- When restricting dependencies (repositories should not depend on controllers)
- When ensuring directory structure (all DTOs in `app/DTOs/`)
- When enforcing framework conventions (no raw SQL in controllers)
- When maintaining layering boundaries (HTTP layer shouldn't depend on external APIs directly)

## When NOT To Use
- For testing behavior or runtime correctness (use feature tests)
- When the rules are subjective or frequently debated (use code review instead)
- As the only quality enforcement mechanism (combine with linting and code review)
- When the codebase is too small to benefit from formal architecture rules

## Prerequisites
- Pest installed with `pestphp/pest-plugin-arch`
- Defined project architecture conventions (documented or agreed upon)
- Understanding of `expect()` chaining: `toExtend()`, `toImplement()`, `toUse()`, `toBeFinal()`, etc.

## Inputs
- Architecture rules to enforce (naming, structure, dependencies)
- Target directories or classes to apply rules to
- Exceptions for valid deviations
- Layer boundaries to enforce

## Workflow
1. Define a project architecture convention document
2. Create architecture test files in `tests/Arch/` or use `test('rule description')->arch()->expect(...)`
3. Enforce naming: `expect('app/Services')->toHaveSuffix('Service')->classes()`
4. Enforce inheritance: `expect('app/Http/Controllers')->toExtend('App\Http\Controllers\Controller')->classes()`
5. Enforce dependency rules: `expect('app/Domain')->not->toUse('app/Infrastructure')`
6. Enforce final classes: `expect('app/Domain/ValueObjects')->toBeFinal()->classes()`
7. Add exceptions for valid cases: `->ignoring('app/Services/PaymentGatewayService')`
8. Group related rules into describe blocks
9. Run tests and fix violations iteratively

## Validation Checklist
- [ ] Naming conventions are enforced with `toHaveSuffix`, `toHavePrefix`, or matching patterns
- [ ] Inheritance/implementation requirements are enforced
- [ ] Directory structure is verified (classes in wrong directories are flagged)
- [ ] Layer boundaries are enforced (domain doesn't depend on infrastructure)
- [ ] Exceptions are documented and justified
- [ ] Architecture tests are part of CI
- [ ] Rules are reviewed when project architecture changes

## Common Failures
- Rules too broad — flag legitimate code patterns as violations
- Rules too narrow — miss meaningful violations
- Not updating rules — project evolves, rules become stale
- No documented exceptions — new team members don't know why something is ignored
- Architecture tests that take too long — optimize by targeting specific directories

## Decision Points
- `toExtend` vs `toImplement` — extend for class inheritance, implement for interface contracts
- Directory-scoped vs class-scoped rules — directory for broad patterns, class for specific enforcement
- Blocking vs warning — blocking for hard rules, warning for style preferences

## Performance Considerations
- Most architecture rules evaluate in <100ms
- Scanning large directories (`app/**`) adds analysis time
- Use specific directory targets rather than scanning the entire project
- Cache architecture test results in CI for faster feedback

## Security Considerations
- Enforce that security-related classes are final and immutable
- Verify that all controllers use authorization middleware
- Ensure repositories and services don't bypass authorization checks
- Block use of `eval()`, `exec()`, `shell_exec()` in application code

## Related Rules
- [Rule: Enforce Naming Conventions with Architecture Tests](./05-rules.md)
- [Rule: Enforce Layer Boundaries](./05-rules.md)
- [Rule: Review Rules When Architecture Changes](./05-rules.md)

## Related Skills
- Architecture Presets
- Pest Fundamentals
- Code Quality Automation

## Success Criteria
- [ ] All project naming conventions are enforced by architecture tests
- [ ] Layer boundaries are tested and enforced (domain ↔ infrastructure separation)
- [ ] Security-sensitive patterns (eval, exec) are blocked in application code
- [ ] Architecture tests run in <2 seconds in CI
- [ ] Exceptions are minimal, documented, and reviewed
