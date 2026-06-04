# Skill: Configure CI Enforcement of Architecture Rules as Pre-Merge Gate

## Purpose
Run architecture tests in CI on every PR as a pre-merge gate. Run early in the pipeline (fail fast) in a separate parallel job. Baseline existing violations when introducing new strict rules. Document exemptions explicitly in a reviewed file. Post violation details on PRs. Track and alert on baseline degradation.

## When To Use
- Any project with defined architecture rules
- Teams where architecture violations have been a recurring issue

## When NOT To Use
- Experimental/prototype codebases where architecture is intentionally fluid

## Prerequisites
- Architecture tests defined (AEG-01)
- CI/CD pipeline configured (COS-12)

## Inputs
- CI platform configuration
- Architecture test suite
- Existing violation baseline

## Workflow
1. **Run architecture tests as a pre-merge gate in CI.** Configure CI to block merges on architecture test failures. No manual override of the failure.

2. **Run architecture tests early in the CI pipeline.** Architecture tests are fast (1-5 seconds) and detect structural violations early. Run as one of the first jobs.

3. **Run architecture tests in a separate parallel CI job.** Separate from unit/feature tests. A separate job completes faster and fails independently.

4. **Baseline existing violations before introducing new strict rules.** Record existing violations as a baseline. Require new code to not introduce new violations above the baseline.

5. **Document exemptions explicitly in a reviewed file.** Every architecture rule exemption goes in a dedicated file with reason, approver, and expiry date.

6. **Post architecture test violation details on pull requests.** Configure CI to post a comment with specific violation details and the file that caused the failure.

7. **Track and alert on baseline violation degradation.** Monitor the count of architecture violations over time. Fail CI if the violation count increases above the established baseline.

8. **Keep CI secrets out of architecture test output.** Never expose CI tokens, API keys, or other secrets in test output or failure messages.

## Validation Checklist
- [ ] Architecture tests run in CI on every PR
- [ ] CI blocks merges on architecture test failure
- [ ] Architecture tests run early in CI pipeline (fail fast)
- [ ] Architecture tests run in separate parallel CI job
- [ ] Baseline exists for existing violations
- [ ] Exemptions are documented and reviewed
- [ ] PR comments include violation details on failure
- [ ] Baseline violation degradation is tracked and alerted

## Common Failures
- **Architecture tests not in CI.** Tests exist locally but are never run — violations never caught.
- **Ignoring CI failures.** PR merged despite failing architecture tests — tests become noise.
- **No baseline for legacy code.** Strict rules applied retroactively — all PRs fail.

## Decision Points
- **Baseline now or strict from start?** Greenfield: strict from start. Brownfield: baseline existing violations, require no new violations.

## Performance Considerations
- Architecture tests: 1-5 seconds for 50-100 tests. Negligible in CI.

## Security Considerations
- CI tokens and secrets must not be exposed in architecture test output.

## Related Rules
- Rule: Run Architecture Tests As A Pre-Merge Gate In CI (AEG-02/05-rules.md)
- Rule: Run Architecture Tests Early In The CI Pipeline (AEG-02/05-rules.md)
- Rule: Run Architecture Tests In A Separate Parallel CI Job (AEG-02/05-rules.md)
- Rule: Baseline Existing Violations Before Introducing New Strict Rules (AEG-02/05-rules.md)
- Rule: Document Exemptions Explicitly In A Reviewed File (AEG-02/05-rules.md)
- Rule: Post Architecture Test Violation Details On PRs (AEG-02/05-rules.md)
- Rule: Track And Alert On Baseline Violation Degradation (AEG-02/05-rules.md)

## Related Skills
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Configure Static Analysis Rules (AEG-03/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)
- Implement Drift Detection (AEG-08/06-skills.md)

## Success Criteria
- Architecture tests run on every PR in CI as a required pre-merge gate — no merges past failures.
- Tests run early (first jobs) and in a separate parallel job from feature tests.
- Existing codebase has a recorded baseline; new code must not introduce violations above baseline.
- All exemptions are documented in a reviewed file with expiry dates.
- PR comments include specific violation details (file, type, line).
- CI fails if violation count exceeds the established baseline.
