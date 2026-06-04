# Anti-Patterns: Inter-Module Communication

## 1. Direct Model Import Across Features

Using `use App\Features\Billing\Models\Invoice` in code outside the Billing feature.

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

Direct model access creates tight coupling that prevents independent refactoring of features. Feature B cannot change its model structure without breaking Feature A. All cross-feature data access must go through a service interface or event. Add a static analysis or CI step that scans for cross-feature model imports and fails the build.

## 2. Event With 15+ Listeners

A single `UserRegistered` event has 15 listeners — sending emails, creating accounts, notifying Slack, syncing to Mailchimp, and more.

Events with many listeners become debugging nightmares. Any single listener failure can cause cascading issues. It becomes unclear which listeners are essential and which are optional side effects. Limit the number of listeners attached to a single event to 5 or fewer. Split broad events into specific ones.

## 3. Interface for Everything

Creating `UserServiceInterface`, `InvoiceServiceInterface`, `PaymentServiceInterface` when there's only a single implementation.

Creating interfaces prematurely adds abstraction overhead without evidence of need. A single-consumer interface provides no benefit and increases the code surface area. Begin with concrete service classes within a feature. Extract an interface and move it to the shared kernel only when a second feature needs the same capability.

## 4. Shared Kernel Bloat With Single-Consumer Contracts

Adding `PdfGenerator`, `CsvExporter`, `EmailTemplateRenderer` interfaces to `app/Kernel/Contracts/` even though only the Billing feature uses them.

Every interface in the shared kernel is a backward-compatibility commitment. Adding interfaces speculatively creates dead code and increases cognitive load. Only add contracts, DTOs, and events to `app/Kernel/` when they are actually consumed by multiple features. Audit the shared kernel quarterly and remove single-consumer contracts.

## 5. Array-Based Cross-Feature Data

Passing raw arrays between features instead of typed DTOs.

```php
$reporting->generateReport([
    'total' => 1500.00,
    'currency' => 'USD',
    'items' => [...], // unknown structure
]);
```

Arrays lack type safety, IDE autocompletion, and self-documentation. Define explicit Data Transfer Objects in `app/Kernel/DTOs/` for any structured data that crosses feature boundaries. DTOs provide typed, immutable data contracts that are serializable and testable.

## 6. Concrete Class Injection Instead of Interface

Injecting `UserProfileService` directly into a consuming feature's constructor instead of `UserProfileProvider` interface.

```php
class ReportController extends Controller
{
    public function __construct(private UserProfileService $profiles) {}
    // Direct dependency on concrete class — cannot swap for testing
}
```

Concrete class coupling prevents testing with mocks and makes swapping implementations difficult. Always inject the interface, never the concrete class. Wire the binding in the owning feature's service provider.

## 7. No Contract Tests for Interfaces

Defining interfaces in the shared kernel but never writing tests that verify implementations fulfill the contract.

Interfaces can silently drift from their implementations when the owning feature changes. For every interface in `app/Kernel/Contracts/`, write a contract test that exercises the interface methods through the container-resolved implementation. Run these tests in CI to detect interface drift.
