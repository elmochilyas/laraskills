# Anti-Patterns: Plan, Feature & Entitlement Model

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | SaaS Billing Architecture |
| Knowledge Unit | Plan, Feature & Entitlement Model |
| Audience | Developers, Architects, Billing Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-PFE-01 | Entitlement Via Direct Stripe API Calls | Critical | Medium | Medium |
| AP-PFE-02 | Hardcoded Plan-Feature Mappings | High | High | Medium |
| AP-PFE-03 | Boolean-Only Entitlement Model | High | High | High |
| AP-PFE-04 | Fail-Open Entitlement Computation | Critical | Medium | Low |
| AP-PFE-05 | Silent Entitlement Override With No Audit Trail | High | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **Checking `stripe_status` Directly for Feature Access**: Controllers or Blade templates inspecting `$team->subscription->stripe_status` instead of routing through FeatureGate
- **Merging Feature Definitions into Stripe Product Metadata**: Using Stripe product metadata to store feature keys, coupling application features to Stripe's API
- **No Entitlement Caching**: Computing entitlements from scratch on every request without any caching layer

---

## 1. Entitlement Via Direct Stripe API Calls

### Category
Architecture · Critical

### Description
Making Stripe API calls during entitlement computation or feature access checks, coupling application availability to Stripe's uptime and adding 200-500ms of latency to every access decision.

### Why It Happens
Stripe stores subscription status and plan details. It seems logical to query Stripe directly for the "source of truth." Developers may not realize that Stripe state can and should be cached locally via webhooks. The "simplest" path is `$stripe->subscriptions->retrieve(...)` — it always returns the latest data without any cache management.

### Warning Signs
- `StripeClient` or `\Stripe\Subscription` imported in FeatureGate or EntitlementService
- Entitlement computation takes 200ms+ (visible in profiling)
- Users report "features not working" during Stripe incidents
- Feature access works in development but breaks when the Stripe API key is rotated
- Entitlement tests require a Stripe mock or a live Stripe test key

### Why Harmful
Every feature access check makes an HTTP call to Stripe. This adds latency to every page load, degrades user experience, and couples your application's core functionality to a third-party API's availability. During a Stripe outage, all paying customers lose feature access — even though they've already paid. The entitlement computation becomes non-deterministic and uncacheable.

### Real-World Consequences
- Stripe partial outage (2023): paying customers locked out of features for 4 hours because every access check timed out calling Stripe API
- Feature access check on a dashboard with 50 items = 50 Stripe API calls, each 300ms = 15 seconds of page load time
- Stripe API key rotation breaks all feature access until the key is updated in every code path
- Cannot cache entitlement results because the computation depends on an external system

### Preferred Alternative
Cache Stripe state locally via webhooks (Subscriptions table). Compute entitlements from the local cache as a pure function of database state. Use the BillingGateway wrapper for billing operations and the EntitlementService for access decisions.

### Refactoring Strategy
1. Ensure webhook handlers update the local Subscriptions table on every Stripe event
2. Create the EntitlementService that computes entitlements from local database state only
3. Replace all `$stripe->subscriptions->retrieve()` calls in entitlement code with database queries
4. Add entitlement caching with webhook-driven invalidation
5. Verify that feature access works during Stripe API downtime (simulate by revoking Stripe API key in staging)

### Detection Checklist
- [ ] Is `StripeClient` or `\Stripe\Subscription` imported in any entitlement or feature gate class?
- [ ] Does entitlement computation make HTTP calls to external APIs?
- [ ] Do feature tests require a Stripe API key to pass?
- [ ] What is the latency of a feature access check (should be < 10ms)?
- [ ] Can users access features during a simulated Stripe outage?

### Related Rules/Skills/Trees
- Rule 1: Separate Billing State From Entitlement Decisions
- Rule 2: Entitlement Computation Must Be a Pure Function of Local State
- Implement Plan, Feature & Entitlement Model (06-skills.md)
- Entitlement Caching — TTL Duration and Invalidation Strategy (07-decision-trees.md)

---

## 2. Hardcoded Plan-Feature Mappings

### Category
Architecture · Maintainability

### Description
Defining which features belong to which plan in application code (arrays, config files, enum methods) instead of in the plan_feature pivot table, requiring a code deploy to change plan features.

### Why It Happens
During initial development, hardcoding is fast: `protected const PRO_FEATURES = ['api-access', 'white-label'];` is easier than migrations, seeders, and admin UIs. The feature set is small and the team is building quickly. Over time, the hardcoded array grows, and the overhead of database management feels unnecessary for "just a few features."

### Warning Signs
- `Plan::PRO_FEATURES` or similar static arrays in model files
- Plan features visible in Git diffs rather than database migration files
- Product manager asks "can we add a feature to the Pro plan?" and the answer is "it needs a deploy"
- No plan_feature pivot table in the database schema
- Feature changes in staging require a code merge, not a database operation

### Why Harmful
Every feature change requires a code deploy. Product managers cannot manage plans without engineering involvement. A/B testing plan configurations is impossible without environment-specific code branches. Revenue operations (adding a feature mid-cycle as a promotion) requires a deployment pipeline. The plan model is coupled to application code, not business configuration.

