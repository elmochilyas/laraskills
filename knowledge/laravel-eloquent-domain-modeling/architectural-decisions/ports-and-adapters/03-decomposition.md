# Decomposition: Ports and Adapters

## Files & Structure
```
src/
├── Domain/
│   ├── Contracts/
│   │   └── Repositories/
│   │       └── InvoiceRepository.php        # Port (interface)
│   ├── Models/
│   │   └── Invoice.php                      # Domain model (plain PHP)
│   └── Services/
│       └── InvoiceService.php               # Domain service (uses port)
└── Infrastructure/
    ├── Persistence/
    │   └── EloquentInvoiceRepository.php    # Adapter (Eloquent)
    └── Mail/
        └── LaravelInvoiceMailer.php         # Adapter (Laravel Mail)
```

## Decision Tree
```
Does the domain need to be tested in complete isolation?
├── No → Use Laravel conventions (models, actions, controllers)
└── Yes → Consider Ports and Adapters
    ├── Is the domain expected to outlive the framework?
    │   └── If yes → Hex arch is a strong fit
    └── Is the app a long-lived project with complex domain rules?
        └── If yes → Hex arch helps manage complexity
```

## Signatures

### PHP (Port — Domain Layer)
```php
namespace Domain\Contracts\Repositories;

use Domain\Models\Invoice;

interface InvoiceRepository
{
    public function findById(int $id): ?Invoice;
    public function store(Invoice $invoice): Invoice;
    public function delete(Invoice $invoice): void;
}
```

### PHP (Adapter — Infrastructure Layer)
```php
namespace Infrastructure\Persistence;

use Domain\Contracts\Repositories\InvoiceRepository;
use Domain\Models\Invoice;
use App\Models\Invoice as EloquentInvoice;

class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findById(int $id): ?Invoice
    {
        $eloquent = EloquentInvoice::find($id);
        return $eloquent ? Invoice::fromArray($eloquent->toArray()) : null;
    }

    public function store(Invoice $invoice): Invoice
    {
        $eloquent = EloquentInvoice::updateOrCreate(
            ['id' => $invoice->id],
            $invoice->toArray()
        );
        return Invoice::fromArray($eloquent->fresh()->toArray());
    }

    public function delete(Invoice $invoice): void
    {
        EloquentInvoice::destroy($invoice->id);
    }
}
```

### PHP (Service Provider Wiring)
```php
namespace App\Providers;

use Domain\Contracts\Repositories\InvoiceRepository;
use Infrastructure\Persistence\EloquentInvoiceRepository;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            InvoiceRepository::class,
            EloquentInvoiceRepository::class,
        );
    }
}
```

## Validation Criteria
- Domain layer has zero imports from `Illuminate\*`, `App\Models\*`, or framework classes
- All ports (interfaces) are defined in the Domain layer
- All adapters (implementations) are in the Infrastructure layer
- A port can be exchanged — e.g., `InMemoryInvoiceRepository` for tests
- Static analysis enforces that Domain does not depend on Infrastructure
- Service Provider is the only place where port → adapter binding occurs

## Layer Dependencies
```
Controllers/CLI/Queue (Driver Adapters)
    ↓ Depends on
Domain Services + Port Interfaces
    ↓ Depends on
Domain Models (Plain PHP, no framework)
    ↑ Implemented by
Infrastructure Adapters (Eloquent, Mail, Queue)
```

## Example: Adding Hex Arch Boundary

### Before (domain depends on Laravel)
```php
class InvoiceService
{
    // Domain service depends on Laravel's Eloquent directly
    public function processOverdue(): void
    {
        $invoices = Invoice::where('status', 'overdue')->get();
        foreach ($invoices as $invoice) {
            Mail::to($invoice->user)->send(new OverdueNotice($invoice));
        }
    }
}
```

### After (domain depends on ports)
```php
class InvoiceService
{
    public function __construct(
        private InvoiceRepository $invoices,   // Port
        private InvoiceMailer $mailer,         // Port
    ) {}

    public function processOverdue(): void
    {
        foreach ($this->invoices->findOverdue() as $invoice) {
            $this->mailer->sendOverdueNotice($invoice);
        }
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