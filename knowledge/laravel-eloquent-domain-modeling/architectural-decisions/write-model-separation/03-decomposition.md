# Decomposition: Write Model Separation

## Files & Structure
- `App\Commands\{Domain}\{Verb}{Entity}Command.php` — Command DTO
- `App\Handlers\{Domain}\{Verb}{Entity}Handler.php` — Command handler
- `App\Models\{Entity}.php` — Write model (domain logic + persistence)
- `App\Contracts\Repositories\Write\{Entity}WriteRepository.php` — Optional write-only repository
- `tests\Unit\Handlers\{Domain}\{Verb}{Entity}HandlerTest.php` — Handler tests
- `tests\Feature\Commands\{Domain}\{Verb}{Entity}CommandTest.php` — Full end-to-end test

## Decision Tree
```
Does this operation mutate state and have complex business rules?
├── No → Use a model method directly (simple save/update)
└── Yes → Create a Command + Handler
    ├── Does the command need transactional consistency?
    │   ├── Yes → Wrap handler in DB::transaction()
    │   └── No → Keep handler as-is
    └── Does the command need concurrency control?
        ├── Yes → Add optimistic locking to write model
        └── No → Standard handler pattern
```

## Signatures

### PHP (Command DTO)
```php
namespace App\Commands\Orders;

class CancelOrderCommand
{
    public function __construct(
        public readonly int $orderId,
        public readonly string $reason,
        public readonly bool $refundImmediately = false,
    ) {}
}
```

### PHP (Command Handler)
```php
namespace App\Handlers\Orders;

use App\Commands\Orders\CancelOrderCommand;
use App\Models\Order;
use App\Exceptions\OrderCannotBeCancelled;
use Illuminate\Support\Facades\DB;

class CancelOrderHandler
{
    public function __construct(
        private ProcessRefundHandler $processRefund,
    ) {}

    public function handle(CancelOrderCommand $command): void
    {
        DB::transaction(function () use ($command) {
            $order = Order::lockForUpdate()->findOrFail($command->orderId);

            if (! $order->canBeCancelled()) {
                throw new OrderCannotBeCancelled($order);
            }

            $order->cancel($command->reason);
            $order->save();

            if ($command->refundImmediately) {
                $this->processRefund->handle(
                    new ProcessRefundCommand($order->id)
                );
            }

            event(new OrderCancelled($order));
        });
    }
}
```

### PHP (Usage via Bus)
```php
// In controller
use App\Commands\Orders\CancelOrderCommand;

class OrderController
{
    public function __construct(
        private \Illuminate\Bus\Dispatcher $bus,
    ) {}

    public function cancel(CancelOrderRequest $request, Order $order)
    {
        $this->bus->dispatch(
            new CancelOrderCommand(
                orderId: $order->id,
                reason: $request->reason,
                refundImmediately: $request->boolean('refund'),
            )
        );

        return redirect()->route('orders.show', $order);
    }
}
```

## Validation Criteria
- Every state mutation goes through a command handler
- Command handlers are transactional (all-or-nothing writes)
- Command handlers do not return data designed for display (return `void` or a simple success signal)
- Write models do not have public query methods (finders, scopes)
- Command handlers are testable with a known initial state and asserted final state

## Example: Adding Command Separation

### Before (controller reads and writes freely)
```php
class OrderController
{
    public function cancel(Request $request, Order $order)
    {
        $order->status = 'cancelled';
        $order->cancelled_at = now();
        $order->cancellation_reason = $request->reason;
        $order->save();

        if ($request->boolean('refund')) {
            $order->payments()->each->refund();
        }

        return redirect()->back();
    }
}
```

### After (command handler owns the write)
```php
class OrderController
{
    public function __construct(private CancelOrderHandler $cancelOrder) {}

    public function cancel(CancelOrderRequest $request, Order $order)
    {
        $this->cancelOrder->handle(
            new CancelOrderCommand(
                orderId: $order->id,
                reason: $request->reason,
                refundImmediately: $request->boolean('refund'),
            )
        );
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