# Decomposition: Read Model Separation

## Files & Structure
- `App\Models\Read\{ReadModelName}.php` — Read model (possibly view-backed)
- `App\Projectors\{Domain}\{Event}Projector.php` — Projector that updates read model
- `App\Queries\{Domain}\{QueryName}Query.php` — Query against read model
- `database\migrations\{timestamp}_create_{read_model}_table.php` — Read model table migration
- `database\migrations\{timestamp}_create_{read_model}_view.php` — Optional DB view migration
- `tests\Unit\Projectors\{Domain}\{Event}ProjectorTest.php` — Projector tests

## Decision Tree
```
Does the read representation differ significantly from the write model?
├── No → Use Eloquent model directly — no separation needed
└── Yes → Can a database view provide the read shape without code?
    ├── Yes → Create DB view + read-only Eloquent model (easiest CQRS-lite)
    └── No → Does the read model need data from multiple aggregates?
        ├── Yes → Separate read model table + projector (queue or sync)
        └── No → Cache-based read model (simpler than full projection)
```

## Signatures

### PHP (View-Backed Read Model)
```php
namespace App\Models\Read;

use Illuminate\Database\Eloquent\Model;

class UserOrderSummary extends Model
{
    protected $table = 'user_order_summaries'; // This is a database view

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    public $timestamps = false;

    // Read-only — no create/save/delete
    protected $guarded = [];
}
```

### SQL (Database View for Read Model)
```sql
CREATE VIEW user_order_summaries AS
SELECT
    u.id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.total_cents), 0) AS lifetime_value_cents,
    MAX(o.created_at) AS last_order_at
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
GROUP BY u.id, u.name, u.email;
```

### PHP (Projector-Based Read Model)
```php
namespace App\Projectors;

use App\Models\Read\UserOrderSummary;
use Spatie\EventSourcing\EventHandlers\Projectors\Projector;

class UserOrderSummaryProjector extends Projector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        UserOrderSummary::updateOrCreate(
            ['user_id' => $event->order->user_id],
            [
                'total_orders' => DB::raw('total_orders + 1'),
                'lifetime_value_cents' => DB::raw(
                    'lifetime_value_cents + ' . $event->order->total_cents
                ),
                'last_order_at' => $event->order->created_at,
            ]
        );
    }
}
```

## Validation Criteria
- Read model classes never have `save()`, `create()`, `update()`, or `delete()` calls
- Read models are populated by projectors, event handlers, or database views
- Read model tests assert the projected output, not the internal query
- Read model rebuild is possible (Artisan command + replay mechanism)
- Read model is independently indexable from the write model

## Example: Dashboard Query Optimization

### Before (write model queried for read — slow JOINs)
```php
// In controller — slow query every page load
$data = User::withCount(['orders as total_orders'])
    ->withSum(['orders as lifetime_value'], 'total_cents')
    ->get();
```

### After (read model — precomputed view)
```php
// In controller — single table query, no JOINs
$data = UserOrderSummary::all();
```
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization