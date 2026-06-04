# Skill: Implement Architecture Fitness Functions

## Purpose

Encode architectural rules as automated checks that run in CI to prevent architectural drift.

## When To Use

- Enforcing layer dependency direction (Domain must not depend on Infrastructure)
- Preventing circular dependencies between modules
- Ensuring services don't call Eloquent directly
- Verifying that architectural ADRs are reflected in code

## When NOT To Use

- Early prototypes where architecture is intentionally fluid
- When rules would produce excessive false positives
- For subjective style choices better handled by code review

## Prerequisites

- Static analysis tools (PHPStan, Deptrac, PHPArkitect)
- CI pipeline with ability to fail builds

## Inputs

- Architectural rules from ADRs and team conventions
- Module/layer definitions (namespaces, directories)
- Existing dependency graph of the codebase

## Workflow

1. Identify 3-5 high-value architectural rules to automate first
2. Define layer boundaries (Domain, Application, Infrastructure namespaces)
3. Write PHPStan custom rules or PHPArkitect assertions for each rule
4. Configure Deptrac for module-level dependency analysis
5. Add positive guidance rules (what to do) alongside negative rules (what not to do)
6. Run all checks in CI, blocking merges on failure
7. When ADRs change architecture, update fitness functions in the same PR
8. Incrementally add more rules as the team adapts

## Validation Checklist

- [ ] Critical architectural rules are enforced in CI, not just locally
- [ ] No false positives from outdated rules
- [ ] Fitness functions include positive guidance, not only prohibitions
- [ ] Rules incrementally introduced (start with 3-5)
- [ ] CI blocks pull requests on fitness function failure
- [ ] Fitness functions updated when architecture changes

## Common Failures

- Too many rules too early causing developer frustration
- Rules that don't reflect actual architecture (false positives)
- No CI enforcement (local-only checks are skipped)
- Only negative rules without positive structural guidance

## Decision Points

- Which 3-5 rules provide the most value first?
- How granular should module boundaries be?
- Fast vs thorough CI pipeline separation?

## Performance Considerations

- PHPStan analysis: ~10-60s depending on codebase size
- Deptrac analysis: ~5-30s
- Keep total CI architecture check time under 2 minutes

## Security Considerations

- Security-related architectural rules (no raw SQL in domain) can be fitness functions
- Ensure CI pipeline has restricted access to prevent rule bypass

## Related Rules (from 05-rules.md)

- Rule 1: Enforce every critical architectural rule as an automated fitness function in CI
- Rule 2: Start with 3-5 high-value fitness functions before adding more
- Rule 3: Keep fitness functions in sync with the actual architecture
- Rule 4: Include positive guidance rules, not only negative constraints
- Rule 5: Run fitness functions in CI, not just locally or on-demand

## Related Skills

- Perform Dependency Analysis
- Write an Architecture Decision Record
- Model Architecture with C4 Diagrams

## Success Criteria

- Architecture violations are caught before merge, not during production incidents
- Team can explain and maintain the fitness function suite
- False positive rate below 5%
