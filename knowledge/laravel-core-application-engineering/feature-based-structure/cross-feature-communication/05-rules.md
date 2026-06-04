## Never Direct Model Access Across Features

Importing a model from another feature's namespace is forbidden.

---

## Category

Code Organization

---

## Rule

Never import or use models directly from another feature's namespace. All cross-feature data access must go through a service interface or event.

---

## Reason

Direct model access creates tight coupling that prevents independent refactoring of features. Feature B cannot change its model structure without breaking Feature A.

---

## Bad Example

```php
use App\Features\Billing\Models\Invoice;

class ReportController extends Controller
{
    public function index()
    {
        return Invoice::where('status', 'paid')->get();
    }
}
```

---

## Good Example

```php
use App\Kernel\Contracts\InvoiceProvider;

class ReportController extends Controller
{
    public function __construct(private InvoiceProvider $invoices) {}

    public function index()
    {
        return $this->invoices->getPaidInvoices();
    }
}
```

---

## Exceptions

Models truly shared across the entire application (e.g., `App\Models\User`) that live in the shared kernel are exempt. No cross-feature model exceptions.

---

## Consequences Of Violation

Tight coupling prevents independent feature evolution. Refactoring one feature breaks consumers in another. Feature boundaries become meaningless.

---

## Use Events For Cross-Cutting Side Effects

Fire-and-forget behavior across feature boundaries must use events, never direct method calls.

---

## Category

Architecture

---

## Rule

Use Laravel events for any cross-feature behavior that is a side effect — notifications, audit logging, analytics, cache invalidation. The dispatching feature fires an event; consuming features listen.

---

## Reason

Events decouple the dispatching feature from consumers. The billing feature does not need to know about analytics, notifications, or email sending. New listeners can be added without modifying the dispatching code.

---

## Bad Example

```php
class InvoiceService
{
    public function __construct(
        private AnalyticsService $analytics,
        private NotificationService $notifications,
    ) {}

    public function markPaid(Invoice $invoice): void
    {
        $invoice->update(['status' => 'paid']);
        $this->analytics->recordRevenue($invoice->amount);
        $this->notifications->sendReceipt($invoice->user);
    }
}
```

---

## Good Example

```php
class InvoiceService
{
    public function __construct(private EventDispatcher $events) {}

    public function markPaid(Invoice $invoice): void
    {
        $invoice->update(['status' => 'paid']);
        $this->events->dispatch(new InvoicePaid($invoice));
    }
}
```

---

## Exceptions

When the side effect is critical to the feature's own correctness and must be synchronous and transactional. In that case, keep it within the feature's service layer.

---

## Consequences Of Violation

Tight coupling between features for side-effect logic. Adding new cross-cutting concerns requires modifying existing service classes. Violates Open/Closed principle.

---

## Use Service Interfaces For Data Retrieval

When one feature needs data owned by another feature, define an interface in the shared kernel.

---

## Category

Architecture

---

## Rule

Place interfaces for cross-feature data retrieval in `app/Kernel/Contracts/`. The owning feature provides the implementation. The consuming feature depends only on the interface.

---

## Reason

The interface is a stable contract that both features agree on. The owning feature can refactor its internal implementation without breaking consumers, as long as the contract is upheld.

---

## Bad Example

```php
// Billing feature directly queries Users feature
use App\Features\Users\Models\UserProfile;

class InvoiceController extends Controller
{
    public function show(Invoice $invoice)
    {
        $profile = UserProfile::where('user_id', $invoice->user_id)->first();
        return view('billing::invoices.show', compact('invoice', 'profile'));
    }
}
```

---

## Good Example

```php
// In app/Kernel/Contracts/
interface UserProfileProvider
{
    public function getContactEmail(int $userId): string;
}

// Users feature implements
class UserProfileService implements UserProfileProvider
{
    public function getContactEmail(int $userId): string
    {
        return UserProfile::findOrFail($userId)->email;
    }
}
```

---

## Exceptions

No common exceptions. Even simple data lookups must use interfaces when crossing feature boundaries.

