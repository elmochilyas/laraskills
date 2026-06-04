# Decomposition: Eloquent as Adapter

## Files & Structure
- `Domain\Contracts\Repositories\{Entity}Repository.php` — Port (interface)
- `Domain\Models\{Entity}.php` — Domain model (plain PHP, no Eloquent)
- `Infrastructure\Persistence\Eloquent{Entity}Repository.php` — Adapter (uses Eloquent internally)
- `Infrastructure\Persistence\Mappers\{Entity}Mapper.php` — Optional explicit mapper
- `tests\Unit\Domain\Models\{Entity}Test.php` — Domain model tests (no DB)
- `tests\Unit\Infrastructure\Persistence\{Entity}RepositoryTest.php` — Adapter tests (with DB)

## Decision Tree
```
Is the domain complex enough to justify separation from Eloquent?
├── Yes → Domain models as plain PHP, Eloquent as adapter
│   ├── Is mapping straightforward? → Use array-based mapping in repository
│   └── Is mapping complex? → Extract a dedicated Mapper class
└── No → Use Eloquent as the domain model directly (standard Laravel)
```

## Signatures

### PHP (Domain Model — Plain PHP)
```php
namespace Domain\Models;

use Domain\ValueObjects\Money;
use Domain\ValueObjects\InvoiceStatus;

class Invoice
{
    public function __construct(
        public readonly int $id,
        public string $number,
        public InvoiceStatus $status,
        public Money $total,
        public \DateTimeImmutable $createdAt,
    ) {}

    public function markAsPaid(): void
    {
        if ($this->status !== InvoiceStatus::Sent) {
            throw new \DomainException('Only sent invoices can be paid.');
        }
        $this->status = InvoiceStatus::Paid;
    }
}
```

### PHP (Eloquent Adapter)
```php
namespace Infrastructure\Persistence;

use Domain\Contracts\Repositories\InvoiceRepository;
use Domain\Models\Invoice as DomainInvoice;
use Domain\ValueObjects\InvoiceStatus;
use Domain\ValueObjects\Money;

class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findById(int $id): ?DomainInvoice
    {
        $eloquent = \App\Models\Invoice::with('lines')->find($id);
        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function store(DomainInvoice $invoice): DomainInvoice
    {
        $eloquent = \App\Models\Invoice::updateOrCreate(
            ['id' => $invoice->id],
            [
                'number' => $invoice->number,
                'status' => $invoice->status->value,
                'total_cents' => $invoice->total->toCents(),
                'created_at' => $invoice->createdAt,
            ]
        );
        return $this->toDomain($eloquent->fresh());
    }

    private function toDomain(\App\Models\Invoice $eloquent): DomainInvoice
    {
        return new DomainInvoice(
            id: $eloquent->id,
            number: $eloquent->number,
            status: InvoiceStatus::from($eloquent->status),
            total: Money::fromCents($eloquent->total_cents),
            createdAt: new \DateTimeImmutable($eloquent->created_at),
        );
    }
}
```

## Validation Criteria
- Domain models never extend `Illuminate\Database\Eloquent\Model`
- Domain models have no `save()`, `::find()`, or `::query()` methods
- All Eloquent imports are restricted to the Infrastructure layer
- Repository methods only accept/return domain models or scalars
- Domain models use only native PHP types and custom value objects (no Carbon, no Eloquent collections)
- Static analysis (PHPStan level 8) enforces no `Illuminate\*` imports in Domain namespace

## Example: Refactoring to Eloquent as Adapter

### Before (Eloquent mixed with domain)
```php
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        // Domain logic + Active Record coupling
        if ($this->status !== 'sent') {
            throw new \DomainException('Only sent invoices can be paid.');
        }
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }
}
```

### After (separation)
```php
// Domain model (pure)
class Invoice
{
    public function markAsPaid(): void
    {
        if ($this->status !== InvoiceStatus::Sent) {
            throw new \DomainException('Only sent invoices can be paid.');
        }
        $this->status = InvoiceStatus::Paid;
    }
}

// Adapter handles persistence
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function store(DomainInvoice $domain): DomainInvoice
    {
        // Map domain → Eloquent → save
        return $this->toDomain(
            \App\Models\Invoice::updateOrCreate(
                ['id' => $domain->id],
                ['status' => $domain->status->value, ...]
            )
        );
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