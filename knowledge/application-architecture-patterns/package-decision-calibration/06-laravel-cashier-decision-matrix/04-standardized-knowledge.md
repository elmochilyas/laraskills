# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Cashier Decision Matrix |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Calibrated package recommendation, Package fit/non-fit analysis, Billing domain knowledge |
| Related KUs | Package wrapper/boundary pattern, Package escape hatch strategy, SaaS billing architecture |
| Source | domain-analysis.md |

---

# Overview

Laravel Cashier is the standard Stripe subscription billing package for Laravel. It provides subscription management, invoices, free trials, proration, customer portals, and payment method management through a fluent Eloquent-based API. However, Cashier is a Stripe-only, subscription-focused package. This decision matrix provides a complete fit/non-fit analysis for Cashier in the calibrated recommendation format, including its escape hatch, alternatives, and detailed tradeoff analysis. Every team evaluating Cashier should work through this matrix before committing.

---

# Core Concepts

- **Billable trait**: `Laravel\Cashier\Billable` adds subscription methods directly to the User model. `$user->newSubscription('default', 'price_monthly')->create($paymentMethodId)`.
- **Stripe-first**: Cashier wraps the Stripe API. All subscription data is mirrored in the `subscriptions` and `subscription_items` tables but Stripe is the source of truth.
- **Subscription lifecycle**: `create()` → trial → active → `cancel()` (grace period) → `cancelNow()` → expired. Cashier handles webhook synchronization.
- **Customer portal**: `$user->redirectToBillingPortal()` provides a Stripe-hosted portal for customers to manage payment methods, invoices, and plan changes.
- **Proration**: Cashier automatically calculates proration when users change plans mid-cycle.
- **Cashier's sync model**: Cashier keeps local database copies of Stripe subscription state. Webhooks update these copies. This means database and Stripe can diverge.

---

# When To Use

- Stripe is the sole payment provider (no multi-gateway requirement)
- The business model is subscription SaaS with recurring billing
- Subscription plans map cleanly to Stripe products and prices
- The application needs invoices, free trials, proration, and customer portal
- Team has no prior Stripe integration experience (Cashier reduces Stripe learning curve)
- Single billing provider is acceptable for the foreseeable future (1-2 years)

## When NOT To Use

- Marketplace payouts (Stripe Connect) — Cashier has no Connect abstractions
- Multiple payment providers required (Stripe + Paddle + Adyen)
- Complex metered/usage billing beyond simple quantity multipliers
- Custom entitlement engine not expressible as Stripe price metadata
- Need to support non-Stripe gateways at launch or within 12 months
- Primary business model is one-off payments, not subscriptions
- Team already has deep Stripe expertise and prefers direct API control

---

# Best Practices

1. **Wrap Cashier behind a BillingGateway interface from day one** WHY: Cashier is a Stripe-only package with deep Eloquent integration. Wrapping it creates an exit path if Stripe is ever replaced and prevents Cashier types from leaking into business logic.

2. **Use Cashier's webhook handling, don't write your own** WHY: Subscription state synchronization is the hardest part of Stripe integration. Cashier's built-in webhook handler (`Cashier::webhook()`) handles subscription creation, cancellation, payment failures, and trial endings. Custom webhook handling is the #1 source of Cashier bugs.

3. **Use Stripe test clocks for time-sensitive tests** WHY: Subscription trials, proration, and expiration depend on time. Stripe test clocks let you advance time without waiting. Without test clocks, a trial expiration test takes 14 real days.

4. **Keep plan configuration in Stripe, not in code** WHY: Plans in Stripe's dashboard can be changed without deploying code. Plans hardcoded in `config/services.php` require a deployment for every price change.

5. **Monitor Cashier's sync health** WHY: The local database mirrors Stripe state. If webhooks fail, the local state is stale. Monitor the `stripe_status` column for unexpected values and the webhook failure rate.

---

# Architecture Guidelines

- **BillingGateway wrapper**:
  ```php
  interface BillingGateway
  {
      public function subscribeUserToPlan(string $userId, CreateSubscriptionData $data): SubscriptionResult;
      public function cancelSubscription(string $subscriptionId): void;
      public function getUpcomingInvoices(string $userId): array;
      public function chargeOnce(string $userId, int $amountInCents, string $description): SubscriptionResult;
      public function getBillingPortalUrl(string $userId): string;
  }
  ```

