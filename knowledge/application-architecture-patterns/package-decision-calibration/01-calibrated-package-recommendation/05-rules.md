# Rules for Calibrated Package Recommendation

## Write All Eight Dimensions Before Recommending
---
## Category
Architecture | Decision-Making
---
## Rule
Before recommending any architectural package, produce all eight dimensions (default recommendation, fit conditions, non-fit conditions, alternative, escape hatch, tradeoffs, testing impact, operational impact). Do not output only a package name.
---
## Reason
A recommendation that states only "Use Laravel Cashier for billing" omits the fit conditions, escape hatch, and tradeoffs. The missing dimensions represent unknown risks that surface during implementation. Teams that see only the default recommendation make uninformed choices.
---
## Bad Example
```php
// Incomplete recommendation
## Recommendation
Use Spatie Permission for authorization.
```
---
## Good Example
```php
## Recommendation: Spatie Permission

### 1. Default Recommendation
Use Spatie Permission for database-driven RBAC.

### 2. When It Fits
- Multiple roles per user, admin-manageable permissions
- Team-scoped permissions needed
- Wildcard permissions useful for role definition

### 3. When It Does NOT Fit
- Simple is_admin boolean is sufficient
- ReBAC (relationship-based) authorization is primary
- Permissions must span microservices

### 4. Alternative
Native Laravel Gates and Policies

### 5. Escape Hatch
Native Gates for ReBAC patterns alongside Spatie for RBAC

### 6. Tradeoffs Accepted
Database dependency for every permission check, cache invalidation complexity, Spatie's schema must be migrated if abandoned

### 7. Testing Impact
Requires permission cache clearing in setUp(). Use RefreshDatabase or manual cache reset. Test with specific guards.

### 8. Operational Impact
Cache invalidation on deploy, permission seeders must be idempotent, audit export queries
```
---
## Exceptions
Trivially small decisions (single utility class, formatting helper) do not need all eight dimensions. A lightweight version with 3-4 dimensions is acceptable. Emergency hotfixes may document the decision post-remediation.
---
## Consequences Of Violation
Cargo-cult package selection: packages adopted without understanding fit conditions. Six months later, the team discovers the package doesn't support a critical requirement. The missing escape hatch forces a big-bang rewrite. Unnamed tradeoffs become constant complaints.

## Make Fit/Non-Fit Criteria Falsifiable
---
## Category
Architecture | Decision-Making
---
## Rule
Fit and non-fit criteria must reference concrete, falsifiable technical requirements — not subjective opinions or preferences. Criteria like "uses Stripe as sole payment provider" are falsifiable; "good developer experience" is not.
---
## Reason
Vague criteria cannot be objectively checked. When the team re-evaluates the package decision 12 months later, "good DX" provides no basis for determining whether the package still fits. Falsifiable criteria enable objective re-evaluation.
---
## Bad Example
```php
## When It Fits
- The package has good documentation
- Developers like the API
- The community is active
```
---
## Good Example
```php
## When It Fits
- PHP 8.3+ and Laravel 13+ are supported (verified via composer.json)
- Stripe is the sole payment provider (no multi-gateway requirement)
- Last release was within 90 days (verified via GitHub releases)
- Test suite passes on PHP 8.3 (verified via CI badge)
```
---
## Exceptions
Documentation quality and community activity are valid secondary signals but should not be primary fit criteria. Use them as tiebreakers between two otherwise equal packages, not as sole justification.
---
## Consequences Of Violation
Decisions made on gut feel rather than engineering analysis. Packages adopted because they "feel right" but fail on concrete requirements. Team cannot objectively determine when to exit the package.

## Always Name the Escape Hatch
---
## Category
Architecture | Risk Management
---
## Rule
Every package recommendation must include a concrete escape hatch — a specific code-level path to bypass the package when it cannot handle a requirement. The escape hatch must describe an actual migration path, not a hand-wavy "we'll figure it out."
---
## Reason
Escape hatches prevent sunk-cost trapping. If the team cannot articulate an escape path before adopting the package, the package is too tightly coupled. The escape hatch provides a safety valve that enables confident package adoption.
---
## Bad Example
```php
## Escape Hatch
If Cashier doesn't work, we'll find another package or build custom.
```
---
## Good Example
```php
## Escape Hatch
Wrap Cashier behind a BillingGateway interface. Use stripe/stripe-php
directly for flows Cashier doesn't support (Connect, metered billing).
Migrate incrementally by moving methods from the Cashier adapter to a
direct Stripe adapter. Once all methods use direct Stripe, remove Cashier.
```
---
## Exceptions
Framework-native features (Eloquent, Blade, routing) do not need escape hatches — switching frameworks is not a practical escape path.
---
## Consequences Of Violation
When requirements change, the team faces a forced rewrite instead of a gradual migration. The package becomes a prison: expensive to keep, expensive to leave.

## Re-Evaluate Fit Annually
---
## Category
Architecture | Risk Management
---
## Rule
Package recommendations should include a review date or re-evaluation trigger. Business requirements and package ecosystems change — a package that fit perfectly at launch may be constraining at scale.
---
## Reason
Packages that are never re-evaluated accumulate technical debt. Maintainers abandon packages, business requirements drift, and alternatives mature. Annual re-evaluation catches fit drift before it becomes a crisis.
---
## Bad Example
No review date. Package recommendation from 2021 is still treated as current without re-evaluation.
---
## Good Example
```php
## Review
Re-evaluate this recommendation annually or when:
- Cashier goes 6 months without a release
- A second payment provider is under consideration
- Stripe API version requires a breaking Cashier upgrade
- Subscription volume exceeds 100K/mo (performance profile changes)
```
---
## Exceptions
Utility packages with no architectural impact (formatting helpers, string manipulation) do not need formal re-evaluation. Packages tightly coupled to a single provider (like Cashier to Stripe) should trigger re-evaluation when the provider relationship changes.
---
## Consequences Of Violation
Stale recommendations guide new team members to adopt packages that no longer fit. The team operates on outdated assumptions. Package ecosystem changes (deprecations, security vulnerabilities) are missed.

## Document Accepted Tradeoffs Explicitly
---
## Category
Architecture | Decision-Making
---
## Rule
Every package recommendation must explicitly list the tradeoffs accepted by choosing the package. "No tradeoffs" means the analysis is incomplete — every package has tradeoffs.
---
## Reason
Tradeoffs that aren't named are forgotten. Six months later, the team complains about the tradeoff as if it were a surprise. Explicitly naming tradeoffs sets expectations and prevents buyer's remorse.
---
## Bad Example
```php
## Tradeoffs Accepted
None. Cashier is the right choice for our needs.
```
---
## Good Example
```php
## Tradeoffs Accepted
- Locked into Stripe ecosystem (no multi-provider support)
- Cashier upgrades can break customization if we override protected methods
- Stripe tax/compliance is US-centric — international tax requires additional setup
- Subscription state is mirrored locally — webhook failures cause state divergence
- Cashier's Billable trait adds columns to users table — tight coupling to User model
```
---
## Exceptions
When a package has genuinely minimal tradeoffs (e.g., a well-maintained logging formatter), the tradeoff section may be short but should never be "none."
---
## Consequences Of Violation
Unrealistic expectations about package behavior. Team resistance when tradeoffs surface during implementation. The package is blamed for tradeoffs that were always present but never documented.
