# Skill: Enforce Module Isolation with Automated Checks

## Purpose
Set up PHPStan custom rules, Pest architecture tests, and CI checks that enforce contract-only cross-module imports, database table ownership, and acyclic dependency graphs — making modular isolation real rather than aspirational.

## When To Use
- Every modular monolith from day one
- Introducing enforcement to an existing multi-module codebase

## When NOT To Use
- Single-module application (no cross-module violations possible)

## Prerequisites
- Module boundaries and structure established
- PHPStan installed with custom rules support
- Pest installed with architecture testing
- CI pipeline configurable

## Inputs
- Module directory structure
- Table prefix per module
- Current dependency declarations

## Workflow
1. **Enforce contract-only cross-module imports.** Create PHPStan custom rules or Pest architecture tests that modules may only import from other modules' Contracts/ namespace. Block imports from Services/, Models/, or other internal directories.

2. **Enforce database table ownership with PHPStan rules.** Register table prefixes per module. Create rules that detect SQL queries, Eloquent queries, or migration files referencing tables owned by other modules.

3. **Automatically detect and block circular dependencies.** Build a CI step that reads all `module.json` files, builds the dependency graph, runs topological sort, and fails if cycles exist.

4. **Make enforcement a required CI check.** The enforcement step must block PR merges. If it's allowed to fail, it will always fail and be ignored.

5. **Baseline existing violations when introducing enforcement.** Create a baseline of current violations. Only block NEW violations. Require the baseline to shrink over time (track trend).

6. **Allow explicit whitelisting with justification.** For rare legitimate exceptions, create a whitelist mechanism. Every entry requires a written justification and an expiration date.

7. **Do not rely on directory structure alone.** PHP has no module system — a class in `Modules/A/` can import from `Modules/B/` without restriction. Only static analysis + CI provides real enforcement.

## Validation Checklist
- [ ] PHPStan rules enforce contract-only cross-module imports
- [ ] PHPStan rules detect and flag cross-module database access
- [ ] CI block circular dependencies via dependency graph validation
- [ ] Enforcement is a required (not optional) CI step
- [ ] Existing violations are baselined with shrinking trend
- [ ] Whitelisted exceptions have justifications and expiration dates
- [ ] No cross-module imports from Services/, Models/, or other internal namespaces exist (outside whitelist)

## Common Failures
- **No enforcement.** Modular structure exists but anyone can import anything. Within months, modules are just folders.
- **Only testing one direction.** Testing layer isolation but missing cross-module import violations.
- **Over-relying on directory structure.** Assuming file location prevents imports — code provides no protection.

## Decision Points
- **Strict enforcement vs convention-based?** Start strict and relax if needed. Easier to start strict than to introduce enforcement later.
- **PHPStan custom rules vs Pest arch tests?** PHPStan for import-level checks; Pest for broader architectural assertions. Use both for defense in depth.

## Performance Considerations
- Enforcement runs offline (CI, local). Full dependency analysis adds 10-30s to CI. No runtime impact.

## Security Considerations
- Enforcement is architectural — no direct security implications. However, preventing unauthorized cross-module data access has security benefits.

## Related Rules
- Rule: Enforce From Day One (MMD-12/05-rules.md)
- Rule: Enforcement Must Be Required CI Check (MMD-12/05-rules.md)
- Rule: Baseline Existing Violations (MMD-12/05-rules.md)
- Rule: Enforce Contract-Only Imports (MMD-12/05-rules.md)
- Rule: Enforce Database Table Ownership (MMD-12/05-rules.md)
- Rule: Detect Circular Dependencies Automatically (MMD-12/05-rules.md)
- Rule: Whitelist Exceptions with Justification (MMD-12/05-rules.md)
- Rule: Don't Rely on Directory Structure (MMD-12/05-rules.md)

## Related Skills
- Manage Module Dependencies (MMD-09/06-skills.md)
- Write Architecture Tests (LAP-13/06-skills.md)
- Set Up Static Analysis Rules (AEG-03/06-skills.md)
- Configure CI Enforcement (AEG-02/06-skills.md)

## Success Criteria
- Cross-module imports are restricted to Contracts/ namespace and enforced by static analysis.
- Cross-module database queries are detected and blocked.
- CI validates dependency graph acyclicity on every PR.
- Existing violations are baselined with a shrinking trend line.
