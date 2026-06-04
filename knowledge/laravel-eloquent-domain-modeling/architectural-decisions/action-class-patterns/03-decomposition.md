# Decomposition: Action Class Patterns

## Files & Structure
- `App\Actions\{Domain}\{Verb}{Entity}Action.php` — Single action class
- `App\Actions\{Domain}\Concerns\HandlesSomething.php` — Shared action traits
- `App\Actions\{Domain}\Results\{Action}Result.php` — Typed result DTO
- `tests\Unit\Actions\{Domain}\{Action}Test.php` — Unit test (mocked dependencies)
- `tests\Feature\Actions\{Domain}\{Action}Test.php` — Feature test (real DB)

## Decision Tree
```
Is the use case a single cross-aggregate operation?
├── Yes → Create Action class
│   ├── Should it run synchronously? → Use DB::transaction()
│   ├── Should it run on queue? → Implement ShouldQueue + Queueable
│   ├── Should it be both? → Use spatie/laravel-queueable-action
│   └── Input validation needed? → Pair with FormRequest
└── No → Can it be done on the model? → Model method
```

## Signatures

### PHP (Basic Action)
```php
namespace App\Actions\Invoices;

use App\DataTransferObjects\PayInvoiceData;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class PayInvoiceAction
{
    public function __construct(
        private SendInvoiceReceiptAction $sendReceipt,
    ) {}

    public function __invoke(Invoice $invoice, PayInvoiceData $data): Payment
    {
        return DB::transaction(function () use ($invoice, $data) {
            $payment = $invoice->recordPayment(
                amount: $data->amount,
                method: $data->method
            );
            $this->sendReceipt->forPayment($payment);
            return $payment;
        });
    }
}
```

### PHP (Queued Action)
```php
namespace App\Actions\Invoices;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

class ProcessInvoiceAction implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function __construct(
        private int $invoiceId,
        private array $payload,
    ) {}

    public function handle(): void
    {
        $invoice = Invoice::findOrFail($this->invoiceId);
        // ... processing logic
    }
}
```

## Validation Criteria
- Action class is invocable (`__invoke` or `handle`)
- All dependencies are constructor-injected
- Action never uses `app()` or `resolve()` internally
- Action file stays under 100 lines of logic
- Action returns typed result or void (never `mixed`)
- Action is covered by at least one test that verifies the outcome

## Example Refactoring

### Before (inline controller logic)
```php
class SubscriptionController
{
    public function cancel(Request $request, Subscription $subscription)
    {
        $subscription->update(['status' => 'canceled', 'canceled_at' => now()]);
        $subscription->user->notify(new SubscriptionCanceled($subscription));
        event(new SubscriptionCanceledEvent($subscription));
        return redirect()->back();
    }
}
```

### After (action class)
```php
class CancelSubscriptionAction
{
    public function __construct(
        private NotifyUserAction $notifyUser,
    ) {}

    public function __invoke(Subscription $subscription): void
    {
        DB::transaction(function () use ($subscription) {
            $subscription->cancel();
            $this->notifyUser->subscriptionCanceled($subscription);
            event(new SubscriptionCanceledEvent($subscription));
        });
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