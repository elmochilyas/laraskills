# Experience Curation: Security Scanning

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/security-scanning
- **Maturity:** Mature
- **Related Technologies:** Dependabot, GitHub Security Advisories, Laravel Security, Composer Audit, NPM Audit, SAST
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Security scanning in CI refers to automated processes that detect security vulnerabilities in a Laravel application's dependencies, code, and configuration. For Laravel teams, security scanning covers: dependency vulnerability scanning (Composer audit, Dependabot, GitHub Advisory Database), static application security testing (SAST), secret detection (preventing accidental commits of API keys, database passwords, tokens), and container vulnerability scanning. The Laravel framework provides built-in security features (SQL injection prevention via Eloquent, XSS protection via Blade, CSRF tokens, password hashing, encryption), so security scanning focuses on proper usage of these features and identifying third-party dependency risks.

## Core Concepts
- **Composer Audit:** Laravel's built-in `composer audit` command (Composer 2.4+) that checks installed packages against the GitHub Advisory Database
- **Dependabot Alerts:** GitHub's automated vulnerability notification system; scans dependency manifests against the Advisory Database
- **SAST (Static Application Security Testing):** Automated code analysis scanning source code for security anti-patterns (SQL injection, XSS, command injection, hardcoded secrets)
- **Secret Scanning:** Automated detection of exposed secrets (API keys, tokens, passwords) in the repository's code and git history
- **GitHub Advisory Database:** A curated database of security advisories for open-source packages, used by Dependabot and Composer Audit
- **Security Scanner as Automated Pen Tester:** Continuously probes the codebase and dependencies for known vulnerabilities

## When To Use
- Every Laravel project with external dependencies (vulnerability scanning is essential)
- Projects handling user data, payments, or sensitive information
- Applications deployed to production that could be targeted by attackers
- Teams that want to catch security issues early in the development lifecycle
- Compliance-regulated projects (PCI, HIPAA, GDPR) that require automated security scanning

## When NOT To Use
- Prototype projects with no real data or users
- Projects that are never deployed to production
- Static sites built with Laravel (no user input, no sensitive data)

## Best Practices
- **WHY:** Use Composer Audit in CI (`composer audit`) as a fast, built-in check for known vulnerabilities in Composer dependencies; it runs in 1-2 seconds and blocks PRs with vulnerable packages
- **WHY:** Enable GitHub's secret scanning push protection to prevent commits with known secret patterns; this is the first line of defense against credential leaks
- **WHY:** Use both Dependabot (proactive fix PRs) and Composer Audit (reactive CI gate); Dependabot creates fix PRs, Composer Audit blocks PRs with vulnerabilities
- **WHY:** Configure severity thresholds appropriate for the project; block on High+ for standard projects; block on all severities for PCI/HIPAA-compliant projects
- **WHY:** Always commit composer.lock; security scanners need exact package versions to determine vulnerability status

## Architecture Guidelines
- **Composer Audit in CI Pattern:** Run `composer audit` as a CI step; fails build if known vulnerabilities are found in dependencies
- **NPM Audit in CI Pattern:** Run `npm audit --audit-level=high` to check NPM packages; fails only for high or critical severity
- **SAST GitHub Action Pattern (TruffleHog/Gitleaks):** Scan repository (including git history) for exposed secrets
- **Dependabot Security-Only Pattern:** Configure daily scanning with security label; limited PR count to focus on critical updates
- **GitHub Security Advisory Webhook Pattern:** Notify team via Slack when new security advisories affect the repository
- **Laravel Security Check Custom Pattern:** Custom scripts checking for common Laravel security misconfigurations
- **Dependency Scanning:** Use Dependabot (free, auto-PR) and Composer Audit (fast, CI-integrated)
- **Secret Scanning:** Use GitHub secret scanning (free, push-level) for first line of defense

## Performance
- Dependabot scan: 1-5 minutes (background, doesn't block CI). Composer audit: 1-2 seconds. Secret scan: 1-5 minutes. SAST scan: 2-20 minutes
- Secret scanning false positive rate: 1-5% (flags test keys, example strings). SAST false positive rate: 5-20%. Budget time for triaging
- Security scanning adds 2-30 minutes to CI pipeline; run fast scans (Composer audit) in main pipeline; run deep scans as scheduled workflows
- Laravel's architecture (Eloquent with parameterized queries, Blade's automatic XSS escaping) reduces attack surface compared to less opinionated frameworks

