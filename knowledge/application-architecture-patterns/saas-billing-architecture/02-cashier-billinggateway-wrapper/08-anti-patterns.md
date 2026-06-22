# Anti-Patterns: Cashier + BillingGateway Wrapper

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | SaaS Billing Architecture |
| Knowledge Unit | Cashier + BillingGateway Wrapper Pattern |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-BGW-01 | Direct Cashier/Stripe Calls Outside Gateway | Critical | High | Medium |
| AP-BGW-02 | Returning Stripe SDK Objects From Gateway | High | Medium | Medium |
| AP-BGW-03 | Business Logic in the Gateway | High | Medium | High |
| AP-BGW-04 | No FakeBillingGateway for Testing | High | Medium | Medium |
| AP-BGW-05 | Leaking Raw Stripe Errors to Users | High | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **`$team->subscription()` Called Directly in Controllers**: Bypassing the BillingGateway interface entirely
- **Stripe SDK Classes Imported Outside the Gateway**: `use Stripe\Subscription;` in actions, jobs, or controllers
- **Mocking Cashier Instead of Using a Fake**: Feature tests that mock Cashier methods rather than swapping the gateway implementation

---

## 1. Direct Cashier/Stripe Calls Outside Gateway

### Category
Architecture · Critical

### Description
Calling Laravel Cashier methods (`$team->newSubscription()`, `$team->subscription('default')->cancel()`) or Stripe SDK classes directly from controllers, actions, or jobs instead of through the BillingGateway interface.

### Why It Happens
Cashier's API is fluent and convenient. It's tempting to call `$team->newSubscription(...)->create($pm)` directly in a controller — it's one line, it works, and the gateway feels like unnecessary indirection. Over time, one-off direct calls accumulate. New developers copy existing patterns without knowing about the gateway convention.

### Warning Signs
- `$team->subscription()`, `$team->newSubscription()`, `$team->invoice()` in controller or action files
- `use Stripe\...` imports outside of `StripeCashierGateway`
- Grep for `Cashier` finds hits outside the gateway namespace
- Adding a new billing feature is done by copy-pasting existing direct Cashier code
- Tests cannot run without a Stripe API key or complex mocks

### Why Harmful
Every direct Cashier/Stripe call is coupled to a specific payment provider. Changing providers or upgrading the Stripe SDK requires finding and updating every direct call site. These operations are untestable without Stripe — tests either hit the Stripe API (slow, unreliable) or require complex mocking (fragile). The gateway's value (single integration point, test boundary, vendor isolation) is progressively eroded.

### Real-World Consequences
- Upgrading Cashier from v14 to v15: 27 files need changes because direct Cashier calls are scattered everywhere
- Adding PayPal support: impossible without refactoring every charge site
- CI pipeline: billing tests hit Stripe API, fail when Stripe test mode has issues
- New developer: copies a direct Cashier call from another controller, perpetuates the pattern
- Auditing billing operations: no single place to check what billing operations the application performs

### Preferred Alternative
Every billing operation goes through `BillingGateway` (injected via constructor). Cashier and Stripe SDK calls exist only inside `StripeCashierGateway`. Tests use `FakeBillingGateway`.

