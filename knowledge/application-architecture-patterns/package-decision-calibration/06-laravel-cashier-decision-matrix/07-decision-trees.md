# Decision Trees for Laravel Cashier Decision Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Cashier Decision Matrix |
| Related KUs | 01-calibrated-package-recommendation, 03-package-wrapper-boundary, 04-package-escape-hatch-strategy |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-CSH-001 | Cashier or stripe/stripe-php direct? | P0 |
| DT-CSH-002 | Cashier or Paddle/LemonSqueezy? | P0 |
| DT-CSH-003 | How should webhooks be processed? | P1 |
| DT-CSH-004 | Should Cashier's Billable methods be overridden? | P1 |

---

## DT-CSH-001: Cashier or stripe/stripe-php Direct?

### Decision Context
The team needs Stripe integration for billing. Cashier provides subscription lifecycle abstractions, invoices, trials, proration, and customer portal — but at the cost of Stripe lock-in and Eloquent model coupling. Direct `stripe/stripe-php` provides full control but requires building subscription management from scratch.

### Decision Criteria
- Is the business model subscription-based or one-off payments?
- Does the team have prior Stripe integration experience?
- Are subscription lifecycle features needed? (trials, proration, invoices, portal)
- Is Stripe lock-in acceptable for the next 1-2 years?

### Decision Tree

```
Is the primary business model subscription SaaS with recurring billing?
├── NO (one-off payments, marketplace, donations) → USE stripe/stripe-php DIRECT.
│   Cashier's Billable trait and subscription tables provide no value for one-off flows.
├── YES → Does the team have 2+ engineers with prior Stripe integration experience?
    ├── YES → Do they value full API control over subscription lifecycle abstractions?
    │   ├── YES → USE stripe/stripe-php DIRECT. Build subscription management custom.
    │   │   └── BUT: budget 3-4 weeks for subscription lifecycle, webhooks, portal integration.
    │   └── NO → USE CASHIER. The team's Stripe expertise will help with escape hatches.
    └── NO (team is new to Stripe) → USE CASHIER.
        Cashier reduces the Stripe learning curve significantly.
        └── BUT: wrap Cashier behind BillingGateway from day one.
```

### Rationale
Cashier's value proposition is subscription lifecycle management. If the business model isn't subscription-based, Cashier provides no value — its Billable trait, subscription tables, and webhook handling are all subscription-oriented. For teams with deep Stripe expertise, direct API control may be preferred — but they're signing up to build trial handling, proration, invoice previews, and customer portal integration themselves.

### Recommended Default
**Default to Cashier for subscription SaaS with limited Stripe experience. Default to stripe/stripe-php direct for one-off payments or teams with deep Stripe expertise.**

### Risks Of Wrong Choice
- **Cashier for one-off payments**: Billable trait adds unnecessary columns to users table. Subscription-oriented API is awkward for single charges. The package provides negative value.
- **stripe/stripe-php for subscriptions**: Team must build trial handling, proration, invoice previews, webhook processing, and customer portal — 3-4 weeks of work that Cashier provides out of the box.

### Related Rules
- Wrap Cashier Behind a BillingGateway Interface from Day One
- Use Cashier's Built-In Webhook Handler — Do Not Write Your Own

### Related Skills
- Package Wrapper/Boundary Pattern (KU 03)

---

## DT-CSH-002: Cashier or Paddle/LemonSqueezy?

### Decision Context
Cashier (Stripe) vs. Paddle vs. LemonSqueezy is fundamentally a provider decision, not just a package decision. The choice affects tax compliance, payment method availability, geographic reach, and the merchant relationship with the payment processor.

### Decision Criteria
- Does the business need MOR (Merchant of Record) for global tax compliance?
- Is the target market global with complex VAT/GST requirements?
- Do customers expect local payment methods (iDEAL, SEPA, etc.) that Paddle provides natively?
- Is Stripe available in the business's country of operation?
- Does the team have existing Stripe knowledge or infrastructure?

### Decision Tree

```
Does the business need MOR (Merchant of Record) for tax compliance?
├── YES → Does the business sell digital products globally?
│   ├── YES → USE PADDLE or LEMONSQUEEZY. Cashier/Stripe requires self-handling VAT/GST.
│   │   └── Paddle: more mature, more payment methods, higher fees.
│   │   └── LemonSqueezy: simpler, lower fees, younger platform.
│   └── NO (physical goods) → MOR may not apply. Continue to next question.
├── NO → Is Stripe available in the business's country AND the target market countries?
    ├── NO → USE PADDLE or alternative. Stripe's geographic coverage has gaps.
    ├── YES → Does the business need local payment methods (iDEAL, SEPA, Bancontact)?
        ├── YES (European market focus) → Paddle supports these natively. Cashier/Stripe requires manual setup.
        └── NO → USE CASHIER (Stripe). Stripe's ecosystem (Connect, Radar, Sigma, Atlas) is unmatched.
            └── Accept the tradeoff: Stripe lock-in, US-centric tax handling.
```

### Rationale
Paddle and LemonSqueezy are MORs — they handle tax compliance globally. For a SaaS selling digital products to EU customers, this alone can justify Paddle over Cashier. Cashier/Stripe requires the business to register for VAT in every EU country where customers exist — a significant operational burden. However, Stripe's ecosystem (Connect for marketplaces, Radar for fraud, Sigma for analytics, Atlas for incorporation) has no equivalent in Paddle/LemonSqueezy. The choice depends on whether tax compliance or ecosystem depth is the priority.

