# Dependency Security — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Dependency Security (composer audit, Dependabot) |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. No composer audit in CI Pipeline
2. Ignoring Transitive Dependencies
3. Auto-Merging All Dependabot PRs
4. Not Committing composer.lock
5. Only Running composer audit Manually

---

## Repository-Wide Anti-Patterns

- **Adding `composer.lock` to `.gitignore`**: Removes auditability and creates unpredictable dependency resolution.
- **Never running `composer audit`**: No visibility into known CVEs in dependencies.
- **Pinning exact versions without ever updating**: Creates a growing backlog of known vulnerabilities.
- **Only scanning direct dependencies**: Misses vulnerabilities in nested packages.

---

## Anti-Pattern 1: No composer audit in CI Pipeline

### Category

Security

### Description

Not running `composer audit` as part of the CI/CD pipeline, so known vulnerabilities in dependencies are not detected before deployment.

### Why It Happens

`composer audit` is a relatively recent addition (Composer 2.4). Existing CI pipelines may not include it. Developers may not know the command exists or may not consider dependency scanning a CI requirement.

### Warning Signs

- CI pipeline runs tests and code style but no security audit step
- `composer audit` never appears in CI configuration
- No failure condition for known dependency vulnerabilities
- Dependencies have known CVEs that are not detected by any automated process

### Why Harmful

Dependency vulnerabilities are the most common attack vector in PHP applications. Without automated scanning in CI, known-vulnerable packages reach production silently. The window between CVE publication and your deployment is unbounded — the vulnerability may exist for months or years before someone notices.

### Consequences

- Known CVEs deployed to production undetected
- Compliance failure for supply chain security requirements
- Extended vulnerability window — months may pass before discovery
- Security audit findings for unpatched dependencies

### Alternative

Run `composer audit --format=json --no-dev` in CI on every pull request. Fail the pipeline when critical or high severity advisories are found.

### Refactoring Strategy

1. Add `composer audit` step to CI pipeline
2. Fail on critical/high severity, warn on medium/low
3. For existing projects, review and fix current advisories
4. Configure scheduled runs to catch newly disclosed vulnerabilities between pushes

### Detection Checklist

- [ ] `composer audit` runs in CI on every push
- [ ] CI fails on critical/high severity vulnerabilities
- [ ] All current advisories are resolved or documented as exceptions
- [ ] Scheduled audit runs detect new CVEs between pushes

### Related Rules

- Always Run composer audit in CI Pipeline (05-rules.md)

### Related Skills

- Audit Laravel Dependencies for Known Vulnerabilities (06-skills.md)

### Related Decision Trees

- composer audit vs Third-Party Scanner (07-decision-trees.md)

---

## Anti-Pattern 2: Ignoring Transitive Dependencies

### Category

Security

### Description

Only auditing direct dependencies (packages listed in `composer.json`) or dismissing advisories in transitive dependencies as "not our code."

### Why It Happens

Developers may run `composer audit --only-direct` or see an advisory in a nested package and assume it doesn't matter because they didn't choose to include it.

### Warning Signs

- Running `composer audit --only-direct` instead of the default full tree scan
- Dismissing advisories in transitive dependencies without evaluation
- `composer.json` has few packages but `composer.lock` has many — potential transitive issues
- Team says "we don't use that package directly, it's just a dependency"

### Why Harmful

`composer audit` scans the entire resolved dependency tree from `composer.lock`. A vulnerability in a package your dependency depends on (e.g., a logging library used by your HTTP client) is equally exploitable at runtime — it executes in the same PHP process with the same privileges. Attackers exploit transitive dependencies as an indirect attack vector.

### Consequences

- Known exploit paths via indirect dependencies ignored
- Compliance fails supply chain audit requirements
- Real vulnerabilities dismissed as "not our problem"
- Security incident from transitive dependency exploit

### Alternative

Audit the full dependency tree (default behavior of `composer audit`). Treat all advisories as actionable — the transitive dependency may be patched by updating the direct dependency.

### Refactoring Strategy

1. Stop using `--only-direct` flag
2. Run `composer audit` (full tree) in CI
3. When a transitive vulnerability is found, update the direct parent package
4. If no fix is available, document the exception with risk assessment

### Detection Checklist

- [ ] `composer audit` runs without `--only-direct` flag
- [ ] All advisories (direct and transitive) are evaluated
- [ ] Team does not dismiss transitive advisories as "not our code"
- [ ] No unpatched critical/high advisories in the full dependency tree

### Related Rules

- Never Ignore Transitive Dependency Vulnerabilities (05-rules.md)

### Related Skills

- Audit Laravel Dependencies for Known Vulnerabilities (06-skills.md)

### Related Decision Trees

- composer audit vs Third-Party Scanner (07-decision-trees.md)

---

## Anti-Pattern 3: Auto-Merging All Dependabot PRs

### Category

Maintainability

### Description

Configuring Dependabot or Renovate to auto-merge all dependency update PRs, including minor and major version bumps.

### Why It Happens

Teams want to minimize manual overhead. Auto-merging everything seems efficient — "if the tests pass, it should be fine."

### Warning Signs

- Dependabot config has `automerge: true` without version constraints
- Minor and major version updates merged without review
- Production incidents from breaking changes in auto-merged dependencies
- No distinction between patch, minor, and major in auto-merge policy