### Refactoring Strategy
1. Identify all direct Cashier/Stripe calls via grep: `$team->subscription`, `$team->newSubscription`, `Stripe\`, `Cashier\`
2. For each call site, determine which gateway method it corresponds to
3. Add missing methods to the BillingGateway interface if needed
4. Implement the method in StripeCashierGateway
5. Replace the direct call with a gateway call via constructor injection
6. Add the method to FakeBillingGateway
7. Verify tests pass with the fake

### Detection Checklist
- [ ] Does `grep -r "->subscription(" app/` return results outside the gateway namespace?
- [ ] Are `use Stripe\...` imports found outside of `StripeCashierGateway`?
- [ ] Do any controllers or actions have Stripe SDK or Cashier method calls?
- [ ] Can billing tests run without a Stripe API key configured?
- [ ] If changing payment providers, how many files would need updates?

### Related Rules/Skills/Trees
- Rule 1: All Billing Operations Must Go Through the BillingGateway Interface
- Implement Cashier + BillingGateway Wrapper Pattern (06-skills.md)
- Gateway Scope — Billing-Only vs Billing + Entitlements (07-decision-trees.md)

---

## 2. Returning Stripe SDK Objects From Gateway

### Category
Architecture · Maintainability

### Description
Gateway method signatures that return Stripe SDK types (`\Stripe\Subscription`, `\Laravel\Cashier\Subscription`, `\Stripe\Invoice`) instead of application-owned DTOs, forcing every caller to depend on the Stripe SDK.

### Why It Happens
Cashier models (`Laravel\Cashier\Subscription`) are Eloquent models with useful methods. Returning them directly from the gateway is zero-effort — no mapping, no DTOs to maintain. The SDK object has everything the caller might need. Creating DTOs feels like busywork when the Cashier object already works.

### Warning Signs
- Gateway interface methods return types like `\Stripe\Subscription`, `\Laravel\Cashier\Subscription`, or `\Stripe\Collection`
- Callers access Stripe-specific properties: `$sub->stripe_id`, `$sub->stripe_status`
- Controllers import Stripe SDK classes to type-hint gateway return values
- Adding a new field to the return value requires changes in the gateway AND all callers

### Why Harmful
Every caller that receives a Stripe SDK object is now coupled to the Stripe API. If Stripe changes their SDK types or you switch payment providers, every caller breaks. The application cannot function without the Stripe SDK imported. The gateway's vendor isolation purpose is defeated — the return type leaks the vendor dependency.

### Real-World Consequences
- Upgrading stripe-php from v12 to v13: `\Stripe\Subscription` class changes break 15 callers
- Switching to Paddle: every caller that received `\Stripe\Subscription` must be rewritten for `\Paddle\Subscription`
- Static analysis: every file that calls the gateway must have `stripe/stripe-php` as a dependency
- IDE autocompletion on return values exposes Stripe internals to application developers

### Preferred Alternative
Every gateway method returns an application-owned DTO (readonly class). DTOs contain only the fields the application needs, mapped from Stripe objects inside the gateway.

### Refactoring Strategy
1. Define DTOs: `SubscriptionResult`, `SubscriptionData`, `InvoiceData` with readonly properties
2. Add static factory methods: `SubscriptionData::fromStripeSubscription(CashierSubscription $sub)`
3. Update the interface to return DTO types
4. Update StripeCashierGateway to map Stripe objects to DTOs before returning
5. Update all callers to use DTO properties instead of Stripe properties
6. Remove Stripe SDK imports from caller files

### Detection Checklist
- [ ] Do any gateway interface methods return `\Stripe\...` or `\Laravel\Cashier\...` types?
- [ ] Do files outside the gateway namespace import Stripe or Cashier classes?
- [ ] Are there DTO classes for SubscriptionResult, SubscriptionData, and InvoiceData?
- [ ] Can you swap the gateway implementation without changing any caller code?
- [ ] Do callers access `$result->stripe_status` (Stripe-named property) or `$result->status` (application-named)?

### Related Rules/Skills/Trees
- Rule 2: Return Application-Owned DTOs, Never Stripe/Cashier Objects
- Implement Cashier + BillingGateway Wrapper Pattern (06-skills.md)
- DTO Design — Immutable Readonly vs Mutable with Setters (07-decision-trees.md)

---

## 3. Business Logic in the Gateway

### Category
Architecture · Maintainability

### Description
Placing business rules (entitlement checks, plan validation, feature gating, notification triggers) inside the BillingGateway implementation instead of keeping it focused solely on payment provider operations.

### Why It Happens
The gateway is the natural integration point for billing. It's convenient to add a "quick check" here or a "notification dispatch" there. Over time, each new billing requirement adds a bit more logic to the gateway. The gateway becomes the "billing god class" that does everything billing-related.

### Warning Signs
- EntitlementService or FeatureGate injected into StripeCashierGateway
- Gateway methods dispatching events or sending notifications directly
- Business validation rules (plan compatibility, usage check) inside gateway methods
- Gateway methods that call other application services to "complete the workflow"
- Gateway class exceeds 300 lines

### Why Harmful
The gateway loses its single responsibility. Testing becomes harder because the gateway now orchestrates business logic in addition to making API calls. Changing business rules requires modifying the gateway implementation. The fake gateway can't faithfully reproduce the behavior because it doesn't contain the business logic. When switching payment providers, the business logic must be either duplicated or extracted.

### Real-World Consequences
- Adding a notification on subscription creation: developer adds `event(new Subscribed(...))` inside the gateway instead of in the action that calls the gateway
- FakeBillingGateway doesn't fire the notification because the fake doesn't have business logic — tests miss the notification assertion
- Plan downgrade validation: gateway checks plan compatibility, but the validation rule changes — need to update gateway implementation in addition to action
- Gateway reaches 800+ lines: billing operations + business validation + notification dispatch + audit logging + entitlement checks

### Preferred Alternative
The gateway performs exactly one responsibility: communicating with the payment provider. Business logic belongs in Actions (orchestration) and Services (domain logic). Controllers call Actions, Actions call the gateway + domain services + event dispatcher.

### Refactoring Strategy
1. Audit StripeCashierGateway for non-payment-provider responsibilities
2. Extract business validation to dedicated Action classes or FormRequest rules
3. Extract event dispatch to the Action that calls the gateway
4. Extract notification logic to event listeners triggered by the Action
5. Keep gateway mutation methods focused: call Stripe, return result DTO, log audit event — nothing else

### Detection Checklist
- [ ] Does the gateway class inject services beyond what's needed for payment operations?
- [ ] Are events dispatched from within gateway methods?
- [ ] Does the gateway contain business validation rules?
- [ ] Is the gateway class over 300 lines?
- [ ] Would swapping payment providers require rewriting business logic?

### Related Rules/Skills/Trees
- Rule 1: All Billing Operations Must Go Through the BillingGateway Interface
- Implement Cashier + BillingGateway Wrapper Pattern (06-skills.md)
- Gateway Scope — Billing-Only vs Billing + Entitlements (07-decision-trees.md)

---

## 4. No FakeBillingGateway for Testing

### Category
Testing · Reliability

### Description
Using Stripe API mocks (Mockery) or live Stripe API calls in billing feature tests instead of a stateful FakeBillingGateway that implements the full interface.

### Why It Happens
Creating a comprehensive fake that implements every interface method is upfront work. Mocking specific methods with Mockery is faster for the first test. The fake is deferred as "something we'll build later" — later never comes. Over time, tests accumulate mock expectations that are fragile and hard to maintain.

### Warning Signs
- `Mockery::mock(BillingGateway::class)` or `$this->mock(BillingGateway::class)` in tests
- Tests that hit Stripe API (require `STRIPE_SECRET` in `.env.testing`)
- Test setup that configures mock expectations per test method
- Multi-step billing flows tested with mock assertions rather than state verification
- No `FakeBillingGateway` class in the test suite

### Why Harmful
Mocking is fragile — it verifies method calls, not behavior. Changing the order of gateway calls breaks tests even if the end result is correct. Multi-step billing flows (create → check → cancel → verify) are impossible to test because mocks don't maintain state. Failure scenarios (card declined, SCA required) require complex mock configurations. Tests become a maintenance burden that developers avoid writing.

### Real-World Consequences
- Adding a new gateway method: must update mock expectations in 30+ tests
- Refactoring an action to call gateway methods in a different order: 12 tests break with "method was not expected to be called"
- Testing "subscription is canceled → status is actually canceled": impossible with mocks because `getSubscription()` return value is hardcoded, not derived from calling `cancelSubscription()`
- New developer: "I'll skip testing this billing flow, it's too hard to mock"

### Preferred Alternative
Create a `FakeBillingGateway` that implements the full interface with in-memory state. Replace the container binding in tests. Tests verify state, not method calls: create a subscription → the fake remembers it → getSubscription returns the created subscription.

### Refactoring Strategy
1. Create `FakeBillingGateway` with internal arrays for customers, subscriptions, invoices
2. Implement all interface methods using the internal state
3. Add failure simulation: `$fake->shouldFail = true` or `$fake->failOnNext('createSubscription')`
4. Replace mock-based tests with fake-based tests
5. Verify multi-step flows work: create, get, cancel, verify canceled
6. Add the fake to test `TestCase::setUp()` as the default binding

### Detection Checklist
- [ ] Is there a `FakeBillingGateway` class in the test suite?
- [ ] Does it implement every method of the `BillingGateway` interface?
- [ ] Are feature tests using the fake or mocks?
- [ ] Can you test "create subscription → cancel → verify canceled" without mock setup?
- [ ] Does the fake support failure simulation?

### Related Rules/Skills/Trees
- Rule 3: Implement a FakeBillingGateway for Testing
- Implement Cashier + BillingGateway Wrapper Pattern (06-skills.md)
- Testing Strategy — FakeBillingGateway vs Stripe API Mock (07-decision-trees.md)

---

## 5. Leaking Raw Stripe Errors to Users

### Category
Error Handling · User Experience

### Description
Allowing Stripe SDK exceptions to propagate through the gateway to the presentation layer, resulting in users seeing technical error messages ("No such PaymentMethod: pm_xxx") or Stripe-branded errors.

### Why It Happens
The gateway implementation calls Cashier/Stripe methods that throw vendor exceptions. Wrapping each one feels like boilerplate. The exceptions contain useful debugging information — it's convenient to let them bubble up to error handlers. During development, raw Stripe errors help debugging. The wrapping is deferred to "production hardening."

### Warning Signs
- 500 error pages displaying "Stripe\Exception\CardException: Your card was declined"
- User-facing error messages with Stripe IDs (`pm_xxx`, `sub_xxx`)
- Controllers with `catch (\Stripe\Exception\ApiErrorException $e)` blocks
- Error monitoring showing Stripe exception class names
- 500 errors during Stripe outages because `ApiErrorException` is not caught

### Why Harmful
Users see technical, sometimes alarming error messages. "Your card was declined" is helpful; "Stripe\Exception\CardException with decline_code: do_not_honor" is confusing. Stripe-branded errors signal vendor dependency. During Stripe outages, uncaught exceptions cause 500 errors instead of graceful degradation. Error monitoring is polluted with Stripe exception types that have no application context.

### Real-World Consequences
- User reports "the website is broken" because the error page shows a Stripe exception trace
- Stripe API outage: all subscription operations crash with 500 errors instead of showing "Payment provider temporarily unavailable"
- Support ticket: "What does 'No such PaymentMethod: pm_1AbCdEf' mean?"
- Security: Stripe error messages may contain partial card details or customer IDs
- Compliance: leaking Stripe error details may violate PCI-DSS requirements

### Preferred Alternative
Catch Stripe exceptions inside the gateway. Throw application exceptions with user-friendly messages. Log the original Stripe exception for debugging. Map decline codes to actionable user messages.

### Refactoring Strategy
1. Define application exceptions: `CardDeclinedException`, `PaymentActionRequiredException`, `BillingProviderException`
2. In StripeCashierGateway, wrap all Stripe API calls in try-catch blocks
3. Map Stripe exceptions: `CardException` → `CardDeclinedException` (with user-friendly message from decline code)
4. Map generic errors: `ApiErrorException` → `BillingProviderException` ("We're having issues with our payment provider. Please try again.")
5. Add team ID and context to application exceptions for logging
6. Ensure the fake gateway throws the same application exceptions (not Stripe types)

### Detection Checklist
- [ ] Are `\Stripe\Exception\...` classes caught in controllers or actions (outside the gateway)?
- [ ] Do user-facing error messages contain Stripe IDs or technical Stripe error text?
- [ ] What do users see when Stripe's API is down?
- [ ] Are all Stripe exceptions caught and wrapped inside the gateway?
- [ ] Are card decline codes mapped to user-actionable messages?

### Related Rules/Skills/Trees
- Rule 4: Wrap Stripe Exceptions in Application Exceptions Inside the Gateway
- Implement Cashier + BillingGateway Wrapper Pattern (06-skills.md)
- Exception Handling — Wrap All vs Wrap Selective Stripe Errors (07-decision-trees.md)
