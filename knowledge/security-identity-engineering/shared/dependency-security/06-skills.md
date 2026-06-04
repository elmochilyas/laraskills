# Skill: Audit Laravel Dependencies for Known Vulnerabilities

## Purpose
Run `composer audit` and integrate dependency vulnerability scanning into CI to detect and remediate known security vulnerabilities in Laravel and third-party packages.

## When To Use
- Every Laravel project in CI/CD — run on every push
- Before deploying new package versions
- Scheduled scanning to detect newly disclosed vulnerabilities
- Compliance requirements for dependency security

## When NOT To Use
- As a complete security solution (complements, not replaces, other security tools)

## Prerequisites
- `composer` with `audit` command (Composer 2.4+)
- `composer.lock` committed to version control
- CI/CD pipeline

## Workflow
1. Run `composer audit` locally to check current dependencies
2. Integrate in CI: `composer audit` as a build step
3. Review each reported vulnerability: package, CVE, severity, fixed version
4. Update affected packages: `composer update <package> --with-dependencies`
5. If fix not available: evaluate risk, document exception, implement mitigations
6. Enable Dependabot or Renovate for automated dependency update PRs
7. Subscribe to security advisories for critical packages
8. Maintain a dependency exception list with documented rationale

## Validation Checklist
- [ ] `composer audit` runs in CI on every push
- [ ] All critical/high vulnerabilities remediated
- [ ] Medium/low vulnerabilities assessed and documented
- [ ] Dependabot/Renovate configured for automated updates
- [ ] Dependency exception list maintained with justifications
