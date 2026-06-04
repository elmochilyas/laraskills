# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Dependency Security (composer audit, Dependabot) |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Dependency security in Laravel relies on `composer audit` (built-in since Composer 2.4) and automated tools like Dependabot (GitHub) or Renovate. `composer audit` checks your `composer.lock` against the PHP Security Advisories Database for known vulnerabilities. Dependabot automatically creates PRs when vulnerable dependencies are detected. The primary practice: run `composer audit` in CI, fail the pipeline on known vulnerabilities, and use Dependabot/Renovate for automated patch updates.

---

## Core Concepts

- **composer audit**: Reads `composer.lock`, checks each package against FriendsOfPHP/security-advisories database, reports known vulnerabilities with CVE references.
- **PHP Security Advisories Database**: Open-source database of known vulnerabilities in PHP packages. Maintained by FriendsOfPHP.
- **Dependabot**: GitHub-native tool that monitors dependencies and creates PRs when updates are available, specifically tagging security updates with priority.
- **Transitive Dependencies**: Vulnerability scanning must check the lock file, not `composer.json` — vulnerabilities often live in deeply nested dependencies.

---

## When To Use

- Every Laravel project from day one — dependency scanning is a baseline security practice
- CI/CD pipeline integration to block vulnerable dependencies from reaching production

## When NOT To Use

- For projects without Composer dependency management (non-PHP projects)

---

## Best Practices

- **Run in CI**: `composer audit --format=json` in CI pipeline. Fail the build on critical/high severity advisories.
- **Automate Updates**: Configure Dependabot or Renovate for automated security patch PRs. Auto-merge patch updates with thorough test coverage.
- **Scan Transitive Dependencies**: `composer audit` checks all resolved dependencies — do not assume only direct dependencies matter.
- **Keep Advisory Database Fresh**: Run `composer update --lock` periodically to refresh the advisory cache.

---

## Architecture Guidelines

- Run `composer audit --no-dev` for production deployments (dev dependencies are not needed at runtime)
- Block CI on critical/high severity, warn on medium, investigate low per-case
- Supplement with third-party scanners (Snyk, Sonatype) for license compliance and extended checks

---

## Performance Considerations

- `composer audit` runs in <1 second for most projects
- Dependabot runs are free for public repos, included in GitHub Actions minutes for private repos

---

## Security Considerations

- **Dependency as Attack Surface**: Every package included is an attack surface. A vulnerability in a deeply nested dependency is as dangerous as a direct dependency.
- **Zero-Day Window**: The window between vulnerability disclosure and your deployment is your exposure window. Automated Dependabot PRs minimize this window.
- **Container Scanning**: If running in Docker, also scan the base image (`docker scout`, `trivy`). PHP runtime and OS packages are outside `composer audit`'s scope.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only auditing direct dependencies | Assuming vulnerabilities are in first-level packages | Misses vulnerabilities in transitive dependencies | Let `composer audit` scan the full dependency tree |
| Not running audit in CI | Manual scanning is forgotten | Vulnerable dependencies reach production | Run `composer audit` in every CI pipeline |
| Ignoring dev dependency results | Assuming "it's just dev" | Compromised dev tools can steal credentials | Scan all dependencies or use `--no-dev` for production |
| Not syncing composer.lock | Lock file out of sync with deployed packages | Audit checks wrong set of packages | Ensure CI runs `composer install` before audit |

---

## Anti-Patterns

- **Adding `composer.lock` to `.gitignore`**: Pins dependency versions but removes auditability
- **Pinning exact versions without updating**: Creates a growing backlog of known vulnerabilities
- **Auto-merging all Dependabot PRs**: Patch auto-merge is safe; minor/major need review for breaking changes

---

## Examples

**CI pipeline audit (GitHub Actions):**
```yaml
- name: Check for vulnerabilities
  run: |
    composer audit --format=json --no-dev | jq -e '
      if .issues | length > 0 then
        error("Vulnerabilities found")
      else
        empty
      end
    '
```

**Dependabot configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "composer"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## Related Topics

- Enlightn static/dynamic security analysis
- Laravel-Shield security scanning CLI
- CI/CD pipeline basics
- Composer dependency management

---

## AI Agent Notes

- When auditing a Laravel project's security, always check if `composer audit` runs in CI. If not, this is a high-priority recommendation.
- Dependabot configuration should be in the project root. If missing, suggest adding it.
- For projects with 50+ dependencies, recommend grouping minor updates via Renovate to reduce PR noise.

---

## Verification

- [ ] `composer audit` runs in CI/CD pipeline
- [ ] CI fails on critical/high severity vulnerabilities
- [ ] Dependabot or Renovate configured for `composer` ecosystem
- [ ] Auto-merge enabled only for patch updates
- [ ] Container image scanning configured (if Docker-based deployment)
- [ ] `composer.lock` committed to version control
- [ ] Advisory database refreshed regularly (`composer update --lock`)
