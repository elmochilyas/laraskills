# Anti-Patterns: PHP Version Numbering

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | PHP Version Numbering |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Running EOL Versions | Security | Critical |
| 2 | Upgrading Every Minor Version Immediately | Maintenance | Medium |
| 3 | Delaying Upgrades Indefinitely | Operations | Critical |
| 4 | Assuming "It Works" Without Automated Test Verification | Migration | High |
| 5 | Leapfrog Upgrading Without Intermediate Validation | Methodology | Medium |

## Repository-Wide Anti-Patterns

- **Upgrade procrastination**: Teams delay PHP version upgrades until security EOL, then rush the migration under time pressure, increasing the risk of BC break incidents and performance regressions.
- **Version knowledge gaps**: Not tracking the EOL timeline across production environments leads to unsupported versions running in production, violating compliance requirements (PCI-DSS, SOC2).

---

## Anti-Pattern 1: Running EOL Versions

### Category
Security

### Description
Running PHP versions that have reached End of Life and no longer receive security patches, exposing the application to known CVEs that will never be fixed.

### Why It Happens
- "If it works, don't fix it" mentality
- Fear of BC breaks in the upgrade
- Lack of awareness that a version has reached EOL
- No organizational process for monitoring PHP version EOL dates
- Technical debt: the version is "pinned" by an incompatible extension or library
- Management prioritizes new features over maintenance upgrades

### Warning Signs
- php -v shows 8.2, 8.1, 8.0, or 7.4 in production (all EOL as of 2026)
- No upgrade plan exists for the current PHP version
- Security announcements for PHP CVEs are ignored or not subscribed to
- Compliance auditor flags unsupported PHP version
- Extensions or packages require a newer PHP version, but the application is stuck on an older one
- The upgrade effort increases over time as more versions are skipped

### Why Harmful
EOL versions receive zero security patches:
- CVEs published after EOL date are never fixed in that version line
- Security researchers and attackers know about unfixed vulnerabilities
- CVE exploits targeting known PHP vulnerabilities appear regularly
- Running EOL PHP violates PCI-DSS, SOC2, and other compliance frameworks
- Insurance policies may not cover breaches involving unsupported software
- The security debt compounds as more CVEs accumulate without fixes

### Consequences
- Unpatched security vulnerabilities in production
- Compliance violations (PCI-DSS, SOC2) with potential fines
- Security insurance claims denied if EOL software is involved
- Data breach risk from known, exploitable CVEs
- Emergency forced upgrade under time pressure when compliance deadline hits
- Loss of customer trust if a breach is traced to an EOL vulnerability

### Alternative
Proactively manage PHP version lifecycle:
1. Monitor PHP EOL dates on php.net/supported-versions.php
2. Plan upgrades to complete BEFORE the current version reaches EOL
3. Allocate regular maintenance time for version upgrades (quarterly)
4. Maintain a version upgrade backlog with target dates per environment
5. Test each upgrade on staging before production deployment
6. Document the upgrade process for repeatability

### Refactoring Strategy
1. Identify all PHP versions in production, staging, and development
2. Check each version's EOL status on php.net
3. For EOL versions: create an upgrade project with target date before compliance deadline
4. Test the application on the target version (resolve BC breaks)
5. Verify all extensions and third-party packages support the target version
6. Deploy the upgrade to staging, run full test suite, then production
7. Set up automated alerts for approaching EOL dates

### Detection Checklist
- [ ] All production PHP versions are actively supported (not EOL)
- [ ] EOL monitoring in place (calendar reminders, automated alerts)
- [ ] Upgrade plan exists for each environment
- [ ] Compliance requirements (PCI-DSS, SOC2) for PHP version are met
- [ ] Security announcements monitored for PHP CVEs
- [ ] Upgrade process documented and tested
- [ ] No version is more than one minor version behind the latest stable

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Version Numbering
- 05-rules.md: Upgrade Before EOL
- 07-decision-trees.md: Upgrade Timing Decision Tree

---

## Anti-Pattern 2: Upgrading Every Minor Version Immediately

### Category
Maintenance

