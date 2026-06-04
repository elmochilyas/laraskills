# Rule: Run Architecture Tests As A Pre-Merge Gate In CI
---
## Category
Architecture | Reliability
---
## Rule
Always configure CI to run architecture tests on every pull request and block merges when architecture tests fail. Do not allow manual override of the failure.
---
## Reason
Architecture tests that do not block merges are optional and eventually ignored. A hard gate forces the developer to either fix the violation or change the rule deliberately, keeping the architecture intact.
---
## Bad Example
Architecture tests run in CI but the branch protection rules allow merging past failures. A developer merges a PR that adds an unauthorized import because "it was just one quick change."
---
## Good Example
```yaml
# Branch protection rule: "Architecture Tests" check is required
# CI job fails on violation, PR cannot merge
jobs:
  architecture:
    runs-on: ubuntu-latest
    steps:
      - run: vendor/bin/pest --arch
```
---
## Exceptions
None. Every architecture test failure must block the merge. If a rule is no longer valid, change it through the normal PR process.
---
## Consequences Of Violation
Architecture violations reach the main branch. The CI gate loses credibility. The codebase architecture degrades silently.

---
# Rule: Run Architecture Tests Early In The CI Pipeline
---
## Category
Architecture | Reliability
---
## Rule
Run architecture tests as one of the first jobs in the CI pipeline rather than after unit tests, integration tests, or deployment steps.
---
## Reason
Architecture tests are fast (1-5 seconds) and detect structural violations that make further testing pointless. Failing fast gives the developer feedback within minutes.
---
## Bad Example
CI pipeline runs linting, unit tests, feature tests, integration tests, and deployment preview before running architecture tests. The developer waits 20 minutes to learn their import violates a rule.
---
## Good Example
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
  architecture:
    runs-on: ubuntu-latest  # Runs in parallel with lint
    steps:
      - run: vendor/bin/pest --arch
  unit:
    needs: [lint, architecture]  # Waits for architecture to pass
    runs-on: ubuntu-latest
```
---
## Exceptions
None. Architecture tests have no dependencies and should run as early as possible.
---
## Consequences Of Violation
Developers waste CI time and context-switching cost. Slow feedback reduces the likelihood that violations are caught before the developer moves to another task.

---
# Rule: Run Architecture Tests In A Separate Parallel CI Job
---
## Category
Architecture | Reliability
---
## Rule
Always run architecture tests in a dedicated CI job separate from unit and feature tests rather than bundling them into the same test suite.
---
## Reason
Architecture tests have different dependencies and failure modes from functional tests. A separate job completes faster and fails independently. A failing feature test does not block architecture test results.
---
## Bad Example
```yaml
# Architecture tests mixed into the main test suite
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - run: vendor/bin/pest # Runs everything together
```
---
## Good Example
```yaml
jobs:
  architecture:
    runs-on: ubuntu-latest
    steps:
      - run: vendor/bin/pest --arch  # Runs separately, completes in seconds
  feature:
    runs-on: ubuntu-latest
    steps:
      - run: vendor/bin/pest --exclude-group=arch  # Main test suite
```
---
## Exceptions
Very small projects where total test time is under 30 seconds and architecture tests are trivial.
---
## Consequences Of Violation
Architecture test results are delayed by slower feature tests. Architecture failures are hidden among functional test failures.

---
# Rule: Baseline Existing Violations Before Introducing New Strict Rules
---
## Category
Architecture | Maintainability
---
## Rule
Always record a baseline of existing violations when introducing a new strict architecture rule to an existing codebase. Require that new code does not introduce new violations above the baseline.
---
## Reason
Applying strict rules retroactively to all existing code causes every PR to fail until legacy code is fixed. Developers become frustrated and disable the rules. A baseline allows incremental improvement.
---
## Bad Example
A new rule "Services must not use Models" is added. Every existing service that uses a model causes the CI to fail. All PRs are blocked. The team disables the rule.
---
## Good Example
```php
// Baseline: 12 existing services use Models directly
// Tracked in docs/architecture-baseline.md
test('Services must not use Models (new code)')
    ->expect('App\Services')
    ->not->toUse('App\Models')
    ->ignoring(function () {
        return [/* 12 baselined service classes */];
    });
