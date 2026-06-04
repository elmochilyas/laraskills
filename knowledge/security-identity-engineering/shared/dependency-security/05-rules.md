# Domain: Security & Identity Engineering
# Subdomain: Additional Security Concerns

---

## Rule Name

Always Run composer audit in CI Pipeline

## Category

Security

## Rule

Run `composer audit --format=json --no-dev` in CI on every pull request and before every deployment. Fail the pipeline when critical or high severity advisories are found.

## Reason

Dependency vulnerabilities are the most common attack vector in PHP applications. `composer audit` checks the resolved dependency tree (including transitive dependencies) against the FriendsOfPHP security advisories database. Running it only locally or manually guarantees it will be forgotten, allowing known-vulnerable packages into production.

## Bad Example

```yaml
# CI pipeline without dependency audit
jobs:
  test:
    steps:
      - run: composer install
      - run: phpunit
      # No composer audit — vulnerabilities deployed silently
```

## Good Example

```yaml
- name: Dependency Security Audit
  run: |
    composer audit --format=json --no-dev | jq -e '
      if .advisories | length > 0 then
        error("Known vulnerabilities found in dependencies")
      else
        empty
      end
    '
```

## Exceptions

Projects without Composer-managed dependencies (non-PHP projects). For CI-first projects with no production deployment (e.g., documentation sites), severity thresholds may be relaxed.

## Consequences Of Violation

Security: Known CVEs deployed to production. Compliance: Fails supply chain security requirements.

---

## Rule Name

Commit composer.lock and Audit Against It

## Category

Code Organization

## Rule

Always commit `composer.lock` to version control. Never add it to `.gitignore`. Run `composer audit` against the committed lock file to ensure the audited dependency set matches what is deployed.

## Reason

`composer.lock` pins exact dependency versions, including transitive dependencies. The lock file determines what actually runs in production. Auditing `composer.lock` (not `composer.json`) ensures vulnerability scanning matches the deployed dependency tree. Without the lock file, each deployment may resolve different transitive versions, creating a gap between audit results and production.

## Bad Example

```
# .gitignore
/vendor/
composer.lock  # Do not ignore this
```

## Good Example

```
# .gitignore
/vendor/
# composer.lock must remain committed
```

## Exceptions

Libraries and packages published to Packagist should not commit `composer.lock` (it is ignored by the Packagist installer). Application projects must always commit it.

## Consequences Of Violation

Security: Audit checks wrong dependency set; deployed versions may contain unverified vulnerabilities. Reliability: Unpredictable dependency resolution between environments.

---

## Rule Name

Configure Automated Dependency Updates with Dependabot or Renovate

## Category

Maintainability

## Rule

Configure Dependabot (GitHub) or Renovate for the `composer` ecosystem on every Laravel project. Enable auto-merge for patch security updates only; require manual review for minor and major updates.

## Reason

Automated update tools continuously monitor for dependency updates and create pull requests when new versions are available. Without them, dependency updates rely on manual attention and are easily postponed, creating a growing backlog of known vulnerabilities. Patch updates are typically safe (semver-compatible bug/security fixes), while minor and major updates may introduce breaking changes.

## Bad Example

```yaml
# .github/dependabot.yml — overly permissive auto-merge
version: 2
updates:
  - package-ecosystem: "composer"
    directory: "/"
    schedule:
      interval: "weekly"
    # No distinction between patch, minor, major — all auto-merged
```

## Good Example

```yaml
version: 2
updates:
  - package-ecosystem: "composer"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    # Use Renovate or GitHub rules to auto-merge only patch updates
```

## Exceptions

Projects with zero direct Composer dependencies or read-only mirrors of upstream repositories.

## Consequences Of Violation

Security: Delayed patching of known vulnerabilities. Maintenance: Growing update backlog requiring urgent batch remediation.

---

## Rule Name

Never Ignore Transitive Dependency Vulnerabilities

## Category

Security

## Rule

Treat vulnerabilities in transitive (nested) dependencies with the same severity as direct dependency vulnerabilities. Do not dismiss them based on "not our code."

