# Decomposition: When to Use Actions

## Files & Structure
- `App\Actions\{Domain}\{UseCase}Action.php` — One class per use-case
- `App\Http\Requests\{Domain}\{UseCase}Request.php` — Validation (separated)
- `App\DataTransferObjects\{Domain}\{UseCase}Data.php` — Typed input
- `App\Enums\{Domain}\{UseCase}Result.php` — Return type enum or DTO
- `tests\Unit\Actions\{Domain}\{UseCase}ActionTest.php` — Unit test
- `tests\Feature\Actions\{Domain}\{UseCase}ActionTest.php` — Feature test

## Decision Tree
```
Is the operation cross-aggregate (touches >1 model)?
├── Yes → Use Action Class
│   ├── Does it need DB atomicity? → Wrap in DB::transaction()
│   ├── Does it need queue async? → Use spatie/laravel-queueable-action
│   └── Does it need events? → Dispatch after commit
└── No → Can it be written as an Eloquent model method?
    ├── Yes → Stay on the model
    └── No → Re-evaluate: Is this really cross-aggregate?
```

## Signatures

### PHP (Laravel Action)
```php
namespace App\Actions\Orders;

use App\Models\Order;
use App\Models\Inventory;
use App\Models\Shipment;
use Illuminate\Support\Facades\DB;

class PlaceOrderAction
{
    public function __construct(
        private GenerateShipmentAction $generateShipment,
    ) {}

    public function __invoke(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->markAsPlaced();
            $this->generateShipment->forOrder($order);
            Inventory::deductForOrder($order);
        });
    }
}
```

## Validation Criteria
- Action contains zero raw database queries (delegated to models)
- Action contains zero HTTP concerns (no Request, no Response)
- Action is testable with `$this->partialMock()` or real model factories
- Action's public method signature accepts validated data (DTO or model)
- Action has a single reason to change (the use-case rule itself)

## Example Refactoring

### Before (fat controller)
```php
class OrderController
{
    public function place(Request $request, Order $order)
    {
        $order->status = 'placed';
        $order->save();

        $shipment = $order->shipments()->create([...]);
        Mail::to($order->user)->send(...);

        Inventory::where('product_id', $order->product_id)->decrement(...);

        return redirect()->route('orders.show', $order);
    }
}
```

### After (action-driven)
```php
class OrderController
{
    public function __construct(private PlaceOrderAction $placeOrder) {}

    public function place(PlaceOrderRequest $request, Order $order)
    {
        $this->placeOrder->__invoke($order);
        return redirect()->route('orders.show', $order);
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