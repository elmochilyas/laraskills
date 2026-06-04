# Decomposition: Query Object Alternative

## Files & Structure
- `App\Queries\{Domain}\{QueryName}Query.php` — Query class
- `App\Queries\{Domain}\Filters\{Filter}.php` — Optional filter classes
- `tests\Unit\Queries\{Domain}\{QueryName}QueryTest.php` — Tests with real DB

## Decision Tree
```
Is this a read-only operation (no writes)?
├── No → Keep in model method or action
└── Yes → Is the query simple (1-2 where clauses with scopes)?
    ├── Yes → Use a model local scope — no query object needed
    └── No → Is the query needed in multiple places or complex?
        ├── Yes → Extract to Query Object
        └── No → Keep inline in the action or controller
```

## Signatures

### PHP (Query Object)
```php
namespace App\Queries\Invoices;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class OverdueInvoicesQuery
{
    public function __construct(
        private int $daysOverdue = 30,
        private ?int $tenantId = null,
    ) {}

    public function __invoke(): Collection
    {
        return Invoice::with('user', 'lines')
            ->where('status', 'sent')
            ->where('due_at', '<', Carbon::now()->subDays($this->daysOverdue))
            ->when($this->tenantId, fn ($q) => $q->where('tenant_id', $this->tenantId))
            ->orderBy('due_at')
            ->get();
    }
}
```

### PHP (Usage in Controller/Action)
```php
class SendOverdueRemindersAction
{
    public function __construct(
        private OverdueInvoicesQuery $overdueInvoices,
    ) {}

    public function __invoke(): void
    {
        $invoices = ($this->overdueInvoices)(daysOverdue: 30);

        foreach ($invoices as $invoice) {
            // send reminder
        }
    }
}
```

## Validation Criteria
- Query object does not call `save()`, `update()`, or `delete()`
- Query object accepts explicit filter parameters (not raw request input)
- Query object is tested against a real database with known seed data
- Query object returns a typed result (Collection, Paginator, Model, or null)
- Query object does not contain business logic — only query construction

## Example: Scope → Query Object Migration

### Before (scopes get unwieldy)
```php
class Invoice extends Model
{
    public function scopeOverdueAndUnpaidAndHighValue($query, $threshold) { ... }
    public function scopeWithExpiredPaymentMethods($query) { ... }
    public function scopeForDashboardWidget($query) { ... }
    // Model grows too many scopes
}
```

### After (extract to Query Objects)
```php
// Separate query classes
class OverdueHighValueInvoicesQuery { ... }
class ExpiredPaymentMethodInvoicesQuery { ... }
class DashboardWidgetInvoicesQuery { ... }

// Model stays lean
class Invoice extends Model
{
    // Only core domain scopes remain
    public function scopeOverdue($query) { ... }
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