### Description
Upgrading to every new PHP minor version within weeks of release, consuming significant engineering resources for marginal performance gains and accepting unnecessary risk from early-adoption issues.

### Why It Happens
- "Latest is greatest" mindset without considering ROI
- Pressure to stay current for security reasons (but security-only versions exist for a reason)
- Confusing minor versions with security releases
- Not distinguishing between active support and security-only support timelines
- Unawareness that PHP 8.3+ versions show diminishing returns for web applications

### Warning Signs
- Application was upgraded to PHP 8.4 within a month of release, then 8.5 within a month
- Each upgrade cycle costs days of engineering time
- Performance benchmarks show < 2% improvement per version upgrade
- BC break fixes consume more time than feature development in upgrade cycles
- Team expresses exhaustion from constant upgrade work
- Upgrades are reactive to release announcements, not planned on a schedule
- No ROI analysis performed before deciding to upgrade

### Why Harmful
Each upgrade has costs that may exceed benefits:
- Dev environment updates, CI pipeline changes, dependency verification
- Test suite fixes for behavior changes, deprecation handling
- Deployment process updates, monitoring configuration changes
- Risk of production incidents from BC breaks or new-version bugs
- Team energy and focus diverted from higher-impact work
- For PHP 8.3→8.4→8.5: cumulative gain is typically 2-5%, rarely exceeding upgrade cost

### Consequences
- Significant engineering cost for marginal performance gain
- Team distracted from higher-impact work (database optimization, caching, architecture)
- Multiple opportunities for BC break incidents (each upgrade is a risk)
- Fatigue and reduced thoroughness in testing after repeated upgrades
- Environment management complexity (different stages on different versions)
- Difficulty tracking which version's behavior changes are relevant

### Alternative
Adopt a deliberate upgrade cadence:
- Plan upgrades around business needs, not PHP release schedule
- Upgrade every 12-18 months (skip intermediate versions within active support window)
- Upgrade primarily for security and compliance, secondarily for features and performance
- Use leapfrog upgrades: skip directly to the version that will have the longest support window
- If a feature is needed in a specific version, upgrade for that feature, not for "being current"

### Refactoring Strategy
1. Calculate the cost of the last upgrade cycle (engineering hours, testing, incidents)
2. Calculate the benefit (performance gain, security coverage, feature enablement)
3. Compare ROI to other performance investments
4. If ROI is negative, move to a slower upgrade cadence
5. Schedule upgrades to align with major platform changes (OS, database, framework)
6. Invest saved engineering time in application-level performance optimization

### Detection Checklist
- [ ] Upgrade cadence defined (e.g., every 12-18 months, not every release)
- [ ] ROI calculated per upgrade cycle
- [ ] Leapfrog within active support versions preferred over incremental upgrades
- [ ] Feature and security needs, not "being current," drive upgrade decisions
- [ ] Upgrade engineering cost tracked and reviewed
- [ ] Team has capacity to perform upgrades thoroughly

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Version Numbering
- 05-rules.md: Adopt Deliberate Upgrade Cadence
- 07-decision-trees.md: Upgrade Timing Decision Tree

---

## Anti-Pattern 3: Delaying Upgrades Indefinitely

### Category
Operations

### Description
Continuously postponing PHP version upgrades, accumulating version debt that increases migration risk and cost over time, eventually forcing an emergency upgrade under crisis conditions.

### Why It Happens
- "We'll do it next sprint" that never comes
- Fear of unknown BC breaks
- No allocated maintenance budget for version upgrades
- Management prioritizes features over platform maintenance
- No visibility into the cost of delay (security risk, performance left on table)
- Previous upgrade experience was painful, creating aversion

### Warning Signs
- Application is 2+ major versions behind the current PHP release
- PHP version was set years ago and never changed
- No one on the team has performed an upgrade in the current codebase
- Test suite has gaps that make upgrade validation unreliable
- Third-party packages require a newer PHP version than the application runs
- Security notifications for PHP are ignored because "we can't upgrade"
- Compliance findings include "unsupported PHP version" year after year