### Why Harmful

Patch updates (`x.y.Z`) are semver-compatible — they fix bugs or security issues without changing the public API. Minor (`x.Y.z`) and major (`X.y.z`) updates may introduce breaking changes, deprecations, or behavioral differences that require code changes, testing, and review. Auto-merging these without verification causes deployment failures and regression bugs.

### Consequences

- Breaking changes deployed without review
- Production incidents from behavioral changes
- Regression bugs from API changes in dependencies
- Rollback effort for auto-merged breaking updates

### Alternative

Configure auto-merge only for patch-level security updates. Require manual review for minor and major version bumps.

### Refactoring Strategy

1. Review Dependabot/Renovate configuration
2. Set auto-merge to patch-only: `"patch": { "automerge": true }`
3. Require manual PR review for minor and major updates
4. Add grouping for patch updates to reduce PR noise

### Detection Checklist

- [ ] Auto-merge is enabled only for patch updates
- [ ] Minor updates require manual review
- [ ] Major updates require manual review and testing
- [ ] No auto-merged updates have caused regressions
- [ ] Patch updates are grouped to reduce PR noise

### Related Rules

- Never Auto-Merge Minor or Major Dependency Updates (05-rules.md)

### Related Skills

- Audit Laravel Dependencies for Known Vulnerabilities (06-skills.md)

### Related Decision Trees

- Auto-Merge Policy for Dependency Updates (07-decision-trees.md)

---

## Anti-Pattern 4: Not Committing composer.lock

### Category

Code Organization

### Description

Adding `composer.lock` to `.gitignore` or not committing it to version control for an application project.

### Why It Happens

Tutorials sometimes suggest ignoring the lock file for libraries. This pattern is incorrectly applied to application projects where the lock file should always be committed.

### Warning Signs

- `.gitignore` contains `composer.lock`
- Different developers have different dependency versions
- CI resolves different versions than local development
- `composer audit` runs against a different dependency set than what is deployed

### Why Harmful

`composer.lock` pins exact dependency versions, including transitive dependencies. Without it, each deployment may resolve different transitive versions, creating a gap between audit results and production. The lock file determines what actually runs in production — auditing without it is meaningless.

### Consequences

- Unpredictable dependency resolution between environments
- CI audit checks wrong dependency set
- Deployed versions may differ from tested versions
- "Works on my machine" dependency issues
- No reliable audit trail for dependency versions

### Alternative

Always commit `composer.lock` to version control for application projects. Run `composer audit` against the committed lock file.

### Refactoring Strategy

1. Restore `composer.lock` from `.gitignore`
2. Run `composer install` to generate the lock file if missing
3. Commit the lock file
4. Verify CI uses the same dependency versions as local development

### Detection Checklist

- [ ] `composer.lock` is committed to version control
- [ ] `.gitignore` does not include `composer.lock`
- [ ] All environments use the same locked dependency versions
- [ ] `composer audit` runs against the committed lock file

### Related Rules

- Commit composer.lock and Audit Against It (05-rules.md)

### Related Skills

- Audit Laravel Dependencies for Known Vulnerabilities (06-skills.md)

### Related Decision Trees

- composer audit vs Third-Party Scanner (07-decision-trees.md)

---

## Anti-Pattern 5: Only Running composer audit Manually

### Category

Security

### Description

Running `composer audit` only on local development machines or on an as-remembered basis, not as an automated CI step.

### Why It Happens

Developers may audit dependencies during local development or before a deployment push. They may not have CI configured or may not view dependency scanning as critical.

### Warning Signs

- No CI step runs `composer audit`
- Developer says "I run it sometimes before deploy"
- No automated alert when a new CVE is published for a used package
- Known advisories exist but no process for tracking resolution

### Why Harmful

Manual auditing is forgotten. Developers skip it during pressure, on quick fixes, or when it's inconvenient. The CVE-to-patch window is entirely dependent on human memory. Automated CI scanning ensures every build is checked, and scheduled scans catch newly disclosed vulnerabilities between development periods.

### Consequences

- Known CVEs deployed when manual scan is forgotten
- Extended vulnerability window — no detection between manual scans
- No audit trail for dependency security review
- Compliance failure — no automated security scanning

### Alternative

Integrate `composer audit` into CI as a build step and configure Dependabot for automated PRs on security updates.

### Refactoring Strategy

1. Add `composer audit` to CI pipeline
2. Add `composer update --lock` before audit to refresh advisory cache
3. Configure Dependabot or Renovate for automated update PRs
4. Set up scheduled (cron) audit runs for projects with infrequent commits

### Detection Checklist

- [ ] `composer audit` runs automatically in CI
- [ ] No reliance on manual ad-hoc auditing
- [ ] Dependabot/Renovate configured for automated PRs
- [ ] Scheduled scans catch new CVEs between pushes
- [ ] Audit results are logged and reviewed

### Related Rules

- Always Run composer audit in CI Pipeline (05-rules.md)

### Related Skills

- Audit Laravel Dependencies for Known Vulnerabilities (06-skills.md)

### Related Decision Trees

- composer audit vs Third-Party Scanner (07-decision-trees.md)
