# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Additional Security Concerns
**Knowledge Unit:** Dependency Security (composer audit, Dependabot)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | composer audit vs Third-Party Scanner | Dependency vulnerability scanning tool selection | coverage, integration |
| 2 | Auto-Merge Policy for Dependency Updates | How to handle Dependabot/Renovate PRs | safety, automation |

---

# Architecture-Level Decision Trees

---

## composer audit vs Third-Party Scanner

---

## Decision Context

Whether to rely solely on `composer audit` for dependency vulnerability scanning or supplement with a commercial scanner (Snyk, Sonatype, GitHub Advisory).

---

## Decision Criteria

* coverage
* integration

---

## Decision Tree

Is `composer audit` already running in CI?
↓
YES → Good. Now evaluate: is the project subject to compliance requirements?
NO → Start with `composer audit` (free, built-in, covers PHP Security Advisories database)

Does the project have compliance requirements (SOC 2, PCI, FedRAMP)?
↓
YES → Add a commercial scanner (Snyk/Sonatype) for SLAs, more databases, license compliance
NO → `composer audit` is likely sufficient for PHP dependencies

Are non-PHP dependencies used (Docker images, Node packages, system libraries)?
↓
YES → Need container scanner (Trivy, Docker Scout) + npm audit + composer audit
NO → `composer audit` covers all PHP dependencies

Is license compliance required?
↓
YES → Commercial scanner needed (composer audit does not check license compatibility)
NO → `composer audit` is sufficient for vulnerability detection

What is the budget for security tools?
↓
None → composer audit (free) + Dependabot (free for public repos)
Limited → composer audit + Dependabot + npm audit (for JS deps)
Generous → All of the above + Snyk/Sonatype

---

## Rationale

`composer audit` covers the PHP Security Advisories database, which is the authoritative source for PHP package vulnerabilities. For most Laravel projects, this is sufficient. Third-party scanners add value through: broader vulnerability databases (NVD, GitHub, their own research), license compliance scanning, container image scanning, and SLA-backed support for compliance. The decision is primarily driven by compliance requirements and budget.

---

## Recommended Default

**Default:** `composer audit` in CI pipeline (fail on critical/high) + Dependabot for automated PRs; add container scanning (Trivy) for Docker deployments; add commercial scanner (Snyk/Sonatype) only if compliance requires it
**Reason:** `composer audit` is free, fast, built-in, and covers the authoritative PHP vulnerability database. Commercial scanners are expensive and rarely catch PHP-specific vulnerabilities that `composer audit` misses. The exception is container scanning, which covers non-PHP attack surfaces.

---

## Risks Of Wrong Choice

- No dependency scanning: known CVEs deployed to production silently
- Only third-party scanner, no composer audit: may miss PHP-specific advisories in FriendsOfPHP database
- No container scanning: OS-level vulnerabilities undetected in Docker images
- Running composer audit without CI: manual scans are forgotten

---

## Related Rules

- Always Run composer audit in CI Pipeline (05-rules.md)
- Commit composer.lock and Audit Against It (05-rules.md)
- Keep composer.lock Up to Date with Security Patches (05-rules.md)

---

## Related Skills

- Audit Laravel Dependencies for Known Vulnerabilities (06-skills.md)

---

## Auto-Merge Policy for Dependency Updates

---

## Decision Context

Determining which Dependabot/Renovate update PRs should be auto-merged and which require manual review.

---

## Decision Criteria

* safety
* automation

---

## Decision Tree

What type of dependency update is it?
↓
Security patch (`CVE-*`) → Auto-merge if patch-only (no API changes)
Minor version update → Manual review (may include breaking changes in practice)
Major version update → Always manual review (breaking changes expected)

Does the project have comprehensive test coverage (>80%)?
↓
YES → Auto-merge more aggressively (tests catch regressions)
NO → Manual review all updates (cannot trust automated safety)

Is the dependency in the critical path?
↓
Direct dependency → Manual review preferred (changes affect application behavior)
Dev dependency → Auto-merge acceptable (lower risk to production)
Transitive dependency → Auto-merge patch/minor

Are patch updates grouped?
↓
YES → Lower PR noise, easier to review as a batch
NO → Consider grouping via Renovate to reduce review burden

---

## Rationale

Patch updates for security fixes should always be auto-merged — the risk of a known CVE in production outweighs the risk of a regression from a patch-level update. Minor version updates require review because they often include behavioral changes. Major version updates always require manual review for breaking changes. Test coverage is the enabling factor for aggressive auto-merge — without tests, no automation is safe.

---

## Recommended Default

**Default:** Auto-merge security patch updates (all packages); auto-merge patch and minor for dev dependencies; manual review for minor/major direct dependency updates; group patches weekly to reduce PR noise
**Reason:** Security patches must reach production quickly. Patch updates are statistically very low risk. Minor/major changes often require application-level adjustments and must be reviewed. Grouping reduces the review burden from 10+ individual PRs to 1-2 group PRs per week.

---

## Risks Of Wrong Choice

- Auto-merge all: breaking change reaches production without review
- Manual merge all: security patch delayed by days/weeks waiting for review
- No grouping: development team overwhelmed by daily Dependabot PRs, starts ignoring them
- Auto-merge without test coverage: regression goes unnoticed until production incident

---

## Related Rules

- Automate Dependency Updates with Dependabot or Renovate (05-rules.md)
- Keep composer.lock Up to Date with Security Patches (05-rules.md)

---

## Related Skills

- Audit Laravel Dependencies for Known Vulnerabilities (06-skills.md)
