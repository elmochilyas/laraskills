# Knowledge Unit: Security Scanning

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/security-scanning
- **Maturity:** Mature
- **Related Technologies:** Dependabot, GitHub Security Advisories, Laravel Security, Composer Audit, NPM Audit, SAST

## Executive Summary

Security scanning in CI refers to automated processes that detect security vulnerabilities in a Laravel application's dependencies, code, and configuration. For Laravel teams, security scanning covers: dependency vulnerability scanning (Composer audit, Dependabot, GitHub Advisory Database), static application security testing (SAST tools that detect SQL injection, XSS, CSRF weaknesses in Laravel code), secret detection (preventing accidental commits of API keys, database passwords, and tokens), and container vulnerability scanning (Docker image analysis for Sail-based projects). The Laravel framework provides built-in security features (SQL injection prevention via Eloquent, XSS protection via Blade, CSRF tokens, password hashing, encryption), so security scanning focuses on proper usage of these features and identifying third-party dependency risks. Automated security scanning is integrated into the CI pipeline, blocking PRs that introduce vulnerabilities and alerting the team to new vulnerabilities in existing dependencies.

## Core Concepts

- **Composer Audit:** Laravel's built-in `composer audit` command (Composer 2.4+) that checks installed packages against the GitHub Advisory Database; reports known vulnerabilities with severity levels and CVE references
- **Dependabot Alerts:** GitHub's automated vulnerability notification system; scans the repository's dependency manifest (composer.lock, package-lock.json) against the GitHub Advisory Database and creates security alerts
- **SAST (Static Application Security Testing):** Automated code analysis that scans source code for security anti-patterns (SQL injection, XSS, command injection, hardcoded secrets) without executing the application
- **Secret Scanning:** Automated detection of exposed secrets (API keys, tokens, passwords, credentials) in the repository's code and git history; GitHub's built-in secret scanning alerts push protection
- **GitHub Advisory Database:** A curated database of security advisories for open-source packages, including PHP/Composer packages; used by Dependabot, Composer Audit, and GitHub Security Advisories

## Mental Models

- **Security Scanner as Automated Pen Tester:** The security scanner continuously probes the codebase and dependencies for known vulnerabilities, like an automated penetration tester that never sleeps
- **Dependency Vulnerability as Technical Debt:**
 Each vulnerable dependency is a piece of technical debt with a security interest rate; the longer it remains unfixed, the higher the risk (and potential cost) of exploitation
- **SAST as Security Linter:** Just as Pint lints for code style, SAST lints for security issues—catching common security mistakes before they reach production

## Internal Mechanics

1. **Dependency Manifest Analysis:** Security scanners parse composer.lock and package-lock.json to identify all installed packages and their versions
2. **Vulnerability Database Matching:** Each package version is checked against vulnerability databases (GitHub Advisory Database, NVD, FriendsOfPHP security advisories) for known CVEs and security issues
3. **Severity Classification:** Vulnerabilities are classified by severity (Critical, High, Medium, Low) based on CVSS score; CI gates can be configured to block on High+ or only on Critical
4. **Alert Generation:** Vulnerabilities are reported as GitHub Security Alerts (for repository admins), PR annotations (for Dependabot PRs), or CI build failures (for SAST tools)
5. **Automatic Fix PR:** Dependabot automatically creates PRs with patched versions for vulnerable dependencies; the team reviews and merges the fix
6. **Secret Scanning:** GitHub scans every push for patterns matching known secret formats (starts with AIA, sk-, etc.) and alerts the committer and repository admin

## Patterns

- **Composer Audit in CI Pattern:**
  ```yaml
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
      - run: composer install --no-interaction --prefer-dist
      - run: composer audit
  ```
  Runs Composer's built-in audit command; fails CI if any known vulnerabilities are found in Composer dependencies.
- **NPM Audit in CI Pattern:**
  ```yaml
  - name: NPM Audit
    run: npm audit --audit-level=high
  ```
  Checks NPM packages for vulnerabilities; fails CI only for high or critical severity findings.
