# Anti-Patterns for Laravel Cashier Decision Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Cashier Decision Matrix |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-CSH-001 | Cashier-as-CRM | High | Medium |
| AP-CSH-002 | Cashier in Every Request | High | High |
| AP-CSH-003 | Cashier for Non-Stripe | Critical | Low |
| AP-CSH-004 | Dual Webhook Handling | Critical | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-ESC-001 (The Bottomless Escape Hatch) — from KU 04
- AP-WRP-001 (The Passthrough Wrapper) — from KU 03
- AP-FNA-004 (Assumption Override Optimism) — from KU 02

---

## AP-CSH-001: Cashier-as-CRM

### Category
Architecture | Domain Modeling

### Description
Using Cashier's subscription data (the `subscriptions` table, `$user->subscribed()`, Stripe customer objects) as the primary customer database and business domain model. Cashier's data becomes the source of truth for customer relationships, business metrics, and application logic — rather than a mirror of Stripe's state.

### Why It Happens
- Convenience: Cashier's tables are already there, so they're used for business queries
- "Stripe is the source of truth, so Cashier's mirror must be too" — confusing data mirroring with domain modeling
- Not building a separate customer/subscription domain model because "Cashier already handles subscriptions"
- Underestimating how much business logic needs subscription data beyond what Cashier provides

### Warning Signs
- Business metrics queries read directly from the `subscriptions` table
- Customer lifetime value (LTV) is calculated from Cashier's invoice data
- Support tools query `$user->subscriptions` directly instead of a business-level subscription model
- Cashier's `stripe_status` column is used directly in business logic (`if ($subscription->stripe_status === 'active')`)
- Customer communications reference Cashier's internal subscription IDs

### Why Harmful
Cashier's data model mirrors Stripe's data model, not the business's domain model. The `stripe_status` column values (`'active'`, `'trialing'`, `'past_due'`) are Stripe concepts, not business concepts. When the business needs to introduce a "paused" state (not a Stripe concept), there's no place for it in Cashier's schema. Reporting queries that read Cashier's tables directly couple the business's analytics to Stripe's data model — if the payment provider changes, every report breaks. Cashier is a sync mechanism, not a domain model.

### Real-World Consequences
- A SaaS company builds their entire customer analytics dashboard on Cashier's `subscriptions` table. Two years later, they add Paddle as a second payment provider. The analytics dashboard only works for Stripe customers. The team must rewrite every report to use a unified subscription domain model that abstracts over both Stripe and Paddle data. The rewrite takes 6 weeks because analytics logic is deeply coupled to Cashier's table structure.

### Preferred Alternative
Build a `CustomerSubscription` domain model that represents the business concept of a subscription. Cashier's `Subscription` model is an infrastructure concern — it syncs with Stripe. The `CustomerSubscription` domain model reads from Cashier but adds business concepts (paused, grace-period-extended, manual-override) that Stripe doesn't have. Business logic, metrics, and reporting query the domain model, never Cashier's tables directly.

### Refactoring Strategy
1. Identify all queries that read from Cashier's tables directly (subscriptions, subscription_items, the Billable columns on users).
2. Create a `CustomerSubscription` model (or similar) that wraps Cashier's data with business semantics.
3. Migrate business logic queries from Cashier tables to the domain model.
4. Cashier tables become an infrastructure detail — only the adapter and sync logic touch them.

### Detection Checklist
- [ ] Business reports query `subscriptions` table directly
- [ ] `stripe_status` values are used in business logic conditionals
- [ ] Customer support tools display Stripe subscription IDs to users
- [ ] No business-level subscription model exists separate from Cashier
- [ ] The team cannot describe the subscription lifecycle without referencing Stripe/Cashier terms

### Related Rules
- Wrap Cashier Behind a BillingGateway Interface from Day One

### Related Skills
- Package Wrapper/Boundary Pattern (KU 03)

---

## AP-CSH-002: Cashier in Every Request

### Category
Performance

### Description
Checking `$user->subscribed()` or `$user->onTrial()` in middleware that runs on every request, without caching the result. Every page load hits the `subscriptions` table — often with N+1 patterns when loading related subscription data. The database is hammered with subscription checks.

### Why It Happens
- "Subscription status must be real-time" — over-prioritizing accuracy over performance
- Middleware is the easiest place to add the check, so it goes there without considering cost
- Not distinguishing between "must be real-time" (payment-gated features) and "can be cached for 5 minutes" (UI badges)
- Developers don't see the database impact locally because local traffic is a single user