- **Cashier migration**: Cashier's migration creates `subscriptions`, `subscription_items`, and modifies the `users` table. These tables are Cashier-managed. Your application tables should reference `subscriptions.stripe_id`, not duplicate subscription state.

- **Webhook security**: Cashier's webhook controller verifies Stripe's signature automatically. Ensure the `STRIPE_WEBHOOK_SECRET` environment variable is set and the webhook route is excluded from CSRF protection.

---

# Performance Considerations

- **Subscription queries**: Cashier's `subscriptions` table is queried on every authenticated request if you check subscription status in middleware. Index `user_id` and `stripe_status`.
- **Invoice preview**: `$user->upcomingInvoice()` makes a synchronous API call to Stripe. Cache the result. Do not call this on every page load.
- **Customer portal**: The `redirectToBillingPortal()` method makes a synchronous Stripe API call to generate a portal session URL. This adds ~500ms to the redirect. Consider pre-fetching or lazy-loading the portal URL.
- **Webhook processing**: Cashier processes webhooks synchronously by default. For high-volume apps, queue webhook processing.

---

# Security Considerations

- **Webhook signature verification**: Cashier verifies Stripe webhook signatures automatically. Never disable signature verification in production.
- **Payment method storage**: Cashier stores payment method tokens, not raw card numbers. Stripe handles PCI compliance.
- **Idempotency**: Cashier does NOT automatically add idempotency keys. For charge operations, add idempotency keys to prevent double-charging on network retries.
- **Subscription state as authZ input**: Subscription status should influence authorization (Gates/Policies), but never be the sole authorization mechanism. A bug in webhook processing could grant access to an expired subscriber.

---

# Common Mistakes

**Mistake: Using Cashier for one-off payments without subscriptions**
- Description: Using Cashier's `charge()` method for e-commerce checkout when the app has no subscription model
- Cause: "We already have Cashier installed for something else"
- Consequence: Cashier's subscription-oriented API is awkward for single charges. The Billable trait adds unnecessary subscription columns to the users table.
- Better: Use `stripe/stripe-php` directly for one-off payments. Only introduce Cashier when subscriptions are needed.

**Mistake: Not handling Cashier's Stripe API version dependency**
- Description: Upgrading Cashier without checking the required Stripe API version
- Cause: Assuming Cashier upgrades are transparent
- Consequence: Cashier may send API parameters that the configured Stripe API version doesn't support, causing charge failures.
- Better: Pin the Stripe API version in the Stripe dashboard and only upgrade it in sync with Cashier upgrades.

**Mistake: Storing business-critical subscription state only in Stripe**
- Description: Treating Cashier's local database copy as "just a cache" and reading subscription state from Stripe API calls
- Cause: "Stripe is the source of truth"
- Consequence: Every subscription check makes a synchronous Stripe API call. Page loads take 500ms+. Rate limits are hit at scale.
- Better: Use Cashier's local database copy as the primary read source. Use Stripe API calls only for writes and webhook verification.

**Mistake: Overriding Cashier's Billable methods**
- Description: Extending or overriding `newSubscription()`, `subscribed()`, or other Billable methods for custom behavior
- Cause: "Our subscription logic is slightly different"
- Consequence: Cashier upgrades break the overrides. The team maintains a fork of Cashier's Billable trait.
- Better: Wrap the logic in a service that calls Cashier, rather than overriding Cashier itself.

---

# Anti-Patterns

- **Cashier-as-CRM**: Using Cashier's subscription data as the primary customer database. Cashier mirrors Stripe, not your business domain. Build your own customer/subscription domain models.
- **Cashier in every request**: Checking `$user->subscribed()` on every middleware/request without caching the result. This hits the database on every page load. Cache subscription status or load it once in the auth stack.
- **Cashier for non-Stripe:** There is no Cashier for Paddle or Braintree. Using Cashier and then writing a separate billing path for non-Stripe payments creates two billing systems.

---

# Escape Hatch

Cashier's escape hatch is `stripe/stripe-php` called directly from the `BillingGateway` adapter:

