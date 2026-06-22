# Skill: Implement Cashier + BillingGateway Wrapper Pattern

## Purpose

Design and implement the BillingGateway interface and StripeCashierGateway implementation that isolates all Stripe/Cashier calls behind an application-owned contract, providing a single mock point for testing and protection from vendor API changes.

## When To Use

- Any Laravel SaaS using Cashier for Stripe billing
- When billing operations need to be testable without live Stripe API calls
- When multiple parts of the application trigger billing operations (controllers, CLI, jobs, admin panel)
- When you might eventually support multiple payment providers or need to migrate between them
- When you need billing operations beyond what Cashier's fluent API provides

## When NOT To Use

- Prototype/MVP where the team hasn't committed to a testing strategy yet
- When you are absolutely certain you'll never change payment providers or extend billing logic
- Very small team where the abstraction overhead outweighs immediate benefits
- Single-developer projects where the maintainer is the sole consumer of the billing API

## Prerequisites

- Laravel Cashier installed and configured with Stripe
- Plan/Feature/Entitlement model in place
- Stripe account with API keys configured in `.env`
- Understanding of dependency injection and Laravel's service container

## Inputs

- Cashier configuration (model, currency, webhook secret)
- Stripe API keys (publishable, secret, webhook signing secret)
- Plan definitions with Stripe price IDs
- Team/tenant model with Billable trait

## Workflow

1. Define the `BillingGateway` interface with method signatures for all billing operations
2. Create DTOs for return types: `SubscriptionResult`, `SubscriptionData`, `InvoiceData`
3. Implement `StripeCashierGateway` using Laravel Cashier's fluent API for standard operations
4. Use the Stripe PHP SDK directly as an escape hatch for operations Cashier doesn't support
5. Implement `FakeBillingGateway` with deterministic, in-memory state for testing
6. Bind the interface to the concrete implementation in `BillingServiceProvider`
7. Inject `BillingGateway` into controllers, actions, and jobs (never call Cashier directly)
8. Wrap Stripe-specific exceptions in application exceptions inside the gateway
9. Log audit events for every mutation operation in the gateway

## Validation Checklist

- [ ] All billing operations in the application go through `BillingGateway` interface (grep for Cashier/Stripe usage outside gateway)
- [ ] Interface method signatures return only application-owned DTOs (no Stripe types)
- [ ] `FakeBillingGateway` exists and implements all interface methods with deterministic behavior
- [ ] Feature tests use `FakeBillingGateway`, not Stripe mocks or live API calls
- [ ] Gateway mutation methods log audit events (create, cancel, swap, refund)
- [ ] Stripe SDK exceptions are caught and wrapped in domain exceptions inside the gateway
- [ ] `BillingServiceProvider` binds the interface to the correct implementation per environment
- [ ] Both success and failure paths are tested via `FakeBillingGateway`
- [ ] DTOs are readonly/immutable classes
- [ ] Checkout session creation and billing portal sessions work through the interface

## Common Failures

- Calling Cashier methods directly in controllers or actions (bypassing the gateway)
- Returning Stripe/Cashier objects from gateway methods (leaking vendor types)
- Putting business logic (entitlement checks, plan validation) in the gateway instead of keeping it focused on billing operations
- Forgetting to add new methods to `FakeBillingGateway` after adding them to the interface
- Using the escape hatch (direct Stripe SDK) for operations Cashier does support
- Leaking raw Stripe error messages to the user instead of wrapping in user-friendly application exceptions
- Not logging audit events for billing mutations

## Decision Points

- Interface granularity: one method per billing operation vs composite methods (e.g., `subscribeAndInvoice`)?
- DTO design: include raw Stripe data for debugging or strictly typed only?
- FakeBillingGateway: should it simulate Stripe errors (card declined, SCA required) by default or on-demand?
- Escape hatch scope: which operations legitimately need direct Stripe SDK access?

## Performance Considerations

- The gateway itself adds negligible overhead — it's a thin delegation layer over Cashier
- Cashier already caches subscription data locally; the gateway reads from those caches
- Checkout session and billing portal creation make direct Stripe API calls (200-500ms) — call these from user-facing actions only
- Consider queuing invoice fetching for admin dashboards displaying long invoice histories
- FakeBillingGateway has zero latency — tests run at memory speed

## Security Considerations

- The gateway implementation must never log or expose Stripe secret keys
- Checkout session URLs should not be generated for unauthenticated users
- The `refund()` method must be protected by authorization (admin/support role only)
- Billing portal session URLs are single-use and short-lived; don't cache them
- Stripe exception messages may contain PII — wrap them before propagation
- Gateway mutation methods must record actor identity for audit compliance

## Related Rules

- Rule 1: All Billing Operations Must Go Through the BillingGateway Interface
- Rule 2: Return Application-Owned DTOs, Never Stripe/Cashier Objects
- Rule 3: Implement a FakeBillingGateway for Testing
- Rule 4: Wrap Stripe Exceptions in Application Exceptions Inside the Gateway
- Rule 5: Gateway Mutation Methods Must Log Audit Events

## Related Skills

- Implement Plan, Feature & Entitlement Model
- Implement Stripe Webhook Idempotency & Event Deduplication
- Implement Webhook Audit Log, Replay & Reconciliation

## Success Criteria

- Every billing operation in the codebase routes through `BillingGateway` (verified by grep)
- Swapping from StripeCashierGateway to FakeBillingGateway requires one container binding change
- All billing feature tests pass using FakeBillingGateway with zero Stripe API calls
- Adding a new payment provider requires only a new gateway implementation class
- Stripe API version upgrades require changes only in StripeCashierGateway
