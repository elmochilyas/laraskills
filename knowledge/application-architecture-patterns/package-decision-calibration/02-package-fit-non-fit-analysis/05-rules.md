# Rules for Package Fit / Non-Fit Analysis

## Score Each Dimension, Do Not Rely on Gut Feeling
---
## Category
Architecture | Decision-Making
---
## Rule
Score each of the seven fit/non-fit dimensions numerically; do not rely on intuition alone. A structured score (e.g., /10 per dimension, summed to /70) surfaces biases and enables comparison between packages.
---
## Reason
Engineering teams tend to overestimate ecosystem alignment and underestimate maintenance risk. Explicit scoring surfaces these biases. Without numerical scoring, two similar packages are compared on "feeling," not data.
---
## Bad Example
```php
// Intuition-based evaluation
"I think Cashier should work fine for us. Stripe is popular and Cashier has good docs."
```
---
## Good Example
```php
## Package: laravel/cashier
### 1. Ecosystem Alignment (Score: 8/10)
- PHP 8.3+ ✓, Laravel 13+ ✓, PostgreSQL ✓
### 2. Assumption Fit (Score: 7/10)
- Stripe-only: matches our provider ✓
- Subscription-first: matches our model ✓
- No Connect support: not needed now ✓
### 3. Escape Hatch Availability (Score: 7/10)
- stripe/stripe-php direct as escape ✓
### 4. Team Familiarity (Score: 3/10)
- One team member has prior Cashier experience
### 5. Long-Term Commitment Risk (Score: 7/10)
- Maintained by Laravel core team, releases monthly
### 6. Package Maintenance Health (Score: 8/10)
- Active releases, CI passing, PHP 8.3+ supported
### 7. Testing Complexity (Score: 5/10)
- Requires Stripe test keys, test clocks for time scenarios
### Recommendation: Strong Fit (45/70)
```
---
## Exceptions
When comparing a package that is clearly unmaintained (no commits in 2+ years, test suite failing), a full numerical score may be unnecessary — the maintenance score alone disqualifies it. Similarly, for trivial utility packages, a condensed 3-dimension score is sufficient.
---
## Consequences Of Violation
Confirmation bias drives package selection. Teams adopt packages that are popular but unmaintained, or well-documented but fundamentally mismatched to their requirements.