---

## Consequences Of Violation

Changes to the owning feature's model structure break consumers across the application. Feature extraction becomes impossible because dependencies are scattered.

---

## Enforce Dependency Direction

Define and enforce which features depend on which. Lower-level features must never depend on higher-level features.

---

## Category

Architecture

---

## Rule

Establish a dependency hierarchy across features (e.g., Infrastructure < Foundation < Domain < Application). Features may only depend on features at the same or lower level. Enforce this with static analysis rules.

---

## Reason

Circular dependencies make features untestable in isolation. A clear dependency direction ensures the dependency graph is a DAG (directed acyclic graph), which is essential for independent testing, extraction, and reasoning.

---

## Bad Example

```php
// Billing feature uses Notification feature
// Notification feature uses Billing model for invoice data
// Circular dependency — neither can be tested or extracted independently
```

---

## Good Example

```
Kernel (no dependencies)
  ↑
Users, Billing, CMS (depend on Kernel)
  ↑
Reporting (depends on Users, Billing)
```

---

## Exceptions

Auth/User features are typically at the bottom since many features depend on them. No circular dependency exceptions are permitted.

---

## Consequences Of Violation

Cannot test features in isolation. Feature extraction requires breaking cycles first. Tight coupling prevents team autonomy.

---

## Keep Shared Kernel Lean

Do not add interfaces to the shared kernel until at least two features consume them.

---

## Category

Maintainability

---

## Rule

Only add contracts, DTOs, and events to `app/Kernel/` when they are actually consumed by multiple features. Premature abstraction adds maintenance burden without benefit.

---

## Reason

Every interface in the shared kernel is a promise to maintain backward compatibility. Adding interfaces speculatively creates dead code and increases cognitive load. The YAGNI principle applies strictly to shared contracts.

---

## Bad Example

```php
// app/Kernel/Contracts/ — 200+ interfaces, most used by one feature
interface PdfGenerator {}
interface CsvExporter {}
interface EmailTemplateRenderer {}
// Only Billing uses these — they should live inside Billing
```

---

## Good Example

```php
// app/Kernel/Contracts/
interface UserProvider {}     // Used by Billing, CMS, Reporting
interface InvoiceProvider {}  // Used by Reporting, Analytics
// PDF generation stays inside Billing — no other feature needs it
```

---

## Exceptions

Interfaces for truly foundational concerns (e.g., `UserProvider`, `PaymentGateway`) can be added early since multiple features will predictably need them.

---

## Consequences Of Violation

Bloated shared kernel that is hard to navigate. Every feature change risks breaking the shared contract. Dead interface definitions accumulate.

---

## Use DTOs For Cross-Boundary Data

When passing structured data across feature boundaries, use typed DTOs, not arrays or Eloquent models.

---

## Category

Maintainability

---

## Rule

Define explicit Data Transfer Objects in `app/Kernel/DTOs/` for any structured data that crosses feature boundaries. Never pass Eloquent models or raw arrays between features.

---

## Reason

DTOs provide typed, immutable data contracts. Arrays and Eloquent models leak internal structure and create implicit dependencies. DTOs are serializable, testable, and self-documenting.

---

## Bad Example

```php
// Billing passes an array to Reporting
$reporting->generateReport([
    'total' => 1500.00,
    'currency' => 'USD',
    'items' => [...], // unknown structure
]);
```

---

## Good Example

```php
namespace App\Kernel\DTOs;

class RevenueReportData
{
    public function __construct(
        public readonly float $total,
        public readonly string $currency,
        public readonly array $items,
    ) {}
}

// Billing creates DTO
$reporting->generateReport(
    new RevenueReportData(total: 1500.00, currency: 'USD', items: $items)
);
```

---

## Exceptions

Simple scalar values (IDs, strings, booleans) do not require DTOs. Use DTOs when passing 3+ related values.

---

## Consequences Of Violation

Implicit contracts between features that break silently. Eloquent model serialization exposes internal state. Arrays lack type safety and IDE autocompletion.