- **SAST GitHub Action Pattern (TruffleHog/Gitleaks):**
  ```yaml
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for git-based scanning
      - uses: trufflesecurity/trufflehog@v3
        with:
          extra_args: --only-verified
  ```
  Scans the repository (including git history) for exposed secrets.
- **Dependabot Security-Only Pattern:**
  ```yaml
  # .github/dependabot.yml
  updates:
    - package-ecosystem: "composer"
      directory: "/"
      schedule:
        interval: "daily"
      open-pull-requests-limit: 5
      labels:
        - "security"
      vendor: true  # Vendor patches for air-gapped environments
  ```
  Dependabot configuration prioritizing security updates (daily scan, security label, limited PR count).
- **GitHub Security Advisory Webhook Pattern:**
  ```yaml
  # GitHub Action triggered by security advisory
  on:
    security_advisory:
      types: [published]
  jobs:
    notify:
      runs-on: ubuntu-latest
      steps:
        - name: Notify Security Team
          run: |
            curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
              --data '{"text":"Security advisory published: ${{ github.event.security_advisory.summary }}"}'
  ```
  Sends Slack notifications when a new security advisory is published that affects the repository.
- **Laravel Security Check Custom Pattern:**
  ```bash
  # Check for common Laravel security misconfigurations
  grep -r "APP_DEBUG=true" .env.example && echo "Warning: Debug mode in example"
  grep -r "APP_KEY=" .env && echo "Check: APP_KEY may be exposed"
  php artisan about --json | jq '.environment' | grep -q "production" || echo "Check APP_ENV"
  ```
  Custom script checking Laravel-specific security configurations.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Dependency scanning | Dependabot vs Composer Audit vs Snyk | Dependabot (GitHub-native, free, auto-PR); Composer Audit (fast, CI-integrated, no external service) |
| Secret scanning | GitHub secret scanning vs TruffleHog vs Gitleaks | GitHub secret scanning (free, push-level, no config); TruffleHog for deeper git history scanning |
| SAST tool | PHPStan security rules vs Psalm vs RIPS | PHPStan security rules (larastan has some security checks; extend with custom rules) |
| Scan frequency | On push vs scheduled (daily/weekly) | On push for secret scanning; daily for dependency scanning; weekly for full SAST |

## Tradeoffs

- **Automated vs Manual Security Review:** Automated scanning catches known vulnerability patterns (CVEs, common misconfigurations) but misses business logic flaws and complex attack chains. Manual security review catches deeper issues but is time-consuming and inconsistent. Use automated scanning as a first pass; conduct manual security reviews for high-risk changes.
- **Dependabot vs Composer Audit:** Dependabot creates PRs with version bumps (proactive fix) but generates PR noise. Composer Audit is a CI check (reactive detection) without fix PRs. Use both: Dependabot for automatic fix PRs, Composer Audit for CI gating.
- **Strict vs Relaxed Vulnerability Policy:** Blocking on any vulnerability (even Low severity) ensures maximum security but can block development for minor issues. Blocking only on High/Critical maintains velocity but accepts Low/Medium risk. Block on High+ for standard projects; block on all for PCI/HIPAA-compliant projects.

## Performance Considerations