## Weight Lock-In Risk Higher Than Other Dimensions
---
## Category
Architecture | Risk Management
---
## Rule
Lock-in risk should be weighted more heavily than other dimensions when making the final decision. A package can have great ecosystem alignment and maintenance health but still be a poor choice if it creates vendor lock-in that cannot be undone without a rewrite.
---
## Reason
Package features can be extended; lock-in cannot be undone without a rewrite. Packages that deeply integrate into models, migrations, and controllers (like Cashier's Billable trait) create lock-in that persists even after the package is removed. Treat high lock-in as a near-dealbreaker.
---
## Bad Example
```php
## Lock-In Assessment
"We can always remove the package later if we need to."
// No analysis of actual migration cost or coupling points
```
---
## Good Example
```php
## Lock-In Severity: HIGH
- Cashier's Billable trait modifies the User model directly
- Cashier owns subscription migrations (schema dependence)
- Stripe subscription IDs are stored in Cashier-managed tables
- Migration away requires: schema migration, User model refactor,
  data migration of subscription state, rewriting webhook handling
- Estimated migration cost: 4-6 weeks for billing system
```
---
## Exceptions
Packages that wrap external APIs without owning schema (like HTTP clients) generally have low lock-in and do not need disproportionate weighting. Packages that provide purely in-memory services (caching wrappers) also have low lock-in.
---
## Consequences Of Violation
Teams adopt packages with deep Eloquent integration and schema ownership, then discover migration is a 6-week project. The package becomes permanent regardless of fit.

## Test the Package's Assumptions in a Spike Before Adopting
---
## Category
Architecture | Risk Management
---
## Rule
Before adopting any package with architectural impact, run a 1-2 day spike to verify that the package's documented assumptions match the project's actual requirements. Documentation may say "works with X" but only a spike verifies it works with YOUR X.
---
## Reason
Documentation is aspirational; reality is specific. A package may claim PostgreSQL support but fail on PostgreSQL 16 with JSONB columns. A spike surfaces these mismatches before the package is deeply integrated, when the cost of switching is near zero.
---
## Bad Example
```php
// Adopting Cashier based on documentation alone
"We read the docs — Cashier supports subscriptions and invoices.
Let's integrate it this sprint."
// Three sprints later: "Cashier doesn't handle our metered billing model."
```
---
## Good Example
```php
// Spike plan (1-2 days)
Day 1:
- Install Cashier, run migrations
- Create a subscription with our actual plan structure
- Test webhook handling with Stripe test mode
- Test proration with our pricing tiers
Day 2:
- Test the escape hatch (stripe/stripe-php direct for metered billing)
- Test the BillingGateway wrapper with our domain models
- Document any assumption mismatches found
```
---
## Exceptions
Well-established packages the team has used before on similar projects may skip the spike. Packages with zero architectural impact (formatting helpers, string utilities) do not need a spike.
---
## Consequences Of Violation
The team discovers assumption mismatches during feature development, when the package is already deeply integrated. What should have been a 1-day spike becomes weeks of rework.

## Check Maintenance Health Beyond Stars and Downloads
---
## Category
Architecture | Risk Management
---
## Rule
When evaluating a package's maintenance health, check recent commits, release cadence, issue response time, PR merge rate, and test suite status — not just GitHub stars or total downloads.
---
## Reason
A package with 10K stars but no commits in 2 years is abandonware at scale. Stars measure past popularity, not current maintenance. An unmaintained package does not receive security patches, PHP 8.3 compatibility, or Laravel 13 support.
---
## Bad Example
```php
// Stars-only evaluation
"laravel-permission has 12K stars, so it's well-maintained."
```
---
## Good Example
```php
## Maintenance Health Assessment
- Last release: 2026-05-15 (2 weeks ago)
- Release frequency: monthly
- Open issues: 45 (5 stale, >6 months)
- PR merge rate: high (most PRs merged within 2 weeks)
- Test suite: passing (verified via GitHub Actions CI)
- PHP 8.3 support: confirmed in composer.json
- Laravel 13 support: confirmed in release notes
- Maintainer bus factor: 3+ active contributors
```
---
## Exceptions
Packages that are "feature-complete" by design (e.g., a UUID generation library) may have infrequent releases but still be well-maintained. The metric is not release frequency alone but whether issues and security patches are addressed.
---
## Consequences Of Violation
Adopting abandonware: unpatched security vulnerabilities, PHP version incompatibility, no migration path to Laravel 13. The package becomes technical debt on day one.

## Re-Run Analysis on Major Version Upgrades
---
## Category
Architecture | Risk Management
---
## Rule
When a package releases a new major version, re-run the fit/non-fit analysis. Major version upgrades can change assumptions, lock-in characteristics, maintenance status, and testing complexity.
---
## Reason
A package's v4 may have different database requirements, PHP version requirements, or architectural patterns than v3. What fit at v3 may not fit at v4. Re-running the analysis catches these changes before the upgrade is attempted.
---
## Bad Example
```php
// Blind upgrade
composer require spatie/laravel-permission:^6.0
// No re-evaluation of fit. Permissions break because guard handling changed.
```
---
## Good Example
```php
## Re-Analysis: Spatie Permission v5 → v6
- Ecosystem alignment: still 8/10 (unchanged)
- Assumption fit: 7/10 → 6/10 (new team-permission API changes how we handle tenants)
- Escape hatch availability: unchanged
- Testing complexity: 4/10 → 5/10 (new caching layer needs test adjustment)
- Recommendation: Conditional fit — upgrade after team-permission migration spike
```
---
## Exceptions
Patch version upgrades (x.x.1 → x.x.2) do not require re-analysis. Minor version upgrades that add non-breaking features do not require full re-analysis but should be reviewed for new capabilities that might change the fit.
---
## Consequences Of Violation
Breaking changes discovered during or after production deployment. The upgrade introduces regressions because assumption changes were not caught.
