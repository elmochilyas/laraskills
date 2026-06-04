# ECC Anti-Patterns — Package Landscape & Decision Framework

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 09-package-landscape |
| **Knowledge Unit** | Package Landscape & Decision Framework |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Package Sprawl — Installing More Packages Than Needed
2. Abandonware Dependence — Critical Integration on Unmaintained Package
3. Over-Abstraction — Wrapping Every Vendor SDK in Custom Connector
4. Vendor SDK Lock-In — Package That Doesn't Support Laravel Patterns
5. Migration Aversion — Staying on Outdated Package Versions
6. No Version Pinning — Floating Dependencies Break Unexpectedly
7. Ignoring Dependency Vulnerability Audits
8. Premature Managed Gateway Adoption

---

## Repository-Wide Anti-Patterns

- Not-Invented-Here Syndrome
- Stick-with-What-We-Know Bias

---

## Anti-Pattern 1: Package Sprawl — Installing More Packages Than Needed

### Category
Dependency Management | Maintainability

### Description
Adding integration packages for every concern without evaluating overlap, resulting in 10+ packages where 3-4 cover all needs.

### Why It Happens
Teams add packages incrementally without a holistic package strategy. Each developer picks their preferred package for each concern.

### Warning Signs
- `composer.json` lists 10+ integration-related packages
- Multiple packages serve overlapping purposes (e.g., two HTTP client wrappers)
- Package upgrade takes days due to cascading conflicts
- New developers ask "why do we have package X _and_ package Y?"

### Why It Is Harmful
Increased dependency surface area for vulnerabilities. Slower `composer install` and CI. Higher cognitive load for developers. Package conflicts more likely.

### Real-World Consequences
`composer update` fails due to transitive conflicts. Security patches delayed because one obscure package blocks the update. CI build times increase 2-3x from dependency resolution.

### Preferred Alternative
Audit existing packages before adding new ones. Default to Saloon + Spatie for most needs. Remove overlapping packages.

### Refactoring Strategy
1. List all integration packages in `composer.json`
2. Group packages by concern (HTTP client, webhooks, circuit breaker, etc.)
3. Identify overlapping packages — keep the best-maintained, remove others
4. Replace niche packages with built-in Laravel or Saloon plugin equivalents
5. Run `composer remove` and verify tests pass

### Detection Checklist
- [ ] More than 3 HTTP-client-related packages installed
- [ ] More than 2 webhook packages installed
- [ ] Packages with overlapping purpose coexist
- [ ] `composer why` shows many transitive dependencies

