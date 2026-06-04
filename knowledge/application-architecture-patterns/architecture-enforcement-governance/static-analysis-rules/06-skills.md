# Skill: Configure Static Analysis Rules for Architecture Enforcement

## Purpose
Default to Pest architecture tests for structural rules. Use custom PHPStan rules only for type-level constraints Pest cannot express. Never duplicate rules across Pest and PHPStan. Integrate custom rules into CI. Use `spaze/phpstan-disallowed-calls` for forbidden classes/methods. Configure Larastan for framework-specific checks. Keep custom rules focused on high-value constraints.

## When To Use
- Constraints requiring AST-level analysis (type checks, method calls, class inheritance)
- Rules that Pest architecture tests cannot express

## When NOT To Use
- Structural constraints (namespace imports) — Pest architecture tests are simpler
- When simpler alternatives (Pest) cover the same rule

## Prerequisites
- Static analysis familiarity (COS-07)
- Architecture testing configured (AEG-01)

## Inputs
- Code constraints requiring AST analysis
- List of disallowed calls/classes

## Workflow
1. **Default to Pest architecture tests over custom PHPStan rules.** Pest tests are simpler, more readable, and sufficient for most import/namespace rules. Use PHPStan only for what Pest cannot express.

2. **Never duplicate rules across Pest and PHPStan.** Choose one enforcement mechanism per rule. Duplicate rules must be kept in sync — if one is missed, inconsistency creates confusion.

3. **Use static analysis for type-level architecture constraints.** PHPStan custom rules verify method return types, parameter types, interface implementation, and forbidden method calls.

4. **Integrate custom PHPStan rules into CI.** Run custom architecture rules as part of the static analysis step. Never rely on local-only execution.

5. **Use `spaze/phpstan-disallowed-calls` for forbidden classes and methods.** A declarative configuration eliminates custom PHPStan rules for simple disallowed-call scenarios.

6. **Check patterns, not specific class names, in custom rules.** Write rules that check architectural patterns (namespace, interface implementation, return type). Pattern-based rules survive refactoring.

7. **Configure Larastan for framework-specific architecture checks.** Enable Larastan in `phpstan.neon` for Eloquent, routes, facades, and other Laravel constructs.

8. **Keep custom PHPStan rules focused on high-value constraints.** Limit to architectural constraints that cannot be expressed in Pest tests. Avoid low-value cosmetic concerns.

## Validation Checklist
- [ ] Custom PHPStan rules exist for constraints Pest cannot express
- [ ] No duplication between PHPStan rules and Pest architecture tests
- [ ] Custom rules run in CI
- [ ] Larastan is configured for framework-specific checks
- [ ] Disallowed calls list is maintained
- [ ] Rules check patterns, not specific class names

## Common Failures
- **Redundant rules.** PHPStan rules duplicating Pest tests — maintenance overhead without value.
- **Rules too specific.** Rules checking specific class names — break on refactoring.
- **No CI integration.** Custom rules exist but are not enforced — forgotten.

## Decision Points
- **Pest vs PHPStan for a rule?** Structural/import: Pest. Type-level/return types/method calls: PHPStan. Never both.

## Performance Considerations
- Custom PHPStan rules add analysis time (seconds to minutes) depending on complexity.

## Security Considerations
- Static analysis does not handle runtime data. No security issues.

## Related Rules
- Rule: Default To Pest Architecture Tests Over Custom PHPStan Rules (AEG-03/05-rules.md)
- Rule: Never Duplicate Rules Across Pest And PHPStan (AEG-03/05-rules.md)
- Rule: Use Static Analysis For Type-Level Architecture Constraints (AEG-03/05-rules.md)
- Rule: Integrate Custom PHPStan Rules Into CI (AEG-03/05-rules.md)
- Rule: Use `spaze/phpstan-disallowed-calls` (AEG-03/05-rules.md)
- Rule: Check Patterns, Not Specific Class Names (AEG-03/05-rules.md)
- Rule: Configure Larastan For Framework-Specific Checks (AEG-03/05-rules.md)
- Rule: Keep Custom PHPStan Rules Focused On High-Value Constraints (AEG-03/05-rules.md)

## Related Skills
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)
- Implement Drift Detection (AEG-08/06-skills.md)

## Success Criteria
- Every architectural constraint uses exactly one enforcement mechanism — never duplicated.
- Pest architecture tests cover all structural/import rules.
- Custom PHPStan rules exist only for type-level constraints Pest cannot express.
- `spaze/phpstan-disallowed-calls` handles all simple disallowed-call scenarios.
- Larastan is configured for Eloquent/framework-specific checks.
- All custom rules run in CI and check architectural patterns, not specific class names.
