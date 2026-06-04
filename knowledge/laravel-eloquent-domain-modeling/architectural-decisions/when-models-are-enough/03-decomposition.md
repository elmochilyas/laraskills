# Decomposition: When Models Are Enough

## Files & Structure
- `App\Models\{Entity}.php` — Model with domain methods
- `App\Models\Concerns\{Behavior}.php` — Trait for grouping related methods
- `App\Casts\{ValueObject}.php` — Custom cast for value objects
- `App\Enums\{Status}.php` — State enum
- `tests\Unit\Models\{Entity}Test.php` — Model tests

## Decision Tree
```
Does the operation touch more than one aggregate root?
├── Yes → NOT "model enough" → consider Action class
└── No → Does it require external side-effects (email, API, queue)?
    ├── Yes → Still model method as the logic, but dispatch events
    │         for the side-effects (or extract to action)
    └── No → Belongs on the model
```

## Signatures

### PHP (Model Method)
```php
namespace App\Models;

use App\Enums\InvoiceStatus;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = InvoiceStatus::Paid;
        $this->paid_at = now();
        $this->save();
    }

    public function isOverdue(): bool
    {
        return $this->status === InvoiceStatus::Sent
            && $this->due_at->isPast();
    }

    public function totalInCents(): int
    {
        return $this->items->reduce(
            fn (int $carry, $item) => $carry + $item->subtotalInCents(),
            0
        );
    }
}
```

## Validation Criteria
- Every model method only references `$this` attributes and owned relations
- No model method calls `Mail::to()`, `dispatch()`, or other external services
- Model methods have 100% test coverage with model factories (no mocks)
- Model class stays under ~300 lines; related groups extracted to traits
- No model method writes to a different model's table directly

## Example Refactoring

### Before (logic in controller)
```php
class InvoiceController
{
    public function pay(PayRequest $request, Invoice $invoice)
    {
        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);
        return redirect()->back();
    }
}
```

### After (logic on model)
```php
class InvoiceController
{
    public function pay(PayRequest $request, Invoice $invoice)
    {
        $invoice->markAsPaid();
        return redirect()->back();
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