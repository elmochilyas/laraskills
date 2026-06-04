# Factory Method Alternatives — Standardized Knowledge

## Overview

Factory methods encapsulate complex model instantiation logic into named static methods on the model, replacing scattered `new Model()` calls with intention-revealing creation. They handle multiple creation paths (draft order, express order, recurring order) without requiring callers to know the setup details.

## Key Concepts

- **Named static factory method** — a static method on the model that returns a new instance
- **Intention-revealing name** — `draftForCustomer()`, `expressFromCart()` describe the creation intent
- **Create, don't persist** — factory methods return unsaved instances by default
- **Multiple creation paths** — different factory methods for different business scenarios
- **Encapsulated setup** — default values, initial relationships, and business rules in one place

## Implementation Details

```php
class Order extends Model
{
    public static function draftForCustomer(Customer $customer): self
    {
        $order = new self();
        $order->customer_id = $customer->id;
        $order->status = self::STATUS_DRAFT;
        $order->currency = $customer->preferredCurrency();
        $order->order_number = self::nextOrderNumber();
        return $order;
    }

    public static function expressFromCart(Cart $cart): self
    {
        $order = new self();
        $order->customer_id = $cart->customer_id;
        $order->status = self::STATUS_PENDING;
        $order->items = $cart->items->map->toOrderItem()->toArray();
        return $order;
    }
}
```

## Best Practices

- Name factory methods to express business intent, not implementation
- Factory methods create but do not persist — caller decides when to save
- Keep factory methods free of external service calls
- Replace `new Model()` followed by property assignments with factory methods
- Use multiple factory methods for different creation paths
