# Decomposition: Framework Decoupling

## Files & Structure
Workspace structure with decoupled domain:
```
project/
├── domain/
│   ├── Contracts/
│   │   └── Repositories/
│   │       ├── InvoiceRepository.php       # Domain-owned port
│   │       └── CustomerRepository.php
│   ├── Models/
│   │   ├── Invoice.php                    # Plain PHP domain model
│   │   └── Customer.php
│   ├── Services/
│   │   └── BillingService.php             # Domain service (pure)
│   └── Exceptions/
│       └── InvoiceException.php
├── infrastructure/
│   ├── Persistence/
│   │   ├── EloquentInvoiceRepository.php  # Laravel adapter
│   │   └── EloquentCustomerRepository.php
│   ├── Mail/
│   │   └── LaravelInvoiceMailer.php
│   └── Time/
│       └── SystemClock.php
├── app/
│   └── Http/
│       └── Controllers/
│           └── InvoiceController.php      # Laravel driver adapter
├── tests/
│   ├── Domain/                            # Fast, no framework
│   │   └── Models/
│   │       └── InvoiceTest.php
│   └── Infrastructure/                    # Slow, needs DB
│       └── Persistence/
│           └── EloquentInvoiceRepositoryTest.php
```

## Decision Tree
```
Does the domain contain complex, valuable business logic?
├── Yes → Decouple domain from framework
│   ├── Interface ownership by domain
│   ├── Adapters in infrastructure layer
│   └── Static analysis enforcing purity
└── No → Use Laravel conventions (models, actions, controllers)
    └── Decoupling adds cost without benefit
```

## Signatures

### PHP (Domain — Pure PHP, No Framework)
```php
namespace Domain\Models;

use Domain\Contracts\Repositories\InvoiceRepository;
use Domain\Contracts\Clock;

class BillingService
{
    public function __construct(
        private InvoiceRepository $invoices,       // Domain-owned port
        private Clock $clock,                       // Domain-owned port
    ) {}

    public function processOverdue(): array
    {
        $overdue = $this->invoices->findOverdueAsOf($this->clock->now());
        $results = [];
        foreach ($overdue as $invoice) {
            try {
                $invoice->applyLateFee();
                $this->invoices->store($invoice);
                $results[] = ['invoice' => $invoice->number, 'status' => 'fee_applied'];
            } catch (\DomainException $e) {
                $results[] = ['invoice' => $invoice->number, 'status' => 'error', 'reason' => $e->getMessage()];
            }
        }
        return $results;
    }
}
```

### PHP (Laravel Adapter for Clock)
```php
namespace Infrastructure\Time;

use Domain\Contracts\Clock;

class SystemClock implements Clock
{
    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now');
    }
}
```

### PHP (Service Provider Binding)
```php
// In AppServiceProvider
public function register(): void
{
    $this->app->bind(
        \Domain\Contracts\Clock::class,
        \Infrastructure\Time\SystemClock::class,
    );
    $this->app->bind(
        \Domain\Contracts\Repositories\InvoiceRepository::class,
        \Infrastructure\Persistence\EloquentInvoiceRepository::class,
    );
}
```

## Validation Criteria
- `Domain/` namespace has zero `use Illuminate\*` or `use App\Models\*` imports
- All domain services receive dependencies via constructor injection (no `app()`, no `resolve()`)
- Domain models use `DateTimeImmutable` not `Carbon`
- Domain models use native PHP arrays or `array<int, T>` not `Collection`
- All framework adapters implement domain-owned interfaces
- PHPStan/Psalm is configured to reject `Illuminate\*` imports in `Domain/`
- Domain unit tests run without `RefreshDatabase`, without `TestCase` — just plain PHPUnit

## Example: Framework Leak → Decoupled

### Before (domain leaked into framework)
```php
class PaymentController extends Controller
{
    public function process(PaymentRequest $request)
    {
        $user = User::findOrFail($request->user_id);
        $amount = $request->amount;

        if ($user->balance < $amount) {
            return response()->json(['error' => 'Insufficient funds'], 422);
        }

        $user->balance -= $amount;
        $user->save();

        Transaction::create(['user_id' => $user->id, 'amount' => -$amount]);

        return response()->json(['status' => 'ok']);
    }
}
```

### After (domain decoupled)
```php
// Controller stays thin
class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function process(PaymentRequest $request): JsonResponse
    {
        try {
            $this->payments->process(
                $request->user_id,
                Money::fromCents($request->amount_cents),
            );
            return response()->json(['status' => 'ok']);
        } catch (InsufficientFunds $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}

// Domain service is pure
class PaymentService
{
    public function __construct(
        private UserRepository $users,
        private TransactionRepository $transactions,
    ) {}

    public function process(int $userId, Money $amount): void
    {
        $user = $this->users->findById($userId);
        $user->withdraw($amount);
        $this->users->store($user);
        $this->transactions->record($userId, $amount->negate());
    }
}
```
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization