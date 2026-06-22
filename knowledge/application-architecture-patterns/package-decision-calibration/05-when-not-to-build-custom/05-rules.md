# Rules for When NOT To Build Custom

## Measure Current Package Cost Before Comparing to Custom Build Cost
---
## Category
Architecture | Decision-Making
---
## Rule
Before deciding to build custom to replace a package, measure the actual hours spent fighting the package over a 2-4 week period. Track workarounds, upgrade friction, debugging time, and workaround documentation. Compare this measured cost against the estimated cost of a custom build.
---
## Reason
Teams systematically overestimate how much time they spend fighting packages. The frustration of a single afternoon debugging a package issue creates a disproportionate impression of the package's cost. Measured data over 2-4 weeks often reveals the package costs 2-4 hours/month — far less than the ongoing maintenance cost of custom code.
---
## Bad Example
```php
// Gut-feel decision
"We spent all day yesterday fighting Cashier's webhook handling.
Let's build our own billing system. It can't be that hard."
// No measurement of actual cost over time.
```
---
## Good Example
```php
## Cashier Cost Tracking (4 weeks)
Week 1: 1h — webhook configuration debugging
Week 2: 0h
Week 3: 2h — upgrade to Cashier v14
Week 4: 0h
Total: 3 hours/month

## Custom Build Estimate
Initial build: 12 weeks
Ongoing maintenance: 8 hours/month (bugs, security, new features)
3-year total: 12 weeks + (8h × 36 months) = ~24 weeks

## Decision
Cashier at 3h/month is far cheaper than custom build at 8h/month ongoing.
Keep Cashier. Improve integration, don't replace.
```
---
## Exceptions
When the package has critical security vulnerabilities with no patch available, or when the package maintainer has officially announced end-of-life, tracking cost before deciding to exit may be unsafe. Security and continuity risks override cost analysis.
---
## Consequences Of Violation
Teams replace packages that cost 2 hours/month with custom code that costs 8 hours/month to maintain. The "build custom" decision made on frustration delivers a worse, more expensive outcome over time.

## Account for ALL Costs of Custom, Not Just Initial Build
---
## Category
Architecture | Decision-Making
---
## Rule
When estimating custom build cost, include: initial development, ongoing bug fixes, security patches, feature parity with the package, onboarding documentation, production incident response, and team ramp-up for new hires. Over a 3-year lifespan, ongoing maintenance typically costs 2-3x the initial build.
---
## Reason
Developers estimate the initial build well but systematically ignore ongoing maintenance. A custom billing system takes 3 months to build but requires perpetual maintenance: Stripe API changes, tax law updates, new payment methods, security patches, and onboarding for every new team member. The package absorbs these costs; custom code exposes them directly.
---
## Bad Example
```php
// Initial-build-only estimate
## Custom Billing System Cost
- Subscription management: 2 weeks
- Invoice generation: 1 week
- Webhook handling: 1 week
- Testing: 1 week
Total: 5 weeks — cheaper than dealing with Cashier quirks!
// Missing: 3 years of maintenance, security patches, tax updates, onboarding
```
---
## Good Example
```php
## Custom Billing System Cost: 3-Year Total
### Initial Build (8 weeks)
- Subscription management: 2 weeks
- Invoice generation: 1 week
- Proration / trial handling: 1 week
- Webhook handling + idempotency: 1 week
- Admin UI for subscription management: 1 week
- Testing (unit + integration + E2E): 1.5 weeks
- Documentation + onboarding: 0.5 weeks

### Ongoing Maintenance (per year — 28 weeks over 3 years)
- Bug fixes: 4 hours/month
- Security patches: 2 hours/month
- Stripe API version upgrades: 4 hours/quarter
- New payment methods (e.g., Link, Cash App Pay): 8 hours/quarter
- Tax compliance updates (VAT, GST): 4 hours/quarter
- Onboarding new team members: 2 hours/month
- Production incident response: 2 hours/month
- Ongoing: ~16 hours/month = ~9.3 weeks/year

### 3-Year Total: 8 + (9.3 × 3) = ~36 weeks
// Compare: Cashier integration was 2 weeks + 3 hours/month = ~7.5 weeks over 3 years
```
---
## Exceptions
For simple, stable functionality where the package is genuinely overengineered (e.g., a single utility method wrapped in a 5K-line package), custom build may be cheaper over the full lifespan. The key is that the analysis must include all costs to make this determination.
---
## Consequences Of Violation
The custom solution is "done" after initial build but accumulates bugs, security issues, and missing features that the package would have handled. Within 18 months, the custom solution is demonstrably worse than the package it replaced. The team has traded measured package cost for unmeasured custom cost.

## Evaluate Fork-Before-Build
---
## Category
Architecture | Decision-Making
---
## Rule
Before committing to a full custom build, evaluate whether forking the existing package and maintaining the fork is a viable middle path. If the package is 80% right, forking costs ~25% of a full custom build and preserves the package's documentation, community knowledge, and test suite.
---
## Reason
Forking preserves the package's architecture, documentation, test suite, and community knowledge (StackOverflow answers, blog posts, existing team knowledge). A fork only needs to maintain the delta between the original package and your needs. A full custom build starts from zero — no documentation, no tests, no community knowledge, no existing team familiarity.
---
## Bad Example
```php
// Jump straight to custom
"Spatie Permission doesn't handle our ReBAC patterns perfectly.
Let's build our own authorization system from scratch."
// Discards Spatie's RBAC, caching, middleware, Blade directives, team permissions — all of which still work.
```
---
## Good Example
```php
## Option 1: Fork Spatie Permission
- Preserve: RBAC, caching, middleware, Blade directives, team permissions
- Add: ReBAC extension via custom driver or trait
- Cost: ~2 weeks to fork + add ReBAC support
- Ongoing: ~2 hours/month to rebase on upstream releases

## Option 2: Full Custom Build
- Must rebuild: RBAC, caching, middleware, Blade directives, team permissions, admin UI
- Cost: ~8 weeks initial build
- Ongoing: ~6 hours/month
- Lost: Community docs, StackOverflow answers, team familiarity

## Decision: Fork. 80% of the package still fits perfectly.
```
---
## Exceptions
When the package's architecture fundamentally conflicts with the application's needs (not just missing features, but structural incompatibility), forking may not help — the fork would inherit the same architectural problems. When the package is unmaintained, forking transfers the maintenance burden entirely to the team; evaluate whether the community would follow the fork or whether you're now the sole maintainer.
---
## Consequences Of Violation
Teams rebuild 80% of a package's functionality from scratch, wasting months of engineering effort on commodity features (caching, Blade directives, middleware) that the package already solved. The new custom system is worse for the first 12-18 months while it catches up to the package's maturity.

## Set an Exit Threshold Before Adopting a Package
---
## Category
Architecture | Risk Management
---
## Rule
For each major architectural package, document the exit triggers BEFORE full adoption. Example: "Exit Cashier if: (a) we need Stripe Connect, (b) we add a second payment provider, or (c) Cashier goes 6 months without a release." Exit triggers prevent emotional attachment and provide objective criteria.
---
## Reason
Without pre-defined exit triggers, the decision to exit a package becomes emotional and political. "We've invested so much in Cashier" (sunk cost) or "The team that chose this package is gone" (ownership vacuum). Pre-defined triggers make the exit decision objective and depersonalized.
---
## Bad Example
```php
// No exit triggers defined
"We'll know when it's time to move on."
// Six months later: "Is it time? I'm not sure. We've already built so much on Cashier..."
```
---
## Good Example
```php
## Cashier Exit Triggers
Re-evaluate and consider exiting Cashier when ANY of these occur:
1. A second payment provider (Paddle, Braintree) is under active consideration
2. Stripe Connect integration is required for marketplace payouts
3. Cashier goes 6+ months without a release or security patch
4. Stripe announces a breaking API version change that Cashier doesn't support within 3 months
5. Custom metered billing logic exceeds 30% of billing codebase (escape hatch overuse)
6. Team velocity on billing features drops >50% due to Cashier workarounds
```
---
## Exceptions
For packages that handle commodity concerns with no expected change in requirements (e.g., a UUID generation library), exit triggers may be limited to "package becomes unmaintained."
---
## Consequences Of Violation
Packages stay in the codebase long after they stop fitting. New team members ask "why are we using this package that doesn't fit our needs?" The answer is always "because we always have." Exit decisions become political battles instead of engineering decisions.
