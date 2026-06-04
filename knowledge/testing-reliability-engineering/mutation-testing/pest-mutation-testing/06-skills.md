# Skill: Integrate Mutation Testing with Pest

## Purpose
Configure and run Pest-specific mutation testing to measure test effectiveness by introducing code modifications and verifying that Pest tests correctly catch the introduced bugs.

## When To Use
- When using Pest as the project's test framework
- When you want Pest-optimized mutation testing configuration
- When using Pest's parallel execution features for faster mutation testing
- When Pest-specific features (higher-order tests, datasets) need mutation verification

## When NOT To Use
- When using PHPUnit (use standard Infection configuration)
- For projects without Pest installed (use standard Infection)
- When Pest's test structure (higher-order tests) makes mutation analysis unreliable
- For initial project setup — establish test suite first, then add mutation testing

## Prerequisites
- Pest test framework installed and configured
- Infection PHP installed (`composer require --dev infection/infection`)
- Passing test suite with Pest
- Pest parallel execution configured

## Inputs
- Pest configuration file and test structure
- Source directories to mutate
- Pest-specific test exclusions
- Mutation score thresholds

## Workflow
1. Install Infection: `composer require --dev infection/infection`
2. Configure `infection.json.dist` with Pest parallel execution settings
3. Set source directories: `"source": { "directories": ["app"] }`
4. Configure Pest-specific mutator exclusions (higher-order tests may trigger false positives)
5. Run initial mutation analysis: `vendor/bin/infection`
6. Review Pest-specific escaped mutants (higher-order tests may mask some mutations)
7. Write additional Pest tests for survival mutants
8. Optimize with `--threads` for parallel Pest execution
9. Set up CI integration with Pest's test runner

## Validation Checklist
- [ ] Infection is configured for Pest test execution
- [ ] Source directories target application code (not tests, config, or vendor)
- [ ] Pest parallel execution is enabled for faster runs
- [ ] Mutators are tuned to avoid Pest-specific false positives
- [ ] Mutation score is tracked and trended over time
- [ ] CI runs mutation testing on a scheduled basis (nightly)
- [ ] Team reviews mutation reports and writes tests for escapes

## Common Failures
- Mutation testing with Pest's parallel runner — conflicts with Infection's threading
- Higher-order tests masking mutations — Pest's expressive syntax may skip certain assertions
- False-positive escapes from Pest's dataset tests — multiple assertions may not all be verified
- Configuration mismatch between Pest and Infection — PHPUnit bridge configuration
- Running mutation tests on every CI commit — too slow; run nightly

## Decision Points
- Pest PHPUnit bridge vs native PHPUnit — Pest's bridge for accurate mutation analysis
- Full test suite vs parallel subsets — full for accuracy, parallel for speed
- Default mutators vs Pest-optimized — default for standard PHP, optimized for Pest's syntax

## Performance Considerations
- Mutation testing with Pest is 5-15x slower than parallel Pest test runs
- Pest's native parallelism conflicts with Infection's threading — use one or the other
- Speed optimization: use `--threads=8` with Infection, disable Pest parallelism
- Consider running mutation testing on a dedicated CI runner
- Profile slow tests with `--profile` before mutation testing

## Security Considerations
- Mutation testing may remove security checks — manually verify security-related mutations
- Pest-specific higher-order tests for security logic may not catch all mutations
- Ensure security-crucial code has explicit, direct test coverage (not just higher-order tests)
- Review escaped mutants in auth, encryption, and authorization code manually

## Related Rules
- [Rule: Handle Pest Higher-Order Tests in Mutation Analysis](./05-rules.md)
- [Rule: Tune Mutators for Pest Syntax](./05-rules.md)
- [Rule: Schedule Mutation Testing, Don't Block Every Commit](./05-rules.md)

## Related Skills
- Infection PHP
- Pest Fundamentals
- Code Coverage Enforcement

## Success Criteria
- [ ] Mutation testing runs successfully with Pest as the test runner
- [ ] Pest-specific false positives are identified and excluded
- [ ] Mutation score is above the team's threshold (80%+)
- [ ] Escaped mutants in security-critical code are reviewed manually
- [ ] Team tracks mutation score trends each sprint
