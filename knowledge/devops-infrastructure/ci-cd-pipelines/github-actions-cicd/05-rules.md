# Rules: GitHub Actions CI/CD

## GHA-001: Pin Action Versions
**Condition:** GitHub Actions workflow uses marketplace actions
**Action:** Pin to exact major version tag (e.g., `@v4`), not `@main`
**Rationale:** Branch references silently pull breaking changes
**Consequences:** Violation causes workflow failures on action maintainer updates

## GHA-002: Cache Dependencies
**Condition:** Workflow runs Composer install or npm ci
**Action:** Cache `~/.composer/cache` and `~/.npm` with lock file hash keys
**Rationale:** Uncached dependency installation is the longest workflow step
**Consequences:** Violation doubles or triples workflow execution time

## GHA-003: Secrets Never in Files
**Condition:** Workflow requires API keys or tokens
**Action:** Store in GitHub Secrets, reference via `${{ secrets.NAME }}`
**Rationale:** Workflow files are visible to all users with repository access
**Consequences:** Violation exposes production credentials in plain text

## GHA-004: Matrix Testing Required
**Condition:** Laravel workflow tests application
**Action:** Use matrix strategy covering PHP 8.2, 8.3, 8.4
**Rationale:** Version-specific issues are not detected in single-version tests
**Consequences:** Violation allows PHP version incompatibilities to reach production

## GHA-005: Fork-Safe Triggers
**Condition:** Workflow triggered by pull_request
**Action:** Use `pull_request` trigger (not `pull_request_target`) for untrusted forks
**Rationale:** `pull_request_target` runs in base branch context with secret access
**Consequences:** Violation allows fork PRs to exfiltrate repository secrets