```
---
## Exceptions
Greenfield projects with no existing code. The rule applies to all code from the start.
---
## Consequences Of Violation
All PRs fail due to existing violations. Developers disable the rule entirely. No new violations are caught.

---
# Rule: Document Exemptions Explicitly In A Reviewed File
---
## Category
Architecture | Maintainability
---
## Rule
Document every architecture rule exemption in a dedicated file (e.g., `docs/architecture-exemptions.md`) and review exemptions periodically. Never grant exemptions verbally or in chat.
---
## Reason
Verbal exemptions are forgotten. Slack decisions are lost. When exemptions are undocumented, future developers do not know why a violation exists and assume the rule does not apply.
---
## Bad Example
A senior developer tells a junior "this import is fine, we have an exception for it." No documentation exists. Three months later, no one remembers the exception and the pattern spreads.
---
## Good Example
```markdown
# docs/architecture-exemptions.md
## Exemptions for Service-to-Model Rule
| Class | Reason | Approved By | Date | Expiry |
|---|---|---|---|---|
| DataMapper | Legacy integration, pending extraction to Shared | Senior Dev | 2026-03-01 | 2026-09-01 |
```
---
## Exceptions
None. Every exemption is documented with an expiry or review date.
---
## Consequences Of Violation
Undocumented exemptions spread. Developers copy the pattern without understanding the rationale. The architecture rule becomes meaningless.

---
# Rule: Post Architecture Test Violation Details On Pull Requests
---
## Category
Architecture | Maintainability
---
## Rule
Always configure CI to post a comment on the pull request when architecture tests fail, including the specific violation details and the file that caused the failure.
---
## Reason
A generic "CI failed" message forces the developer to dig through logs to find the cause. Specific violation details in a PR comment provide immediate, actionable feedback.
---
## Bad Example
CI reports "Architecture tests failed" with no details. The developer must open the CI logs, scroll through output, and find the failing assertion.
---
## Good Example
```yaml
- run: vendor/bin/pest --arch --compact 2>&1 | tee arch-output.txt
- uses: actions/github-script@v6
  if: failure()
  with:
    script: |
      const fs = require('fs');
      const output = fs.readFileSync('arch-output.txt', 'utf8');
      // Post formatted violation details as PR comment
```
---
## Exceptions
None. Violation details reduce the time to fix and provide a record of what was violated.
---
## Consequences Of Violation
Developers spend time deciphering CI logs. Violation details are lost after the build completes. Repeated violations are not tracked.

---
# Rule: Track And Alert On Baseline Violation Degradation
---
## Category
Architecture | Reliability
---
## Rule
Monitor the count of architecture violations over time and fail CI if the violation count increases above the established baseline.
---
## Reason
A stable or decreasing violation count indicates healthy architecture enforcement. An increasing count signals that violations are outpacing fixes. Catching the trend early prevents runaway degradation.
---
## Bad Example
Violations are tracked quarterly by manual review. By the time the review happens, the violation count has doubled. No automated alert triggered during the quarter.
---
## Good Example
```yaml
- run: |
    COUNT=$(vendor/bin/pest --arch --fail-on-violation-count 2>&1 | grep -c 'FAIL')
    if [ "$COUNT" -gt "$BASELINE" ]; then exit 1; fi
  env:
    BASELINE: 15
```
---
## Exceptions
When a rule is deliberately relaxed (e.g., removing an exception list item), the baseline is updated intentionally via a PR.
---
## Consequences Of Violation
Gradual architecture erosion. Each individual violation seems small, but cumulatively the architecture becomes unrecognizable within months.

---
# Rule: Keep CI Secrets Out Of Architecture Test Output
---
## Category
Security
---
## Rule
Never expose CI tokens, API keys, or other secrets in architecture test output or failure messages.
---
## Reason
Architecture test output is visible in CI logs which may be accessible to team members and external collaborators. Secrets in logs create a security exposure.
---
## Bad Example
A custom architecture test rule reads a configuration file and outputs the database connection string in the failure message when a violation is detected.
---
## Good Example
Architecture tests only reference class names, namespaces, and file paths. All sensitive configuration is excluded from test output.
---
## Exceptions
None. Secrets must never appear in CI logs or test output.
---
## Consequences Of Violation
Credentials are exposed in CI logs. The CI environment must be rotated. A security incident is created.