## Security
- Define SLAs for vulnerability remediation: Critical (<24 hours), High (<72 hours), Medium (<2 weeks), Low (<1 month)
- Configure notifications (Slack, email, PagerDuty) for Critical and High severity vulnerabilities
- For air-gapped environments, use Dependabot's vendoring feature or a private security advisory mirror
- Subscribe to Laravel security announcements (laravel.com/security) for zero-day vulnerabilities not yet in databases
- Implement defense in depth: CI scanning + WAF rules + runtime monitoring

## Common Mistakes

### No composer.lock committed
- **Description:** composer.lock is in .gitignore
- **Consequence:** Security scanners can't determine exact installed versions; they scan ranges, missing already-patched versions
- **Better Approach:** Always commit composer.lock; it's essential for security scanning

### Ignoring Dependabot PRs
- **Description:** Dependabot creates security update PRs but no one reviews or merges them
- **Consequence:** Repository remains vulnerable for weeks or months
- **Better Approach:** Set up notifications for security PRs; review and merge within SLA

### False positive fatigue
- **Description:** A secret scanner flags test API keys; team ignores all alerts
- **Consequence:** Real secrets in alerts are missed due to alert fatigue
- **Better Approach:** Suppress known false positives; triage alerts promptly; maintain a low false positive rate

### Scanning only production dependencies
- **Description:** Running composer audit only on require packages, not require-dev
- **Consequence:** Vulnerabilities in dev dependencies (PHPUnit, etc.) go undetected; can affect CI/CD pipelines
- **Better Approach:** Scan all dependencies including dev; vulnerabilities in dev tools can be exploited

### No .env scanning
- **Description:** Committed .env.example files contain real-looking secrets
- **Consequence:** Developers copy them and accidentally commit real secrets
- **Better Approach:** Use placeholder values in .env.example; scan repository for committed .env files

## Anti-Patterns
- **Security scanning as an afterthought:** Adding security scanning only after a breach; proactive scanning is cheaper
- **Blocking on all severities without triage:** High false positive rate from Low severity flags; team becomes desensitized
- **No vulnerability SLA:** Vulnerabilities sit unfixed for months because there's no timeline for remediation
- **Scanner-only security posture:** Relying solely on automated scanning without manual security review for critical changes
- **Ignoring Laravel-specific misconfigurations:** Debug mode in production, missing authorization gates, weak APP_KEY

## Examples
- **Laravel Framework:** Maintains security disclosure process (laravel.com/security); releases security patches monthly
- **Laravel Forge:** Server-level security scanning (automatic updates, firewall, fail2ban) complements CI scanning
- **Laravel Vapor:** Managed AWS infrastructure security (IAM roles, VPC isolation, Lambda security groups)
- **Composer Audit:** Built-in vulnerability scanning; introduced in Composer 2.4, replaces local-php-security-checker

## Related Topics
- dependency-update-automation (Dependabot complements security scanning)
- github-actions-for-laravel (CI platform for running security scans)
- automated-testing-in-ci (test suite validates security fixes)
- phpstan-in-ci (PHPStan can detect some security issues)
- laravel-security (Laravel's built-in security features)

## AI Agent Notes
- Composer's `audit` command (Composer 2.4+) queries the GitHub Advisory Database natively
- GitHub's secret scanning push protection prevents commits with known secret patterns
- Laravel's architecture reduces attack surface but misconfigurations remain common vulnerability sources
- The FriendsOfPHP/security-advisories database maintains 2000+ advisories for PHP packages
- For compliance projects, document scanning results and remediation timelines as audit evidence

## Verification
- [ ] Composer Audit is configured as a CI step
- [ ] Dependabot security alerts are enabled for the repository
- [ ] Secret scanning (GitHub push protection) is enabled
- [ ] composer.lock is committed (not in .gitignore)
- [ ] Vulnerability remediation SLAs are defined (Critical <24h, High <72h, etc.)
- [ ] Notifications are configured for Critical and High vulnerabilities
- [ ] All dependencies (including dev) are scanned
- [ ] False positives are documented and suppressed
- [ ] SAST scanning is configured for high-risk changes (if applicable)
- [ ] Application-level security checks (debug mode, APP_KEY, authorization) are included