### Real-World Consequences
- Adding a feature to Enterprise plan: 2-day deploy cycle instead of instant database update
- Sales team wants to offer a custom plan for a big client: requires a custom branch and special deploy
- Plan feature audit: cannot answer "what features did the Pro plan include on March 15?" because the code was since redeployed
- Cross-environment drift: staging has old plan code, production has new — features differ despite "same" plan

### Preferred Alternative
Store plan-to-feature mappings in the `plan_feature` database pivot table. Seed all plan-feature relationships in a seeder. Provide an admin UI or CLI command to manage plan features at runtime.

### Refactoring Strategy
1. Create `features` table and `plan_feature` pivot table via migration
2. Extract all hardcoded plan-feature arrays into a seeder
3. Update Plan model to use `belongsToMany(Feature::class)` relationship
4. Update EntitlementService to query the pivot table instead of reading constants
5. Remove hardcoded arrays from Plan model
6. Verify all tests pass with the new database-driven approach

### Detection Checklist
- [ ] Are plan features defined as static arrays or constants in PHP code?
- [ ] Does a plan feature change require a code deploy?
- [ ] Is there a `plan_feature` pivot table in the database?
- [ ] Can a product manager add a feature to a plan without engineering?
- [ ] Do staging and production plan definitions match without code parity?

### Related Rules/Skills/Trees
- Rule 6: Plans Are Immutable After Release
- Implement Plan, Feature & Entitlement Model (06-skills.md)
- Plan Versioning — Immutable Plans vs Mutable Plans with Versioning (07-decision-trees.md)

---

## 3. Boolean-Only Entitlement Model

### Category
Architecture · Maintainability

