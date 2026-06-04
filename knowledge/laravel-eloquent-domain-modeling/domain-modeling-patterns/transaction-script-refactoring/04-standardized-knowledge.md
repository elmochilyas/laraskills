# Transaction Script Refactoring — Standardized Knowledge

## Overview

Transaction script refactoring extracts business logic from fat controllers (transaction scripts) into domain methods on models. The controller becomes a thin coordinator that reads input, calls domain methods, and returns a response. Business logic becomes testable without HTTP and reusable across API, web, CLI, and queue contexts.

## Key Concepts

- **Transaction script** — procedural logic in a controller that loads, validates, transforms, and persists data
- **Domain method extraction** — moving business rules and state changes into model methods
- **Thin controller** — sequences calls to domain methods, contains no business logic
- **Side effect decoupling** — emails, notifications, and logs move to domain event listeners
- **Testability** — domain methods are tested directly without HTTP dependencies

## Implementation Details

```php
// Before — fat controller
public function confirm(Order $order): RedirectResponse
{
    if ($order->status !== 'pending') {
        throw new \Exception('Order cannot be confirmed');
    }
    $order->status = 'confirmed';
    $order->confirmed_at = now();
    $order->save();
    Mail::to($order->user)->send(new OrderConfirmed($order));
    return redirect()->route('orders.show', $order);
}

// After — thin controller
public function confirm(Order $order): RedirectResponse
{
    $order->confirm();
    return redirect()->route('orders.show', $order);
}
```

## Best Practices

- Extract all business logic from controllers to model domain methods
- Controllers sequence calls, models execute business rules
- Move side effects (email, notifications) to domain event listeners
- Test domain methods directly, not through HTTP
- Do not leave duplicate logic in controllers after extraction