### Why Harmful
Upgrade difficulty compounds over time:
- Each skipped version means cumulative BC breaks to resolve
- Deprecations in earlier versions become removals in later versions
- Old PHP versions have fewer compatible extensions and packages
- Team loses familiarity with the upgrade process
- Performance gains (48.6% cumulative from 7.4 to 8.3) are left unrealized
- Security risk exposure compounds over months and years
- When forced to upgrade (compliance deadline, security incident), the migration is rushed and risky

### Consequences
- Security vulnerabilities unpatched for months or years
- Compliance violations accumulating
- Performance 20-50% below what newer versions provide
- Increasingly difficult upgrade path (more BC breaks to fix at once)
- Emergency upgrade under time pressure increases incident risk
- Team stress and burnout from crisis-driven upgrade
- Management forced to allocate unexpected budget for emergency migration

### Alternative
Treat upgrades as regular maintenance:
1. Include PHP version upgrade in the regular maintenance backlog
2. Upgrade at least once per year, even if skipping minor versions
3. Maintain a test suite that covers critical paths for upgrade validation
4. Track PHP EOL dates and plan upgrades before the deadline
5. Budget engineering time for upgrades (e.g., 1 sprint per quarter)
6. Document the upgrade process and dependencies for future reference

### Refactoring Strategy
1. Determine current PHP version and target version
2. Calculate the version gap: how many minor versions to cross
3. Create a project plan: resolve BC breaks, update dependencies, test, deploy
4. If the gap is large (3+ minor versions), stage the upgrade in 2-3 steps
5. Allocate dedicated engineering time (not "when we have time")
6. Execute the upgrade, document lessons learned, plan next upgrade
7. Set up automated EOL monitoring to prevent future delays

### Detection Checklist
- [ ] Current PHP version identified and EOL status checked
- [ ] Upgrade project plan exists with timeline
- [ ] Dedicated engineering time allocated for the upgrade
- [ ] Test suite adequate for upgrade validation
- [ ] Third-party dependencies checked for version compatibility
- [ ] EOL monitoring set up to prevent future delays
- [ ] Upgrade cost (delay cost) tracked and reported to management

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Version Numbering
- 05-rules.md: Upgrade Before EOL
- 07-decision-trees.md: Upgrade Priority Decision Tree

---

## Anti-Pattern 4: Assuming "It Works" Without Automated Test Verification

### Category
Migration

### Description
Upgrading PHP versions without running the automated test suite on the target version, relying on manual smoke testing or assuming backward compatibility — missing BC breaks that only manifest under specific conditions.

### Why It Happens
- PHP's backward compatibility commitment creates a false sense of safety
- Test suite coverage is low or the team doesn't trust the tests
- Time pressure: "the upgrade needs to go out today"
- Manual testing seems faster than fixing test failures
- Previous upgrades went smoothly, creating complacency
- The test suite itself uses PHP features that may not work on the target version

### Warning Signs
- Upgrade deployed without running phpunit or pest on the target version
- Smoke testing only covers happy paths
- "We don't have tests for that" when asked about specific behavior
- PHP version upgraded in production before staging
- BC break issues discovered days or weeks after the upgrade
- Deprecation warnings appear in production logs after upgrade
- Third-party package compatibility not verified before upgrade

### Why Harmful
PHP minor versions can contain BC breaks that are not obvious:
- Behavior changes in comparison operators, string handling, JSON encoding
- Function signature changes that cause warnings or errors in edge cases
- Deprecated features that generate warnings (which may be suppressed in production)
- Type system changes that cause TypeError in unexpected places
- Extension behavior differences that only manifest in production traffic patterns
- Without automated testing, these issues reach production users

### Consequences
- Production incidents from subtle BC breaks
- Data corruption from changed behavior (JSON encoding, string comparison)
- Silent failures that accumulate before detection
- Emergency rollback deploying the old PHP version
- Loss of confidence in future upgrades
- Team spending weeks fixing breakage instead of delivering features

### Alternative
Make test verification a gating step:
1. Run the full test suite on the target PHP version before any deployment
2. Enable E_ALL | E_STRICT error reporting and treat all warnings as failures
3. Verify third-party dependency compatibility (composer outdated, packagist)
4. Run integration tests that exercise database, file system, and external services
5. Perform canary deployment: route 1% of traffic to the new version and monitor
6. Prepare a rollback plan and test it before the full rollout