### Recommended Default
**Default to Cashier (Stripe) for US-first SaaS with simple tax requirements. Default to Paddle for global digital product SaaS needing MOR.** LemonSqueezy for smaller/earlier stage SaaS preferring simplicity.

### Risks Of Wrong Choice
- **Cashier for global digital SaaS**: Team must self-handle EU VAT registration, remittance, and compliance. Operational cost and risk increase significantly.
- **Paddle for US-only SaaS with Stripe ecosystem needs**: Missing out on Stripe Connect, Radar, and the broader Stripe ecosystem. Paying MOR premium for tax handling the business doesn't need.

### Related Rules
- Wrap Cashier Behind a BillingGateway Interface from Day One

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-CSH-003: How Should Webhooks Be Processed?

### Decision Context
Cashier offers built-in webhook handling for Stripe webhooks. For high-volume applications, synchronous webhook processing can become a bottleneck. Queueing webhook processing improves throughput but adds complexity and potential state sync delays.

### Decision Criteria
- What is the expected webhook volume (events/minute)?
- Are webhook events latency-sensitive (must be processed within seconds)?
- Is the application's queue infrastructure robust (Redis + Horizon)?
- What is the impact of delayed webhook processing on user experience?

### Decision Tree

```
Expected webhook volume > 50 events/minute at peak?
├── NO → SYNCHRONOUS PROCESSING is acceptable. Cashier's default is sufficient.
├── YES → Is webhook latency critical (<5 seconds from event to state update)?
    ├── YES → SYNCHRONOUS with worker pool. Keep processing fast but scale workers horizontally.
    │   └── Use a dedicated supervisor with high maxProcesses and low timeout (30s).
    ├── NO → QUEUED PROCESSING. Push webhook events to a 'webhooks' queue.
        └── MUST: monitor queue depth. Backlogged webhooks = stale subscription state.
        └── MUST: implement graceful degradation if webhook queue is delayed.
```

### Rationale
Synchronous webhook processing is simpler and ensures immediate state sync. When Stripe sends a `customer.subscription.updated` event, the subscription state is updated before the response is returned. Queued processing decouples event receipt from processing — the webhook endpoint returns 200 immediately, and the queue worker processes the event later. This improves throughput but introduces a delay between the Stripe event and the local state update. If the delay exceeds a few seconds, users may see stale subscription status.

### Recommended Default
**Synchronous processing for apps with <50 webhook events/minute. Queued processing for higher volume, with a dedicated 'webhooks' supervisor in Horizon.**

### Risks Of Wrong Choice
- **Synchronous at high volume**: Webhook endpoint becomes a bottleneck. Stripe retries undelivered webhooks, compounding the problem.
- **Queued with latency sensitivity**: Users see stale subscription status after payment or cancellation. Support tickets increase.

### Related Rules
- Use Cashier's Built-In Webhook Handler — Do Not Write Your Own
- Monitor Cashier's Sync Health

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## DT-CSH-004: Should Cashier's Billable Methods Be Overridden?

### Decision Context
Cashier's Billable trait adds methods like `newSubscription()`, `subscribed()`, and `charge()` directly to the User model. When the subscription logic needs to differ from Cashier's defaults, the temptation is to override these trait methods. This decision tree evaluates whether overriding is safe or whether the wrapper pattern should be used instead.

### Decision Criteria
- Is the needed behavior change a modification of Cashier's logic or an addition to it?
- Are the methods being overridden documented as extension points?
- What percentage of Billable methods would need overriding?
- What is the impact on Cashier upgrades?

### Decision Tree

```
Is the needed change an ADDITION to Cashier's behavior (not a modification)?
├── YES → Do NOT override. Add the behavior in a service class that calls Cashier.
│   └── Example: send Slack notification after subscription creation → event listener, not override.
├── NO (modification needed) → Is the method documented as an extension point by Cashier?
    ├── YES → Override MAY BE SAFE. But test against every Cashier upgrade.
    │   └── Document the override and the reason. Check Cashier's changelog on every upgrade.
    ├── NO → Do NOT override. Use a wrapper service instead.
        └── Overriding internal/protected methods breaks on Cashier upgrades.
        └── The wrapper service calls Cashier methods and applies the modification before/after.
```

### Rationale
Cashier's Billable trait methods are not designed as extension points. Overriding `newSubscription()`, `subscribed()`, or other Billable methods creates a dependency on Cashier's internal implementation. When Cashier upgrades, these internals may change, breaking the overrides. The wrapper pattern avoids this entirely: instead of modifying how Cashier works, a service class orchestrates Cashier calls and applies modifications before or after. The wrapper depends on Cashier's public API, which is stable; overrides depend on Cashier's internals, which are not.

### Recommended Default
**Never override Billable methods. Use a wrapper service class that calls Cashier and applies modifications around the calls.** If a method is explicitly documented as overridable by Cashier, it may be safe — but verify on every upgrade.

### Risks Of Wrong Choice
- **Overriding Billable methods**: Cashier v15 changes a protected method signature. The override breaks. The team must either fix the override (risky, time-consuming) or freeze Cashier version (security risk).
- **Wrapper for trivial addition**: A single-line event listener becomes a 30-line service class. Over-engineering for simple cases.

### Related Rules
- Wrap Cashier Behind a BillingGateway Interface from Day One

### Related Skills
- Package Wrapper/Boundary Pattern (KU 03)