```php
class StripeCashierAdapter implements BillingGateway
{
    public function __construct(
        private StripeClient $stripe,
    ) {}

    public function charge(array $data): ChargeResult
    {
        if ($this->isConnectTransfer($data)) {
            // Escape hatch: Cashier has no Connect API
            return $this->chargeViaStripeDirect($data);
        }
        return $this->chargeViaCashier($data);
    }
}
```

**When to escape**: Stripe Connect transfers, complex metered billing, payment intents with custom metadata beyond Cashier's API, multi-provider routing.

**Migration path**: Move methods one at a time from the Cashier path to the direct Stripe path. Once all methods use the direct path, remove Cashier.

---

# Alternatives

| Alternative | Fits When | Tradeoff |
|-------------|-----------|----------|
| `stripe/stripe-php` direct | Team knows Stripe, needs full control, no subscription abstractions needed | No built-in subscription lifecycle, webhook handling, or customer portal |
| Paddle | SaaS globally, need tax compliance (VAT/GST), don't want Stripe merchant account | Different API model, fewer Laravel integrations, payment methods differ |
| LemonSqueezy | Digital products, need MOR (Merchant of Record), simpler than Paddle | Less mature, smaller ecosystem, no physical goods |
| Custom billing | Extremely unique business model not supported by any payment provider | 3-6 months build, ongoing maintenance, PCI compliance burden |

---

# Testing Impact

- **Test environment**: Requires Stripe test keys. Never use live keys in tests.
- **Stripe test clocks**: Required for testing trials, proration, subscription expiration. Test clocks can be advanced via the Stripe dashboard or API.
- **Http::fake() for Stripe API calls**: For unit tests, mock Stripe HTTP responses. For integration tests, use Stripe's test mode with test clocks.
- **Cashier's test helpers**: Cashier doesn't ship with extensive test fakes. Most testing relies on Stripe's test mode. Budget time for setting up test clock fixtures.
- **CI environment**: CI needs Stripe test keys or mocked HTTP layer. Test clock usage in CI may require API calls to create/advance clocks.

---

# Operational Impact

- **Webhook reliability**: Stripe webhooks are the backbone of subscription state synchronization. Implement webhook retry handling, idempotency, and monitoring. Failed webhooks = stale subscription state = wrong access decisions.
- **Stripe downtime**: When Stripe's API is degraded, subscription creation, cancellation, and invoice generation all fail. Implement graceful degradation — queue operations and retry.
- **Cache invalidation**: Cashier caches subscription state internally (model relationships). After webhook processing, clear relevant caches.
- **Monitoring**: Monitor Stripe webhook failure rate, subscription sync lag, and Cashier's exception rate. Cashier throws exceptions for payment failures, which must be handled in application code.
- **Stripe API versioning**: Stripe API versions are date-based. Cashier targets a specific API version. Upgrading Cashier may require upgrading the Stripe API version in the dashboard.

---

# AI Agent Notes

- When generating a Laravel app with subscription billing, default to Cashier + Stripe. Only deviate when the decision matrix's non-fit conditions are present.
- Always generate a BillingGateway wrapper around Cashier, even if it feels like over-engineering at project start. The wrapper costs 30 minutes upfront and saves weeks if the billing provider changes.
- When generating Cashier integration code, use Cashier's built-in webhook handler. Never generate custom Stripe webhook handling alongside Cashier.
- For tests involving subscriptions, always set up Stripe test clocks or use Http::fake(). Never generate tests that `sleep()` to wait for subscription trials.
- Recommend Paddle over Cashier if the project needs global tax compliance out of the box and doesn't need deep Stripe ecosystem integration.

---

# Verification

- [ ] Stripe is the sole payment provider (not "for now, with plans to add")
- [ ] Subscription plans map to Stripe products/prices (not custom entitlement engine)
- [ ] Cashier is wrapped behind a BillingGateway interface
- [ ] Webhook handling uses Cashier's built-in `Cashier::webhook()` route
- [ ] Escape hatch (stripe/stripe-php direct) is designed and tested for 1-2 methods
- [ ] Subscription status is cached, not queried on every request
- [ ] Test suite includes Stripe test clocks for time-sensitive subscription scenarios
- [ ] Webhook failure monitoring is configured
- [ ] Stripe API version is pinned and documented
- [ ] No Cashier Billable method overrides exist (logic is in wrapper, not overrides)
