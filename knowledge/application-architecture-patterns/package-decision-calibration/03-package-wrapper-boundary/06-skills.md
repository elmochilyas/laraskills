# Skill: Package Wrapper / Boundary Pattern Implementation

## Purpose
Wrap third-party Laravel packages behind application-owned interfaces to protect business logic from vendor churn, enable provider swapping without rewrites, and create architectural seams for escape hatches and testing.

## When To Use
- Integrating with external API services (Stripe, Twilio, SendGrid, Mailgun, Algolia)
- Packages that represent replaceable infrastructure choices (payment providers, search engines, file storage, SMS)
- When the underlying provider might change within the application's expected lifetime
- When tests should not depend on real API calls or package-specific fakes
- When multiple implementations of the same capability might coexist (multi-provider support)

## When NOT To Use
- Framework packages (Eloquent, Blade, routing, middleware) — these ARE the framework
- Developer tooling packages (Debugbar, Telescope, IDE helpers) — business logic never depends on them
- Trivial single-method utility packages that can be inlined in 5 lines
- When the wrapper would become a 1:1 passthrough with identical method signatures and zero behavioral difference

## Prerequisites
- Understanding of Laravel's service container and interface binding
- Familiarity with DTOs and value objects for return type design
- Knowledge of the Calibrated Package Recommendation framework (KU 01)
- Understanding of the Escape Hatch Strategy (KU 04)

## Inputs
- The third-party package to be wrapped (vendor, version)
- The 3-7 specific methods business logic actually calls on the package
- The project's directory structure conventions (app/Contracts, app/Infrastructure)
- The application's DTO conventions (if any exist)

## Workflow
1. **Identify the business capability** — Not "wrap Cashier." But "the application needs to subscribe users, cancel subscriptions, and retrieve invoices." Name the interface after the business capability: `BillingGateway`, `NotificationGateway`, `SearchGateway`.
2. **Define the interface in `app/Contracts/`** — Write 3-7 methods in business language. `subscribeUserToPlan(CreateSubscriptionData $data): SubscriptionResult`, NOT `createStripeSubscription(string $priceId, string $pmId): Subscription`. All parameters must be application DTOs or primitives. All return types must be application DTOs or void.
3. **Create the adapter in `app/Infrastructure/{Domain}/`** — Implement the interface by delegating to the package. Map vendor types to application DTOs inside adapter methods. Catch vendor exceptions and re-throw as application exceptions. Strip sensitive data (API keys, tokens) from exception messages.
4. **Bind the interface to the adapter in a service provider** — `$this->app->bind(BillingGateway::class, StripeCashierAdapter::class)`. Use singleton binding if the adapter is stateless or connections are expensive.
5. **Write business logic against the interface only** — Every controller, service, action, and listener that touches this capability must depend on `BillingGateway`, never on `StripeCashierAdapter` or `Cashier\Subscription`. Use constructor injection.
6. **Write tests against the interface** — Feature tests mock `BillingGateway`, not Cashier. Adapter integration tests verify the adapter against real or faked vendor APIs. Never mix the two concerns in the same test.
7. **Verify the boundary** — Audit imports in business logic files. If any file imports `Laravel\Cashier\*` or `Stripe\*`, the wrapper is leaking. Fix by pushing vendor references into the adapter.

## Validation Checklist
- [ ] Interface is defined in `app/Contracts/` in business language (no vendor names in methods or parameters)
- [ ] Interface has 3-7 methods scoped to what the application actually uses
- [ ] Adapter class is in `app/Infrastructure/` with vendor name in class name
- [ ] All return types are application DTOs/value objects — never vendor types
- [ ] Adapter catches vendor exceptions and re-throws as application exceptions
- [ ] Container binding maps interface to adapter in a service provider
- [ ] All business logic classes depend on the interface, never on the adapter or vendor package
- [ ] No business logic file imports vendor types (Laravel\Cashier\Subscription, Stripe\Charge, etc.)
- [ ] Feature tests mock the interface; integration tests test the adapter separately
- [ ] Wrapper is NOT a 1:1 passthrough — it abstracts, not mirrors

## Common Failures
- Creating a "pass-through wrapper" with 1:1 method mapping that provides zero architectural value
- Returning vendor types from interface methods (e.g., `CashierSubscription` instead of `SubscriptionResult`)
- Using vendor-specific language in method names (e.g., `createStripeSubscription` instead of `subscribeUserToPlan`)
- Putting adapters in `app/Services/` instead of `app/Infrastructure/`, blurring business/infrastructure boundaries
- Adding the wrapper retroactively after business logic is already tightly coupled to the package
- Creating a gigantic interface that mirrors the entire vendor API (50+ methods)
- Forgetting to translate vendor exceptions, so business logic catches `Stripe\Exception\CardException`

## Decision Points
- **Wrapper scope**: 3-7 methods that the application actually uses vs. attempting to wrap the entire vendor API
- **Interface naming**: Business-language name (`BillingGateway`) vs. vendor-language name (`StripeGateway`)
- **Adapter location**: `app/Infrastructure/{Domain}/` (recommended) vs. `app/Services/` (blurs concerns)
- **Return type design**: Application DTOs (recommended) vs. primitive arrays (acceptable for simple cases) vs. vendor types (never)
- **Singleton vs. transient binding**: Singleton for expensive connections, transient for stateless wrappers

## Performance Considerations
- Wrapper overhead is one extra method call per operation — negligible (<1μs)
- Interface-to-concrete resolution via container adds ~0.01ms — irrelevant for HTTP requests
- For high-throughput queue workers, use singleton binding to avoid repeated container resolution
- Small interfaces (3-5 methods) are easier to implement and test than large ones (20+ methods)

## Security Considerations
- Exception translation must strip sensitive data: `CardException('Invalid API key sk_live_xxx')` must become `PaymentFailedException('Payment declined')` without the API key
- The adapter is the only place that touches vendor credentials — business code must never see API keys
- DTOs returned from the adapter must not contain raw API responses — sanitize at the boundary
- Vendor credential rotation (API key changes) should only require changes in the adapter, never in business logic

## Related Rules (from 05-rules.md)
- Design the Interface in Business Language, Not Vendor Language
- Scope Interfaces to What the Application Actually Uses
- Put the Adapter in Infrastructure, Not Domain
- Return Application DTOs, Not Vendor Types
- Translate Vendor Exceptions to Application Exceptions
- Use the Wrapper from Day One, Not Retroactively

## Related Skills
- Package Escape Hatch Strategy (KU 04)
- Calibrated Package Recommendation Writing (KU 01)
- Package Fit/Non-Fit Analysis (KU 02)

## Success Criteria
- A new payment provider can be swapped in by creating one new adapter class and changing one container binding — with zero changes to business logic, controllers, or tests (except test bindings). No vendor type appears in any business logic file.
