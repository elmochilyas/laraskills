# Skill: Run Security Scanning in CI

## Purpose
Configure automated security scanning in CI for Laravel projects including Composer audit, Dependabot alerts, and secret scanning to detect vulnerabilities early.

## When To Use
- Every Laravel project with external dependencies
- Projects handling user data, payments, or sensitive information
- Projects requiring compliance (PCI, HIPAA, SOC2)

## When NOT To Use
- Prototype projects with no real data or users
- Projects with no external dependencies

## Prerequisites
- `composer.lock` committed
- GitHub repository (for Dependabot and secret scanning)
- CI platform

## Inputs
- CI workflow file — `composer audit` step
- `.github/dependabot.yml` — Dependabot configuration
- GitHub repository settings — secret scanning

## Workflow

1. **Add Composer Audit to CI:** Add `composer audit` as a CI step (1-2 seconds). Fail the build if known vulnerabilities are found. This is the fastest and most effective built-in security check.

2. **Enable Dependabot Alerts:** Configure `.github/dependabot.yml` with `open-pull-requests-limit: 10` (security-only). Dependabot proactively creates fix PRs for vulnerable dependencies.

3. **Enable Secret Scanning:** Turn on GitHub secret scanning push protection in repository settings. This prevents commits containing known secret patterns (API keys, tokens, passwords).

4. **Configure Severity Thresholds:** Block on High+ severity vulnerabilities for standard projects. Block on all severities (including Low) for PCI/HIPAA projects.

5. **Define Remediation SLAs:** Set SLAs for vulnerability remediation: Critical < 24 hours, High < 72 hours, Medium < 2 weeks, Low < 1 month.

6. **Run Fast Scans in Main Pipeline:** Add `composer audit` to the main CI pipeline for fast feedback. Run deep scans (Dependabot) on a schedule.

7. **Scan All Dependencies Including Dev:** Vulnerabilities in dev tools (PHPStan, Pint, Rector) can be exploited if they have access to production systems.

## Validation Checklist

- [ ] `composer audit` runs in CI and fails on known vulnerabilities
- [ ] Dependabot configured with security-only scope
- [ ] Secret scanning push protection enabled
- [ ] Severity thresholds configured
- [ ] Remediation SLAs defined and communicated
- [ ] Dev dependencies included in scanning
- [ ] `composer.lock` committed for accurate scanning

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| `composer.lock` not committed | Scanners can't determine exact versions |
| Dependabot PR overload | Limit PRs; focus on security-only scanning |
| Dev dependencies excluded | Vulnerabilities in build tools exploited |
| No SLA for remediation | Vulnerabilities linger without action |

## Decision Points

- **Every Laravel project with external dependencies** needs vulnerability scanning
- **Skip for prototype projects** with no real data or users
- **Scan all dependencies including dev** — Vulnerabilities in dev tools can be exploited
- **Both Composer Audit and Dependabot:** Audit as CI gate; Dependabot for proactive fix PRs

## Performance/Security Considerations

- **Composer audit is fast:** 1-2 seconds; negligible CI impact
- **Secret scanning:** Prevents accidental credential commits; enable push protection
- **Remediation SLAs:** Critical < 24h; High < 72h; Medium < 2w; Low < 1mo

## Related Rules

- SECSCAN-RULE-001: Use Composer Audit in CI
- SECSCAN-RULE-002: Enable GitHub secret scanning push protection
- SECSCAN-RULE-003: Use both Dependabot and Composer Audit
- SECSCAN-RULE-004: Configure severity thresholds
- SECSCAN-RULE-005: Always commit composer.lock

## Related Skills

- Configure Dependency Update Automation
- Set Up Automated Testing in CI
- Set Up Automated Deployment Pipelines

## Success Criteria

- CI fails when `composer audit` detects known vulnerabilities
- Dependabot proactively creates fix PRs for vulnerable dependencies
- Secret scanning prevents accidental credential commits
- Vulnerabilities are remediated within defined SLAs
