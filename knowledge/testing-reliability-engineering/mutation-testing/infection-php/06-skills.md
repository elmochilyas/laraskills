# Skill: Run Mutation Tests with Infection PHP

## Purpose
Use Infection PHP to automatically introduce code mutations and verify that your test suite detects them, measuring test quality and identifying untested code paths.

## When To Use
- When you want to measure test suite effectiveness beyond code coverage
- Before a major refactoring to ensure critical logic is well-tested
- When code coverage is high but bugs still escape to production
- When establishing quality gates for CI pipelines
- When the team wants to improve testing practices

## When NOT To Use
- For test suites with very low coverage (<30%) — mutation testing is premature
- For CI on every commit — mutation testing is slow; run on schedule or merge
- For projects with no automated test suite
- For code that is already proven stable through production usage (risk/reward)

## Prerequisites
- PHP installed with `pcov` or `xdebug` for code coverage
- Infection PHP installed (`composer require --dev infection/infection`)
- Test suite that passes (mutation testing requires a baseline of passing tests)

## Inputs
- Configuration file (`infection.json` or `infection.json.dist`)
- PHPUnit/Pest configuration for test execution
- Mutators to enable or disable
- Minimum mutation score indicator (MSI) threshold

## Workflow
1. Install Infection: `composer require --dev infection/infection`
2. Generate initial configuration: `vendor/bin/infection --init`
3. Configure in `infection.json.dist`: source directories, mutators, MSI thresholds
4. Run mutation testing: `vendor/bin/infection --min-msi=80 --min-covered-msi=90`
5. Review the mutation report (`infection.html`) for surviving mutations
6. Focus on `Escaped` (surviving) mutants — these indicate missing test coverage
7. Write additional tests for each escaped mutant
8. Re-run Infection to verify new tests catch the mutations
9. Set up mutation testing in CI on a nightly or merge-to-main schedule

## Validation Checklist
- [ ] Infection is configured with correct source directories
- [ ] MSI threshold is set (80% recommended for production apps)
- [ ] Covered MSI threshold is set (90% for tested code)
- [ ] Mutators are configured (enable relevant, disable noisy ones)
- [ ] Infection report is reviewed for escaped mutants
- [ ] New tests are written for escaped mutants
- [ ] Mutation testing runs in CI (nightly or on merge to main)
- [ ] Team has a process for reviewing mutation reports

## Common Failures
- Mutation testing taking too long — use `--threads` for parallel execution
- High false-positive escapes — mutators that change behavior tests shouldn't cover
- Ignoring mutation reports — defeating the purpose of running it
- Setting MSI too high initially — start at 60% and increase gradually
- Not configuring mutators — default set includes irrelevant mutators

## Decision Points
- Full suite vs targeted scope — full for comprehensive assessment, targeted for specific modules
- Default mutators vs custom — default for general quality, custom for domain-specific patterns
- CI blocking vs advisory — blocking for covered MSI, advisory for overall MSI

## Performance Considerations
- Mutation testing is 10-50x slower than the normal test suite
- Use `--threads` with the number of available CPU cores
- Profile with `--profile` to identify slow mutators
- Run on a subset of files during development, full suite in CI
- Consider `--skip-initial-tests` after initial verification

## Security Considerations
- Mutation testing may mutate security-sensitive code — review security-related escapes manually
- Ensure auth, encryption, and authorization tests catch mutations
- Focus mutation testing on security-critical modules first
- Mutation test reports may expose security logic patterns — restrict report access

## Related Rules
- [Rule: Set MSI Thresholds Gradually](./05-rules.md)
- [Rule: Focus on Escaped Mutants, Not Coverage Percentage](./05-rules.md)
- [Rule: Run Mutation Testing on Nightly Schedule](./05-rules.md)

## Related Skills
- Pest Mutation Testing
- Code Coverage Enforcement
- CI/CD Pipeline Integration

## Success Criteria
- [ ] Infection runs successfully against the full test suite
- [ ] MSI is above the team's agreed threshold (aim for 80%+)
- [ ] Surviving mutants are reviewed and addressed
- [ ] Mutation testing runs on a regular schedule (nightly or weekly)
- [ ] Team tracks mutation score trends and addresses regressions