---

## Wire Cross-Feature Dependencies In Providers

Bind interface contracts to implementations inside service providers, never inside controller or service constructors.

---

## Category

Code Organization

---

## Rule

Use Laravel's service container to bind cross-feature interfaces to implementations in the owning feature's service provider. Consuming features inject the interface, never the concrete class.

---

## Reason

Container binding centralizes the dependency wiring. Swapping implementations (e.g., for testing, staging, or feature flags) only requires changing the binding, not every consumer.

---

## Bad Example

```php
class ReportController extends Controller
{
    public function __construct(private UserProfileService $profiles) {}
    // Direct dependency on concrete class — cannot swap for testing
}
```

---

## Good Example

```php
// BillingServiceProvider::register()
$this->app->bind(UserProfileProvider::class, UserProfileService::class);

// ReportController — depends on interface only
class ReportController extends Controller
{
    public function __construct(private UserProfileProvider $profiles) {}
}
```

---

## Exceptions

In-memory implementations used exclusively for testing can be bound in `AppServiceProvider` or test case `setUp()` without modifying feature providers.

---

## Consequences Of Violation

Concrete class coupling prevents testing with mocks. Swapping implementations requires changing every consumer. Feature extraction requires unwinding scattered instantiation.

---

## Start Simple, Extract Interfaces When Needed

Do not create interfaces for cross-feature communication until a second consumer emerges.

---

## Category

Design

---

## Rule

Begin with concrete service classes within a feature. Extract an interface and move it to the shared kernel only when a second feature needs the same capability.

---

## Reason

Creating interfaces prematurely adds abstraction overhead without evidence of need. A single-consumer interface provides no benefit and increases the code surface area. YAGNI applies.

---

## Bad Example

```php
// Day 1 — BillingPaymentProvider interface created "just in case"
// Only Billing feature uses it for months until another consumer appears
interface BillingPaymentProvider {}
class StripePaymentProvider implements BillingPaymentProvider {}
```

---

## Good Example

```php
// Day 1 — concrete class inside Billing
class StripePaymentService
{
    public function charge(int $userId, float $amount): Receipt {}
}

// Month 6 — Reporting needs payment data
// Extract interface, move to Kernel/Contracts/
interface PaymentProvider {}
class StripePaymentService implements PaymentProvider {}
```

---

## Exceptions

Interfaces driven by external contracts (e.g., third-party API adapters, strategy pattern) should be defined upfront since they represent integration boundaries.

---

## Consequences Of Violation

Dead interface definitions. Increased cognitive load navigating abstractions that serve no current purpose. Unnecessary files in the shared kernel.

---

## Document Cross-Feature Dependencies

Maintain a visible, up-to-date dependency graph between features.

---

## Category

Maintainability

---

## Rule

Keep a documented dependency graph (in README or architecture docs) showing which features depend on which. Update it when cross-feature interfaces or event listeners are added or removed.

---

## Reason

Without documentation, developers add dependencies carelessly. The dependency graph can degrade into a tangled mess over time. An explicit graph makes circular dependencies visible and provides a review target in PRs.

---

## Bad Example

No dependency documentation exists. A new developer adds a direct model import from CMS into Billing. Three months later, nobody knows why the features are coupled.

---

## Good Example

```
## Dependency Graph

- Kernel — depends on nothing
- Users — depends on Kernel
- Billing — depends on Kernel, Users
- CMS — depends on Kernel, Users
- Reporting — depends on Billing, CMS

Arrow direction: consumer → dependency
```

---

## Exceptions

Projects with 2-3 features do not need formal documentation. Informal team knowledge suffices at small scale.

---

## Consequences Of Violation

Untracked dependency accumulation. Circular dependencies discovered only during extraction attempts. Team members lack shared understanding of architecture.

---

## Use Contract Tests For Interfaces

Create dedicated tests that verify every shared kernel interface implementation fulfills its contract.

---

## Category

Testing

---

## Rule