### Description
Modeling entitlements as a simple boolean (has feature or doesn't) without support for usage limits, feature configuration, or consumption tracking.

### Why It Happens
The simplest entitlement model is `can(team, feature) → boolean`. This works for basic scenarios and is easy to implement. As the product evolves, features need limits ("10 team members", "1000 API calls/day"), config values ("white-label with custom logo URL"), and consumption tracking — but the existing boolean model doesn't support any of that.

### Warning Signs
- `EntitlementSet::can(string $key): bool` is the only query method
- No usage tracking table exists in the database
- Plan features are simple string arrays: `['api-access', 'white-label']`
- Product requirements mention "users on Pro get 10 team members" but no schema supports limits
- Feature limits enforced in validation rules instead of the entitlement layer

### Why Harmful
The boolean model cannot express real-world SaaS requirements: usage limits, per-feature configuration, consumption tracking, or graduated access. All limitations must be enforced ad-hoc in controllers, validation rules, and Blade templates — scattered, inconsistent, and easy to bypass. When the product team wants to add a limit, the architecture doesn't support it without a refactor.

### Real-World Consequences
- "Pro includes 10 team members" enforced in 7 different controllers with 7 different limit values
- Adding usage-based pricing requires a full entitlement model rewrite (months of work)
- Customer exceeds limit because the check was in one controller but bypassed in another
- Cannot display "3 of 10 API keys used" in the UI because there's no consumption tracking
- Feature configuration values (custom domain, logo URL) stored as separate tables with no entitlement integration

### Preferred Alternative
Use a rich entitlement model with `Entitlement` value objects that carry: feature reference, granted boolean, source (plan/override), config array, usage limit value, and usage consumed count. Support the `EntitlementSet` query methods `can()`, `get()`, `isExhausted()`, and `remainingUsage()`.

### Refactoring Strategy
1. Create `Entitlement` readonly class with feature, granted, config, usageLimit, usageConsumed fields
2. Create `EntitlementSet` collection class with rich query capabilities
3. Add UsageLimit and UsageRecord models with period-scoped aggregation
4. Update EntitlementService to build full Entitlement objects from plan config
5. Migrate all boolean checks (`can()`) to use the new model (backward compatible)
6. Add usage limit enforcement in the entitlement layer
7. Phase out ad-hoc limit checks in controllers

### Detection Checklist
- [ ] Does the entitlement model support usage limits and consumption tracking?
- [ ] Can you express "team has api-access with 1000 calls/day remaining" in the current model?
- [ ] Are feature limits enforced in controllers rather than the entitlement layer?
- [ ] Is there a UsageRecord table for tracking consumption?
- [ ] Can the UI display remaining usage without custom queries?

### Related Rules/Skills/Trees
- Rule 1: Separate Billing State From Entitlement Decisions
- Implement Plan, Feature & Entitlement Model (06-skills.md)
- Usage Tracking — Synchronous vs Asynchronous Record Writes (07-decision-trees.md)

---

## 4. Fail-Open Entitlement Computation

### Category
Security · Critical

### Description
When entitlement computation throws an exception (database error, null reference, logic bug), the system grants access by default instead of denying it, creating a privilege escalation vulnerability.

### Why It Happens
Default-allow seems "user-friendly" — it prevents a bug from locking everyone out. During development, the developer wraps the entitlement check in a try-catch that returns `true` on error, reasoning that "this should never fail" and "if it does, at least users won't be blocked." This assumption doesn't hold in production when unexpected states occur.

### Warning Signs
- Try-catch in FeatureGate or EntitlementService that returns `true` on exception
- `catch (\Throwable $e) { return true; }` or `catch (\Exception $e) { return true; }` in entitlement code
- No logging when entitlement computation fails
- Tests only cover the happy path (no error state tests)

### Why Harmful
Any failure in the entitlement pipeline — a null subscription reference, a missing plan, a database connection error, a corrupted cache entry — silently grants access to all features for all users. This is a privilege escalation vulnerability. An attacker who can trigger an entitlement computation failure (e.g., by causing a specific database load condition) gets unrestricted access to paid features.

### Real-World Consequences
- Database connection pool exhaustion causes entitlement queries to fail → all users get enterprise features for free
- Corrupted entitlement cache entry → that team gets unlimited access until the cache is cleared
- Deployed bug in override resolution → null pointer exception grants access instead of denying
- Support investigation: "Why did this free-tier team have admin panel access?" — unknown, exception was swallowed

### Preferred Alternative
Fail closed: every exception in the entitlement computation path must result in denied access. Log the exception for alerting. Never return `true` from a catch block in entitlement code.

### Refactoring Strategy
1. Audit all try-catch blocks in entitlement-related classes
2. Replace `return true` with `return false` in catch blocks
3. Add error logging with team ID and feature key context
4. Add a health-check to verify entitlement computation works for a known team
5. Test entitlement behavior when the database is unavailable (simulate with test)

### Detection Checklist
- [ ] Are there any `return true` statements inside catch blocks in entitlement code?
- [ ] Does entitlement computation fail closed (deny on error)?
- [ ] Are entitlement computation failures logged with context?
- [ ] Is there a test that verifies behavior when the database connection fails?
- [ ] Is there a test that verifies behavior with null subscription or missing plan?

### Related Rules/Skills/Trees
- Rule 2: Entitlement Computation Must Be a Pure Function of Local State
- Implement Plan, Feature & Entitlement Model (06-skills.md)

---

## 5. Silent Entitlement Override With No Audit Trail

### Category
Security · Compliance

### Description
Granting or revoking feature access for specific teams via direct database manipulation or ad-hoc code, without recording who authorized the change, when, or why.

### Why It Happens
Support needs to quickly grant a customer access to a premium feature as compensation. The fastest path is a direct database update. Operations staff want to resolve the customer issue immediately. The audit trail feels like overhead when the customer is waiting. Over time, dozens of overrides accumulate with no record.

### Warning Signs
- `DB::table('entitlement_overrides')->insert(...)` in support scripts or CLI commands
- Overrides table has records with null `reason` or `created_by` columns
- Cannot answer "why does team X have feature Y?" during a billing audit
- Expired overrides still active because no cleanup job exists
- Override granted 6 months ago, nobody remembers why, customer now expects it permanently

### Why Harmful
Without audit trails, overrides become permanent shadow entitlements. Expired promotional access persists indefinitely. Auditors cannot verify that access is appropriately authorized. Staff turnover means nobody remembers why an override exists. Revoking an override becomes dangerous because nobody knows if it was granted for a legitimate reason.

### Real-World Consequences
- SOC2 audit: auditor asks "explain every access grant that bypasses the subscription model" — cannot answer
- Customer on Starter plan has Enterprise features because someone granted an override 18 months ago and left the company
- Revoking an override breaks a partner integration because the reason was never documented
- Sales team gives away premium features without tracking → revenue leakage discovered months later
- Compliance mandate: "revoke all access for the terminated contract" — but half the overrides aren't documented

### Preferred Alternative
Create a `GrantFeatureOverrideAction` that: inserts the override record, logs an audit entry (actor, action, target, reason, expiration), and invalidates the entitlement cache. Use this action from admin UI and CLI commands. Never skip the audit log.

### Refactoring Strategy
1. Create `GrantFeatureOverrideAction` and `RevokeFeatureOverrideAction` classes
2. Create an `AuditLog` entry model or table for override operations
3. Backfill reasons for existing overrides where possible (support ticket numbers, email threads)
4. Add expiration dates to all existing overrides (default: 30 days)
5. Create a scheduled job that alerts on and eventually removes expired overrides
6. Train operations team to use the admin UI, not direct database access

### Detection Checklist
- [ ] Does every entitlement override have a `reason` field populated?
- [ ] Is there an audit trail recording who created each override and when?
- [ ] Do overrides have expiration dates to prevent permanent shadow access?
- [ ] Is there a scheduled cleanup job for expired overrides?
- [ ] Can the support team answer "why does this team have this access?" for every override?
- [ ] Are direct database inserts for overrides blocked or detected?

### Related Rules/Skills/Trees
- Rule 5: Entitlement Overrides Require Audit Trail
- Implement Plan, Feature & Entitlement Model (06-skills.md)
- Implement Stripe Webhook Idempotency & Event Deduplication (06-skills.md)