### Warning Signs
- `$user->subscribed()` or `$user->subscription()` appears in global middleware
- The `subscriptions` table is the most-queried table in the database
- Every page load includes 1-3 subscription-related queries
- "User logged in" event triggers subscription re-check even when it hasn't changed

### Why Harmful
Subscription status changes infrequently — at most a few times per user per month (payment, cancellation, trial end). Checking it on every request is querying an infrequently-changing value on every page load. In a system with 10K daily active users making 50 requests each, that's 500K subscription queries per day — for data that changed maybe 100 times. The database load is 99.98% wasted. This slows down every page for every user.

### Real-World Consequences
- An app checks `$user->subscribed()` in global middleware. At 5K concurrent users during a launch event, the `subscriptions` table becomes the database bottleneck. Page load times increase from 200ms to 2s. The launch is a disaster. After the incident, the team adds a 5-minute cache on subscription status — a 2-hour fix that would have prevented the entire incident.

### Preferred Alternative
Cache subscription status with a short TTL (5-15 minutes). Load it once during the auth stack (in a middleware after authentication but before routing) and store it on the user object or in the session. Invalidate the cache on webhook events that change subscription state (`customer.subscription.updated`, `invoice.payment_succeeded`). Use the cached value for UI checks (badges, menus). Only check directly against the database for payment-gated actions.

### Refactoring Strategy
1. Identify all middleware, services, and Blade templates that call `$user->subscribed()` or `$user->onTrial()`.
2. Move subscription status loading to a single post-auth middleware that caches the result.
3. Add cache invalidation in webhook event listeners for subscription state changes.
4. Verify that subscription status cache is cleared in tests (`Cache::flush()` in setUp).

### Detection Checklist
- [ ] `$user->subscribed()` appears in global middleware
- [ ] No caching layer exists between the request and the subscription status check
- [ ] The `subscriptions` table is one of the top-5 most queried tables in production
- [ ] Database query logs show subscription queries on every page load

### Related Rules
- Monitor Cashier's Sync Health

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## AP-CSH-003: Cashier for Non-Stripe

### Category
Architecture | Provider Lock-in

### Description
Using Cashier as the billing abstraction while also needing to support non-Stripe payment providers (Paddle, Braintree, Adyen). Since Cashier is Stripe-only, the team builds a second billing path for non-Stripe payments — creating two parallel billing systems that must be maintained, tested, and reconciled.

### Why It Happens
- "We'll use Cashier for Stripe and build a separate adapter for Paddle" — without realizing the adapter must duplicate Cashier's entire feature set
- Starting with Cashier (Stripe-only) and later adding Paddle as a business requirement, hoping Cashier will gain multi-provider support
- Underestimating how much Cashier does: subscriptions, invoices, trials, proration, webhooks, portal — all of which must be rebuilt for the second provider

### Warning Signs
- Codebase has a `StripeCashierAdapter` AND a `PaddleAdapter` that both implement `BillingGateway`
- The PaddleAdapter has 5x more code than the Stripe adapter because it's rebuilding Cashier features
- Subscription state in the database has a `provider` column
- "For Stripe customers, we use Cashier. For Paddle customers, we use the custom adapter."

### Why Harmful
Cashier provides 80% of the billing system's value — subscription lifecycle, webhook handling, invoice previews, proration, customer portal. When a second provider is added, all of that must be rebuilt for the second provider. The team ends up maintaining two billing systems: Cashier (which handles Stripe well) and a custom billing system (which handles Paddle poorly because it lacks Cashier's years of development). The total system complexity is more than double the single-provider complexity because the two systems must produce consistent behavior.

### Real-World Consequences
- A team builds a SaaS with Cashier (Stripe). Customer demand requires Paddle support. The team adds a `PaddleAdapter` implementing `BillingGateway`. The adapter must rebuild: subscription lifecycle, webhook handling, invoice previews, trial management, proration logic, and customer portal — all of which Cashier provided for free for Stripe. The PaddleAdapter takes 8 weeks to build and has bugs for the first 6 months. The billing system now has two codebases with different bug profiles.