### Related Rules
Default to Saloon + Spatie for new integrations (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
HTTP Client Package Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Abandonware Dependence — Critical Integration on Unmaintained Package

### Category
Risk Management | Reliability

### Description
Building critical integration infrastructure on a package that has no recent commits, unresolved issues, or announced abandonment.

### Why It Happens
Package was good when chosen. Team doesn't monitor package health after initial selection. Migration cost feels too high.

### Warning Signs
- Last commit 12+ months ago
- Open PRs and issues with no response from maintainers
- No Laravel version compatibility declared for recent versions
- Package README mentions "looking for maintainers" or archived repository

### Why It Is Harmful
Security vulnerabilities go unpatched. PHP/Laravel version upgrades break the package. No support for bug fixes. Single point of failure for critical business functionality.

### Real-World Consequences
Cannot upgrade to Laravel 13 because the abandoned package doesn't support it. Security vulnerability in the package leaves integration exposed. Production bug requires forking the package.

### Preferred Alternative
Evaluate package health before adoption: check commit recency, issue response time, Laravel version support, and maintainer responsiveness. Schedule periodic health reviews.

### Refactoring Strategy
1. Identify abandoned packages in `composer.json`
2. Search for maintained alternatives or Laravel-native replacements
3. Plan migration with fallback: if no alternative exists, fork the package
4. Execute migration with feature parity testing
5. Remove abandoned package from dependencies

### Detection Checklist
- [ ] Package with no commits in 6+ months
- [ ] No Laravel 11/13 compatibility declared
- [ ] Open security issues with no response
- [ ] Repository archived or read-only

### Related Rules
Pin package versions and audit weekly (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
HTTP Client Package Selection (07-decision-trees.md)

---

## Anti-Pattern 3: Over-Abstraction — Wrapping Every Vendor SDK in Custom Connector

### Category
Architecture | Premature Optimization

### Description
Wrapping every third-party PHP SDK (Stripe, Twilio, Mailgun) in a custom Saloon connector or adapter layer, adding maintenance without benefit.

### Why It Happens
Teams apply a uniform "all external calls go through Saloon" policy without evaluating whether each vendor SDK is well-maintained and follows Laravel patterns.

### Warning Signs
- Saloon connector wrapping Stripe PHP SDK with no added value
- Custom adapter layer that only delegates to vendor SDK methods
- Vendor SDK already provides typed DTOs, error handling, and pagination
- No Saloon-specific features (middleware, plugins) being used

### Why It Is Harmful
Extra code to maintain, test, and document. Vendor SDK updates require adapter layer updates. No benefit for consumers who could use vendor SDK directly.

### Real-World Consequences
Stripe SDK releases new features — adapter layer lags behind. Documentation must explain both vendor SDK and adapter API. Bug fixes duplicated across vendor SDK and adapter.

### Preferred Alternative
Use well-maintained vendor SDKs directly. Only wrap in Saloon when you need Saloon-specific features (plugins, middleware, multi-endpoint abstraction) that the vendor SDK doesn't provide.

### Refactoring Strategy
1. Identify Saloon wrappers around vendor SDKs with no added value
2. Replace wrapper usage with direct vendor SDK calls in the service layer
3. Remove wrapper Connector and Request classes
4. Remove wrapper tests (vendor SDK already tested)
5. Update service layer to use vendor SDK directly

### Detection Checklist
- [ ] Saloon Connector wraps a vendor SDK with no middleware or plugin additions
- [ ] Custom adapter layer only delegates to vendor SDK methods
- [ ] Removing the wrapper would not affect functionality
- [ ] Vendor SDK provides typed responses and error handling

### Related Rules
Default to Saloon + Spatie for new integrations (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
HTTP Client Package Selection (07-decision-trees.md)

---

## Anti-Pattern 4: Vendor SDK Lock-In — Package That Doesn't Support Laravel Patterns

### Category
Architecture | Framework Compatibility

### Description
Choosing a vendor SDK that doesn't support Laravel patterns (service container, queues, config, facades), forcing workarounds that fight the framework.

### Why It Happens
Team evaluates the SDK on features alone, not on framework compatibility. Laravel integration is an afterthought.

### Warning Signs
- Vendor SDK requires manual instantiation with no service container support
- No config file or env-based configuration
- Queued job examples use raw `dispatch()` instead of Laravel job patterns
- No service provider or facade registration documented
- Examples show procedural code instead of Laravel patterns

### Why It Is Harmful
Fighting the framework increases code complexity. Cannot leverage Laravel's DI, config, queues, and testing utilities. Every integration becomes custom work.

### Real-World Consequences
Config scattered across app instead of centralized. Testing requires manual mocking of vendor SDK's HTTP client. Queue integration requires custom job boilerplate.

### Preferred Alternative
Evaluate Laravel compatibility before choosing: check for service provider, config file, queue integration, factory pattern, and Pest test support.

### Refactoring Strategy
1. Create a Laravel service provider that binds the vendor SDK to the container
2. Create a config file for credentials and options
3. Build a thin wrapper service class that follows Laravel conventions
4. Add Laravel-compatible queue job classes for async operations
5. Write Pest feature tests that use Laravel's Http facade faking

### Detection Checklist
- [ ] No service provider for the vendor SDK
- [ ] Config values hardcoded or in custom files, not Laravel config
- [ ] No Laravel job class examples for async operations
- [ ] Testing requires vendor SDK-specific mocks, not Laravel fakes

### Related Rules
Default to Saloon + Spatie for new integrations (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
HTTP Client Package Selection (07-decision-trees.md)

---

## Anti-Pattern 5: Migration Aversion — Staying on Outdated Package Versions

### Category
Maintenance | Risk Management

### Description
Staying on an outdated major version of a critical integration package due to fear of breaking changes, accruing technical debt and security risk.

### Why It Happens
Migration effort is underestimated. Team lacks confidence in testing coverage. No clear migration path documented.

### Warning Signs
- Package version pinned to old major version with `^1.0` constraint
- Security advisories mention the old version
- New features available only in newer major version
- Upgrade guide exists but team hasn't attempted migration
- "We'll upgrade next sprint" repeated for multiple sprints

### Why It Is Harmful
Security vulnerabilities unpatched. Missing performance improvements and bug fixes. Migration becomes harder over time as gap widens. Technical debt accumulates.

### Real-World Consequences
Security incident traced to unpatched vulnerability in outdated package. Upgrade from v1 directly to v3 requires massive refactoring. Team spends weeks on overdue migration under deadline pressure.

### Preferred Alternative
Schedule regular package upgrade reviews. Upgrade one major version at a time. Run full test suite and CI before merging. Document migration steps.

### Refactoring Strategy
1. Read upgrade guide for each major version jump (v1 → v2, v2 → v3)
2. Create a feature branch for the migration
3. Update `composer.json` constraint and run `composer update`
4. Fix breaking changes incrementally on the branch
5. Run full test suite — fix failures until green
6. Deploy migration branch to staging and verify integration
7. Merge after staging validation

### Detection Checklist
- [ ] Package version 2+ major versions behind latest
- [ ] Security advisories reference outdated version
- [ ] No migration branch or PR exists
- [ ] Team cannot estimate migration effort confidently

### Related Rules
Pin package versions and audit weekly (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
HTTP Client Package Selection (07-decision-trees.md)

---

## Anti-Pattern 6: No Version Pinning — Floating Dependencies Break Unexpectedly

### Category
Dependency Management | Reliability

### Description
Using floating version constraints (`"*"`, `">=2.0"`) or no constraints at all, causing unexpected breaking changes on `composer update`.

### Why It Happens
Developers omit version constraints during initial setup. Assumption that minor/patch updates are always safe.

### Warning Signs
- `composer.json` shows `"*"` or bare `"^2"` without patch level
- CI fails after `composer update` with no code changes
- Production deployed with auto-updated dependencies
- No `composer.lock` committed to version control

### Why It Is Harmful
Unpredictable deployments. Breaking changes from dependencies land in production without review. Rollback cannot restore previous dependency versions.

### Real-World Consequences
Payment processing broken because HTTP client minor update changed behavior. Deployment rolled back — root cause traced to unpinned dependency. `composer.lock` not committed so rollback can't restore working set.

### Preferred Alternative
Pin major and minor versions with `^` constraint (e.g., `^4.0`), always commit `composer.lock`, test `composer update` in CI before deploying.

### Refactoring Strategy
1. Review all dependency constraints in `composer.json`
2. Replace floating constraints with pinned major.minor (`^2.3`)
3. Run `composer update` and commit the updated `composer.lock`
4. Add CI step to verify `composer.lock` is committed and up to date
5. Add `composer audit` to CI pipeline

### Detection Checklist
- [ ] Any dependency uses `*`, `>=`, or bare version constraint
- [ ] `composer.lock` not committed to version control
- [ ] `composer update` run without review of changes
- [ ] No CI check for dependency changes

### Related Rules
Pin package versions and audit weekly (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
HTTP Client Package Selection (07-decision-trees.md)

---

## Anti-Pattern 7: Ignoring Dependency Vulnerability Audits

### Category
Security | Risk Management

### Description
Not running `composer audit` or similar vulnerability scanning on integration packages, leaving known vulnerabilities unaddressed.

### Why It Happens
No automated scanning in CI. Team unaware of `composer audit` command. Security not part of the development workflow.

### Warning Signs
- `composer audit` reports known vulnerabilities when run manually
- No CI step that fails on vulnerable dependencies
- Dependabot or similar alerts disabled or ignored
- Packages with known CVEs in use

### Why It Is Harmful
Known, patchable vulnerabilities are the most common attack vector. Exploits are publicly documented and automated. Integration packages touch external data and are high-value targets.

### Real-World Consequences
Security breach via known vulnerability in webhook client package. Audit reveals 15 packages with CVEs. Emergency patching during incident response.

### Preferred Alternative
Run `composer audit` in CI — fail the build on any advisory. Enable Dependabot or similar automated alerting. Schedule weekly dependency review.

### Refactoring Strategy
1. Run `composer audit` to identify current vulnerabilities
2. Update affected packages to patched versions
3. Add `composer audit` to CI pipeline as a blocking step
4. Enable Dependabot alerts on repository
5. Document vulnerability response procedure

### Detection Checklist
- [ ] `composer audit` shows known vulnerabilities
- [ ] No `composer audit` step in CI pipeline
- [ ] Dependabot alerts not enabled or not reviewed
- [ ] No process for responding to dependency vulnerability disclosures

### Related Rules
Run composer audit weekly (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Circuit Breaker Package Selection (07-decision-trees.md)

---

## Anti-Pattern 8: Premature Managed Gateway Adoption

### Category
Cost Optimization | Architecture

### Description
Adopting a managed webhook gateway (Svix, Convoy) when webhook volume is below 10K events/day and self-hosted Spatie would suffice at lower cost.

### Why It Happens
Team overestimates future volume. Managed gateway marketing promises "enterprise reliability." Self-hosted solution perceived as not production-ready.

### Warning Signs
- Webhook volume under 5K/day but using managed gateway
- Monthly gateway cost exceeds $200 for low volume
- Team has no scaling issues with current self-hosted infrastructure
- Gateway features (retry analytics, dead-letter dashboard) not actually used

### Why It Is Harmful
Unnecessary monthly cost. Vendor lock-in for a concern that Spatie handles well. Added network hop and latency for webhook delivery.

### Real-World Consequences
$300/month gateway bill for 2K webhooks/day that Spatie would process on existing queue workers. Migration to self-hosted when cost is noticed. Vendor dependency when provider changes pricing.

### Preferred Alternative
Start with Spatie self-hosted for volumes under 10K/day. Migrate to managed gateway only when volume exceeds self-hosted capacity or ops burden justifies cost.

### Refactoring Strategy
1. Audit current webhook volume and growth rate
2. Calculate monthly cost of managed gateway vs self-hosted Spatie
3. If volume is under 10K/day, plan migration to self-hosted Spatie
4. Set up Spatie webhook client and server with queue processing
5. Verify feature parity before decommissioning gateway
6. Remove gateway dependency and cancel subscription

### Detection Checklist
- [ ] Webhook volume under 10K/day but using managed gateway
- [ ] Monthly gateway cost exceeds reasonable self-hosted estimate
- [ ] Gateway advanced features (multi-region, analytics) not actively used
- [ ] Team confident in managing queue workers for webhook processing

### Related Rules
Default to Saloon + Spatie for new integrations (05-rules.md)

### Related Skills
Evaluate and Select Laravel API Integration Packages (06-skills.md)

### Related Decision Trees
Webhook Package Selection (07-decision-trees.md)