## Reason

`composer audit` scans the entire resolved dependency tree from `composer.lock`. A vulnerability in a package your dependency depends on (e.g., a logging library used by your HTTP client) is equally exploitable at runtime — it executes in the same PHP process with the same privileges. Attackers exploit transitive dependencies as an indirect attack vector.

## Bad Example

```bash
# Running audit on composer.json instead of lock file
composer audit --only-direct
# Misses nested vulnerabilities
```

## Good Example

```bash
# Correct — audits the full resolved dependency tree
composer audit --no-dev
# Every advisory is treated as actionable
```

## Exceptions

Dev-only transitive dependencies that are not installed in production (when using `composer install --no-dev`). These may be deprioritized but should still be tracked.

## Consequences Of Violation

Security: Known exploit paths via indirect dependencies ignored. Compliance: Fails supply chain security audit requirements.

---

## Rule Name

Keep Advisory Database Fresh Before Auditing

## Category

Maintainability

## Rule

Run `composer update --lock` before `composer audit` in CI to refresh the advisory database. Never audit against a stale advisory cache.

## Reason

The PHP Security Advisories database is updated continuously as new vulnerabilities are disclosed. Without refreshing the advisory cache, `composer audit` may report no vulnerabilities even though new advisories have been published. A stale cache gives a false sense of security.

## Bad Example

```yaml
# CI — advisory database may be days or weeks old
- run: composer audit
```

## Good Example

```yaml
- run: composer update --lock
- run: composer audit --format=json --no-dev
```

## Exceptions

CI environments where advisory cache is refreshed externally (e.g., via Docker image rebuild). In these cases, verify the cache age is less than 24 hours.

## Consequences Of Violation

Security: False-negative audit results; newly published CVEs go undetected. Compliance: Fails to meet vulnerability monitoring SLAs.

---

## Rule Name

Scan Container Images for OS-Level Vulnerabilities

## Category

Security

## Rule

When deploying Laravel in Docker containers, supplement `composer audit` with container image scanning (Docker Scout, Trivy, Snyk). Never rely solely on `composer audit` for deployment security.

## Reason

`composer audit` only scans PHP Composer packages. OS-level packages (PHP runtime, libxml, OpenSSL, libcurl) installed via `apt`, `yum`, or base images are outside its scope. Vulnerabilities in these packages (e.g., a buffer overflow in libpng, an SSL/TLS vulnerability in OpenSSL) are equally exploitable at runtime and are not detected by Composer auditing.

## Bad Example

```yaml
# Assuming composer audit covers all runtime attack surface
- run: composer audit
- run: docker build -t app .
```

## Good Example

```yaml
- run: composer audit
- run: docker scout quick
- run: docker build -t app .
```

## Exceptions

Deployments on fully managed platforms (Laravel Vapor, Forge with managed runtimes) where the platform provider handles OS-level patching.

## Consequences Of Violation

Security: OS-level vulnerabilities deployed undetected. Compliance: Fails container security scanning requirements.

---

## Rule Name

Never Auto-Merge Minor or Major Dependency Updates

## Category

Maintainability

## Rule

Configure automated dependency tools to auto-merge only patch-level security updates. Always require human review for minor and major version bumps.

## Reason

Patch updates (x.y.Z) are semver-compatible — they fix bugs or security issues without changing the public API. Minor (x.Y.z) and major (X.y.z) updates may introduce breaking changes, deprecations, or behavioral differences that require code changes, testing, and review. Auto-merging these without verification causes deployment failures and regression bugs.

## Bad Example

```yaml
# Renovate/Dependabot config — all updates auto-merged
"automerge": true
```

## Good Example

```yaml
# Auto-merge only patch updates
"patch": { "automerge": true }
"minor": { "automerge": false }
"major": { "automerge": false }
```

## Exceptions

Projects with 100% test coverage and comprehensive integration tests may extend auto-merge to minor updates after a mandatory review period.

## Consequences Of Violation

Reliability: Breaking changes deployed without testing. Maintenance: Debugging regressions caused by unverified dependency updates.