### Preferred Alternative
If multi-provider is a known requirement, use a billing abstraction that supports multiple providers from the start — or accept the single-provider constraint and document it as a conscious tradeoff. Do not use Cashier for Stripe while building custom for another provider. Either: (a) use a multi-provider billing platform (Paddle MOR, Chargebee, Recurly), or (b) stay Stripe-only and document the tradeoff. Cashier + custom non-Stripe = two billing systems.

### Refactoring Strategy
1. Acknowledge that Cashier is not multi-provider. Decide: (a) go all-in on Stripe and remove the non-Stripe adapter, or (b) exit Cashier entirely and adopt a multi-provider platform.
2. If exiting: use the escape hatch migration path (KU 04) — migrate methods one at a time from Cashier to the new unified adapter.
3. Do not maintain both long-term. The dual-system approach is a transitional state, not a permanent architecture.

### Detection Checklist
- [ ] Codebase contains adapters for multiple payment providers alongside Cashier
- [ ] The non-Cashier adapter duplicates subscription lifecycle, invoice, trial, or proration logic
- [ ] Database has a `provider` column on subscription-related tables
- [ ] "We support Stripe through Cashier and Paddle through custom" is the stated architecture

### Related Rules
- Wrap Cashier Behind a BillingGateway Interface from Day One

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- When NOT To Build Custom (KU 05)

---

## AP-CSH-004: Dual Webhook Handling

### Category
Reliability | Data Integrity

### Description
Running Cashier's built-in webhook handler AND a custom Stripe webhook handler in parallel. Cashier updates subscription state via its handler; the custom handler also updates subscription state — possibly with different logic. Two systems writing to the same database rows create state divergence.

### Why It Happens
- Cashier is added to an existing application that already has custom Stripe webhook handling
- "We need to handle Connect events, and Cashier doesn't handle those" — so a second webhook endpoint is added
- The custom handler was built first, Cashier was added later, and nobody removed the old handler
- Fear of losing "custom logic" by switching entirely to Cashier's handler

### Warning Signs
- Two routes handle Stripe webhooks: `/stripe/webhook` (Cashier) and `/webhooks/stripe` (custom)
- Database updates in both the Cashier webhook handler and a custom webhook handler
- Subscription state is sometimes updated by Cashier and sometimes by custom code
- "The webhook double-processing bug" is a known issue

### Why Harmful
Two systems updating the same data is a recipe for state divergence. Cashier's handler processes `customer.subscription.updated` and updates the `subscriptions` table. The custom handler processes the same event and also updates the `subscriptions` table — possibly with different logic, different timing, or different error handling. The result: subscription state that's neither Cashier-consistent nor custom-consistent. Users see incorrect subscription status. The root cause is always "which handler ran last."

### Real-World Consequences
- An app has Cashier AND a legacy custom webhook handler. The custom handler processes `invoice.payment_succeeded` and sets `subscription_status = 'active'` on the users table. Cashier also processes the event and updates the `subscriptions` table. The users table says "active" but the subscriptions table says "past_due." The support team sees both values and doesn't know which is correct. Every billing support ticket requires engineering investigation.

### Preferred Alternative
Use Cashier's built-in webhook handler exclusively. For events Cashier doesn't handle (Connect, Radar), add event listeners that react to Cashier's webhook processing — not a separate webhook endpoint. Cashier fires `Laravel\Cashier\Events\WebhookReceived` for every webhook event. Listen for that event and add custom logic there. The subscription state is only updated by Cashier — custom logic handles non-state concerns (analytics, CRM sync, Slack notifications).

### Refactoring Strategy
1. Identify all custom webhook handling code that touches subscription state.
2. Migrate non-state logic (analytics, notifications, CRM sync) to listeners on `WebhookReceived`.
3. Remove custom subscription state updates — let Cashier's handler own state exclusively.
4. Remove the duplicate webhook endpoint once all custom logic is migrated.
5. Run both handlers in parallel for one billing cycle, comparing outputs to verify consistency, before removing the custom handler.

### Detection Checklist
- [ ] Two or more Stripe webhook endpoints exist in the routes file
- [ ] Custom code updates `subscriptions` table or Billable columns on users table in response to webhooks
- [ ] Subscription state bugs are described as "sometimes it works, sometimes it doesn't"
- [ ] The webhook secret is used in more than one place in the codebase

### Related Rules
- Use Cashier's Built-In Webhook Handler — Do Not Write Your Own
- Monitor Cashier's Sync Health

### Related Skills
- Package Escape Hatch Strategy (KU 04)
