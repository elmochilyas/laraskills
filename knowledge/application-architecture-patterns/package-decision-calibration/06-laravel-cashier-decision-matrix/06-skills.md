# Skill: Laravel Cashier Decision Evaluation and Implementation

## Purpose
Evaluate whether Laravel Cashier fits a project's billing requirements using the eight-dimension calibrated framework, then implement it correctly — with a BillingGateway wrapper, webhook integration, Stripe test clocks, and sync health monitoring — so the team never faces a surprise rewrite.

## When To Use
- Evaluating Cashier for subscription-based SaaS billing on Stripe
- The project has recurring subscription billing with plans that map to Stripe products/prices
- The project needs invoices, free trials, proration, and customer portal out of the box
- The team has limited Stripe experience and wants Cashier's subscription lifecycle abstractions
- A single payment provider (Stripe) is acceptable for the foreseeable 1-2 years

## When NOT To Use
- Marketplace payouts with Stripe Connect — Cashier has no Connect API abstractions
- Multiple payment providers required (Stripe + Paddle + Adyen) at launch or planned within 12 months
- Complex metered/usage billing beyond simple quantity multipliers
- Primary business model is one-off payments, not subscriptions
- Team already has deep Stripe expertise and prefers direct API control
- Need to support non-Stripe gateways as a core requirement

## Prerequisites
- Stripe account with test keys
- Laravel 13+ with PHP 8.3+
- Understanding of the Package Wrapper/Boundary Pattern (KU 03)
- Understanding of the Package Escape Hatch Strategy (KU 04)
- Familiarity with the Calibrated Package Recommendation framework (KU 01)

## Inputs
- Stripe test secret key and webhook secret
- Stripe product/price IDs for subscription plans
- The project's subscription model (plans, trials, proration rules)
- The BillingGateway interface design (from KU 03)

## Workflow
1. **Run the fit/non-fit assessment** — Before installing Cashier, verify: (a) Stripe is the sole payment provider, (b) subscription plans map cleanly to Stripe products/prices, (c) no Stripe Connect requirement, (d) no multi-provider requirement. If any fail, Cashier does not fit.
2. **Install Cashier and run migrations** — `composer require laravel/cashier`. Run `php artisan migrate`. Cashier creates `subscriptions` and `subscription_items` tables and modifies the `users` table. Verify the schema changes against your data model.
3. **Create the BillingGateway interface and StripeCashierAdapter** — Wrap Cashier behind an application-owned interface from the first integration. The interface uses business language (`subscribeUserToPlan`), not Stripe language (`createStripeSubscription`). All return types are application DTOs.
4. **Set up Cashier's built-in webhook handler** — Use `Cashier::webhook()` route. Do not write custom webhook handling alongside Cashier. Add event listeners for non-subscription-state events (analytics, CRM sync) but let Cashier manage subscription state.
5. **Configure Stripe test clocks for testing** — For time-sensitive scenarios (trials, proration, expiration), use Stripe test clocks. Never use `sleep()` or real time delays in tests. Test clocks enable 14-day trial testing in milliseconds.
6. **Monitor subscription sync health** — Implement a health check that verifies local subscription state matches Stripe. Monitor webhook failure rate. Stale local state = incorrect access decisions.
7. **Design the escape hatch** — Add a `StripeClient` dependency to the adapter for flows Cashier doesn't support (Connect, metered billing). The escape hatch lives inside the adapter; business logic never knows it exists.

## Validation Checklist
- [ ] Stripe is the sole payment provider (not "for now, with plans to add")
- [ ] Subscription plans map to Stripe products/prices (not custom entitlement engine)
- [ ] Cashier is wrapped behind a BillingGateway interface from day one
- [ ] Webhook handling uses Cashier's built-in `Cashier::webhook()` route, not custom handling
- [ ] Escape hatch (stripe/stripe-php direct) is designed and tested for 1-2 methods
- [ ] Subscription status is cached, not queried on every request
- [ ] Test suite includes Stripe test clocks for time-sensitive subscription scenarios
- [ ] Webhook failure monitoring and sync health checking are configured
- [ ] Stripe API version is pinned in the Stripe dashboard and documented
- [ ] No Cashier Billable method overrides exist — logic is in wrapper, not overrides

## Common Failures
- Using Cashier for one-off payments without subscriptions — use stripe/stripe-php directly
- Not handling Cashier's Stripe API version dependency — Cashier upgrades require Stripe API version alignment
- Storing business-critical subscription state only in Stripe and querying it on every request — use Cashier's local copy
- Overriding Cashier's Billable methods for custom behavior — wrap in a service, don't override the trait
- Running Cashier in production without webhook failure monitoring
- Querying `$user->subscribed()` on every request without caching
- Forgetting to call `horizon:terminate` during deploy when queue workers process webhooks

## Decision Points
- **Cashier vs. stripe/stripe-php direct**: Use Cashier if you need subscription lifecycle abstractions. Use direct Stripe if you only need one-off charges or have deep Stripe expertise.
- **Cashier vs. Paddle/LemonSqueezy**: Use Cashier if you accept Stripe lock-in and don't need MOR (Merchant of Record). Use Paddle/LemonSqueezy for global tax compliance out of the box.
- **Webhook processing: sync vs. queued**: Cashier processes webhooks synchronously by default. Queue webhook processing for high-volume apps.
- **Cache strategy**: Cache subscription status with a short TTL (5-15 minutes). Invalidate on webhook events.

## Performance Considerations
- `$user->upcomingInvoice()` makes a synchronous Stripe API call — cache the result, do not call on every page load
- `$user->redirectToBillingPortal()` adds ~500ms — consider pre-fetching or lazy-loading
- `$user->subscribed()` on every request without caching hits the database on every page load — cache subscription status
- Webhook processing is synchronous by default — queue it for high-volume apps

## Security Considerations
- Cashier verifies Stripe webhook signatures automatically — never disable this in production
- Cashier does NOT automatically add idempotency keys — add them for charge operations
- Subscription state is used as authorization input but never as the sole authorization mechanism — always combine with Gates/Policies
- Webhook secret (`STRIPE_WEBHOOK_SECRET`) must be set and verified
- Stripe test keys, never live keys, in CI and test environments

## Related Rules (from 05-rules.md)
- Wrap Cashier Behind a BillingGateway Interface from Day One
- Use Cashier's Built-In Webhook Handler — Do Not Write Your Own
- Use Stripe Test Clocks for Time-Sensitive Tests
- Monitor Cashier's Sync Health

## Related Skills
- Package Wrapper/Boundary Pattern (KU 03)
- Package Escape Hatch Strategy (KU 04)
- Calibrated Package Recommendation Writing (KU 01)

## Success Criteria
- Subscriptions are created, trialed, invoiced, prorated, and cancelled entirely through the BillingGateway interface — zero Cashier types appear in business logic. Webhook processing handles subscription state sync without divergence. Escape hatch for 1-2 Connect flows is tested. Subscription status is cached and monitored.