For every interface in `app/Kernel/Contracts/`, write a contract test that exercises the interface methods through the container-resolved implementation. Run these tests in CI to detect interface drift.

---

## Reason

Interfaces can silently drift from their implementations when the owning feature changes. Contract tests ensure the implementation still satisfies the interface contract, catching regressions before they reach production.

---

## Bad Example

```php
// Interface changes signature
interface InvoiceProvider {
    public function getPaidInvoices(int $userId): Collection; // added userId param
}
// Implementation not updated — compiles but returns wrong data
```

---

## Good Example

```php
class InvoiceProviderContractTest extends TestCase
{
    /** @test */
    public function it_returns_paid_invoices_for_user()
    {
        $provider = $this->app->make(InvoiceProvider::class);
        $invoices = $provider->getPaidInvoices(userId: 1);
        $this->assertCount(2, $invoices);
        $this->assertTrue($invoices->every(fn($i) => $i->status === 'paid'));
    }
}
```

---

## Exceptions

Trivial interfaces with a single scalar return value do not require contract tests. Use judgment based on complexity.

---

## Consequences Of Violation

Interface-implementation drift causes runtime errors in consuming features. Contract violations are discovered late, often in production.

---

## Prevent Event Overload

Keep event listeners per event below 5. Split broad events into specific ones.

---

## Category

Maintainability

---

## Rule

Limit the number of listeners attached to a single event to 5 or fewer. When an event accumulates more listeners, split it into multiple more specific events or use queued jobs.

---

## Reason

Events with many listeners become debugging nightmares. Any single listener failure can cause cascading issues. It becomes unclear which listeners are essential and which are optional side effects.

---

## Bad Example

```php
// UserRegistered has 15 listeners
Event::listen(UserRegistered::class, SendWelcomeEmail::class);
Event::listen(UserRegistered::class, CreateBillingAccount::class);
Event::listen(UserRegistered::class, NotifySlack::class);
Event::listen(UserRegistered::class, SyncToMailchimp::class);
// ... 11 more listeners
```

---

## Good Example

```php
// Split into specific events
Event::listen(UserRegistered::class, SendWelcomeEmail::class);
Event::listen(UserRegistered::class, ProvisionBillingAccount::class);

// Side effects use their own event or queued job
Event::listen(UserWelcomePrepared::class, NotifySlack::class);
Event::listen(UserWelcomePrepared::class, SyncToMailchimp::class);
```

---

## Exceptions

Domain events where all listeners are essential to business correctness (e.g., `OrderPlaced` triggering inventory, payment, and shipping) may exceed this limit. Document the reasoning.

---

## Consequences Of Violation

Difficult debugging when listeners fail. Unclear which listeners are critical. Poor separation of essential domain logic from optional side effects.

---

## Run CI Checks For Cross-Feature Model Imports

Automatically detect and reject direct cross-feature model imports in CI.

---

## Category

Scalability

---

## Rule

Add a static analysis or grep-based CI step that scans for `use App\Features\[^\]*\\Models\\` patterns in files outside that feature. Fail the build if any violation is found.

---

## Reason

Manual code review cannot catch every cross-feature model import. An automated CI gate ensures the rule is enforced consistently as the codebase grows. This is the only reliable way to maintain feature boundaries at scale.

---

## Bad Example

No CI check exists. A developer adds a direct model import in a PR. It passes review. The coupling goes unnoticed until extraction time.

---

## Good Example

```yaml
# .github/workflows/lint.yml
- name: Check cross-feature model imports
  run: |
    violations=$(grep -rn "use App\\Features" app/Features/ | grep "Models" || true)
    if [ -n "$violations" ]; then
      echo "Cross-feature model imports detected:"
      echo "$violations"
      exit 1
    fi
```

---

## Exceptions

Shared kernel files (`app/Kernel/`) and `AppServiceProvider` may reference feature namespaces for wiring dependencies. These are the only exceptions.

---

## Consequences Of Violation

Silent accumulation of coupling that makes feature extraction infeasible. Team culture of boundary violations erodes the architecture.