- **Scan Execution Time:** Dependabot scan: 1-5 minutes (background, doesn't block CI). Composer audit: 1-2 seconds. Secret scan: 1-5 minutes. SAST scan: 2-20 minutes depending on tool and codebase size.
- **False Positive Rate:** Secret scanning tools have a 1-5% false positive rate (flags test keys, example strings as secrets). SAST tools have a 5-20% false positive rate. Budget time for triaging and suppressing false positives.
- **CI Pipeline Impact:** Security scanning adds 2-30 minutes to CI pipeline depending on the tools used. Run fast scans (Composer audit) in the main pipeline; run deep scans as scheduled workflows.

## Production Considerations

- **Vulnerability Response SLA:** Define SLAs for vulnerability remediation: Critical (<24 hours), High (<72 hours), Medium (<2 weeks), Low (<1 month). Dependabot security PRs should bypass normal PR SLAs.
- **Security Advisory Notification:** Configure notifications (Slack, email, PagerDuty) for Critical and High severity vulnerabilities. The response team must be reachable outside business hours for critical issues.
- **Air-Gapped Environments:** For environments without internet access, create a vendor directory with security patches and use Dependabot's vendoring feature or a private security advisory mirror.
- **Composer.lock Immutability:** Always commit composer.lock; security scanners need it to determine exact package versions. Without it, they can only scan composer.json (which specifies version ranges, not exact versions).

## Common Mistakes

- **No composer.lock committed:** Without composer.lock, security scanners can't determine the exact installed versions; they scan the range specified in composer.json, which may include already-patched versions
- **Ignoring Dependabot PRs:** Dependabot creates security update PRs but no one reviews or merges them; the repository remains vulnerable for weeks or months
- **False positive fatigue:** A secret scanner flags test API keys, causing alert fatigue; the team ignores all alerts, including real secrets
- **Scanning only production dependencies:** Running composer audit only on require packages (not require-dev); development-only tools (like PHPUnit) are excluded, but vulnerabilities in dev dependencies can affect CI/CD pipelines
- **No .env scanning:** The repository has committed .env.example files that contain real-looking secrets; developers copy them and accidentally commit real secrets

## Failure Modes

- **Scanner Outage:** Dependabot or GitHub Security Alerts experience an outage; new vulnerabilities go undetected. Mitigate: have a backup scanning tool (Composer audit in CI); monitor scanner health.
- **Zero-Day Vulnerability:** A critical vulnerability is disclosed with no patch available; the scanner reports it but there's no fix PR to merge. Mitigate: implement WAF rules, feature flags to disable vulnerable functionality, or virtual patches.
- **Secret Leak in Git History:** A secret was committed in the past but has since been rotated; the scanner flags the old commit. Mitigate: use git filter-branch or BFG Repo-Cleaner to remove secrets from history; rotate any exposed secrets.
- **Vulnerability Database Delay:** A vulnerability is publicly disclosed but not yet in the GitHub Advisory Database; the scanner doesn't detect it. Mitigate: subscribe to Laravel security announcements (laravel.com/security); manually review critical dependencies.

## Ecosystem Usage

- **Laravel Framework:** The Laravel project maintains a security disclosure process (laravel.com/security) and releases security patches monthly; security scanning tools pick up these patches as they're released
- **Laravel Forge:** Forge provides server-level security scanning (automatic security updates, firewall configuration, fail2ban); CI security scanning complements Forge's server scanning for a defense-in-depth approach
- **Laravel Vapor:** Vapor's managed infrastructure includes AWS security features (IAM roles, VPC isolation, Lambda security groups); CI security scanning ensures the application code is secure before deploying to Vapor
- **Laravel Nova:** Nova's ecosystem includes third-party packages that require security scanning; Nova-specific vulnerabilities should be monitored via the Nova package marketplace

## Related Knowledge Units

- dependency-update-automation
- github-actions-for-laravel
- automated-testing-in-ci
- phpstan-in-ci

## Research Notes

- Composer's `audit` command was introduced in Composer 2.4 (August 2022) and queries the GitHub Advisory Database natively, replacing the need for the `local-php-security-checker` tool
- GitHub's secret scanning push protection (preventing commits with known secret patterns) was made generally available in 2022 and is recommended as a first line of defense
- The FriendsOfPHP/security-advisories database is the primary source for PHP-specific security advisories, maintaining over 2000 advisories for PHP packages
- Laravel's architecture (Eloquent ORM with parameterized queries, Blade's automatic XSS escaping, built-in CSRF protection, signed routes) reduces the attack surface compared to less opinionated PHP frameworks, but misconfigurations (debug mode in production, missing authorization gates) remain common vulnerability sources