### Refactoring Strategy
1. Set up a CI pipeline stage that runs tests on the target PHP version
2. Fix all test failures and address all deprecation warnings
3. Run php -l on all files — catches syntax-related BC breaks
4. Add integration tests for critical user journeys
5. Deploy to staging with E_ALL error reporting for 24 hours before production
6. Use canary deployment for production rollout with automated rollback on error rate increase

### Detection Checklist
- [ ] Full test suite passes on target PHP version
- [ ] E_ALL error reporting enabled, zero warnings
- [ ] Third-party dependencies verified compatible with target version
- [ ] Integration tests pass with the new PHP version
- [ ] Canary deployment strategy defined
- [ ] Rollback plan documented and tested
- [ ] Production error monitoring configured for post-upgrade detection

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Version Numbering
- 05-rules.md: Test Before Upgrade
- 07-decision-trees.md: Upgrade Readiness Decision Tree

---

## Anti-Pattern 5: Leapfrog Upgrading Without Intermediate Validation

### Category
Methodology

### Description
Skipping multiple PHP minor versions in a single upgrade (e.g., 7.4 → 8.2) without validating each version boundary, missing regressions, deprecations, and behavior changes introduced in intermediate versions that compound into hard-to-diagnose issues.

### Why It Happens
- Leapfrogging reduces the number of upgrade cycles
- "We only need to test one target version, not four"
- Convenience: update PHP version, run tests, deploy
- Unawareness that cumulative deprecations and behavior changes can interact
- Previous leapfrog upgrades succeeded, creating a false sense of safety

### Warning Signs
- Upgrade from PHP 7.4 to 8.2 (skipping 8.0 and 8.1)
- Test suite passes on target version but production behavior is different
- New warnings or errors that don't correspond to any single version's BC breaks
- Performance regression that can't be explained by the target version alone
- Multiple deprecation warnings simultaneously that are hard to fix incrementally
- Team cannot identify which version introduced a specific behavior change

### Why Harmful
Leapfrog upgrades compound issues:
- Deprecations from PHP 8.0, behavioral changes from 8.1, and removals in 8.2 all appear at once
- Fixing all issues simultaneously is harder than fixing them incrementally
- A blocking issue in the target version blocks the entire upgrade
- Cumulative changes make it harder to isolate the cause of a regression
- If a performance regression appears, it's unclear which version caused it
- Rollback is more disruptive because multiple versions need to be reverted

### Consequences
- Multiple simultaneous BC break issues overwhelming the team
- Hard-to-diagnose issues from interacting changes across versions
- Blocking issue in target version stalls the entire upgrade project
- Performance regression attributed to the final version, not an intermediate one
- Rollback reverts all version changes at once (more disruptive)
- Team learns less about each version's specific changes

### Alternative
For leapfrog upgrades, validate incrementally:
1. Test the application on each major version boundary individually
2. Create a CI pipeline that runs tests on each intermediate version
3. Fix BC breaks incrementally for each version boundary
4. Document which version introduced each change or deprecation
5. After all boundaries pass, the leapfrog deployment is safe
6. For the final deployment, use the target version only (all fixes are backward-compatible)

### Refactoring Strategy
1. Set up CI pipeline stages for PHP 8.0, 8.1, 8.2 (for a 7.4→8.2 leapfrog)
2. Fix test failures for PHP 8.0 first (usually the hardest due to major changes)
3. Then fix for PHP 8.1, then 8.2
4. After all boundaries pass, the codebase is compatible with the entire path
5. Deploy the target version only (all fixes are backward-compatible)
6. Document the BC breaks encountered at each boundary for future reference

### Detection Checklist
- [ ] Each major version boundary tested individually
- [ ] BC breaks documented per version boundary
- [ ] CI pipeline runs tests on all intermediate versions
- [ ] Performance regression testing at each boundary
- [ ] All fixes backward-compatible (work on source version too)
- [ ] Rollback plan accounts for leapfrog scope

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Version Numbering
- 05-rules.md: Validate Each Version Boundary
- 07-decision-trees.md: Leapfrog vs Incremental Decision Tree
