# Livewire Volatile Properties

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Volatile Properties
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Volatile properties (Livewire v3) are public properties marked with the `#[Volatile]` attribute. These properties are NOT serialized between requests — they exist only during the current request. After the component re-renders, volatile properties are reset to their initial values. This is useful for storing temporary state (passwords, tokens, intermediate computation results) that should not be sent to the frontend.

The engineering value is security and performance. Sensitive data (API keys, one-time tokens) marked as volatile is never serialized and sent to the client. Intermediate computation results are discarded after the render, reducing the serialized payload size.

---

## Core Concepts

### Volatile Declaration

```php
use Livewire\Attributes\Volatile;

class ProcessPayment extends Component
{
    #[Volatile]
    public string $paymentToken = '';

    public int $amount = 0;

    public function process(): void
    {
        $this->paymentToken = PaymentGateway::generateToken();
        // After render, paymentToken is reset to ''
    }
}
```

### Behavior

| Aspect | Normal Property | Volatile Property |
|---|---|---|
| Serialized to frontend | Yes | No |
| Persists across requests | Yes | No (reset after render) |
| Available in component | Yes (set and read) | Yes (set and read, but reset) |
| Use case | UI state, form data | Temporary secrets, intermediate values |

### Reset

After each render, volatile properties are reset to their default values (as defined in the class property declaration).

---

## Mental Models

### The Scratch Pad

Volatile properties are like a scratch pad — you write values, use them during the request, and they are erased after the response. They exist only in the current request's memory.

### The One-Time Code

Think of a volatile property like a one-time SMS code. It's generated, used, and discarded. It should never be stored or transmitted beyond its immediate use.

---

## Internal Mechanics

### Serialization Filter

Livewire's dehydration process checks each property for the `#[Volatile]` attribute. If present, the property is excluded from the serialized snapshot sent to the frontend.

### Reset on Dehydration

After the component's `render()` method returns and the response is being prepared, volatile properties are reset to their default values. This happens in the `dehydrate` phase.

### Default Value Resolution

The default value is the initial value from the property declaration:

```php
#[Volatile]
public string $tempToken = 'default';
// After each request, $tempToken is reset to 'default'
```

---

## Patterns

### One-Time Token Processing

```php
class ProcessPayment extends Component
{
    #[Volatile]
    public string $stripeToken = '';

    public int $amount = 0;

    public function process(): void
    {
        $this->validate(['amount' => 'required|numeric|min:1']);
        $this->stripeToken = PaymentService::createToken($this->amount);
        // stripeToken is never sent to the frontend
        $this->dispatch('payment-token-ready');
    }
}
```

### Intermediate Computation

```php
class Dashboard extends Component
{
    #[Volatile]
    public array $rawStats = [];

    public array $formattedStats = [];

    public function mount(): void
    {
        $this->rawStats = $this->fetchRawStats();
        $this->formattedStats = $this->formatStats($this->rawStats);
        // rawStats is discarded after mount — only formattedStats persists
    }
}
```

### Security-Sensitive State

```php
class TwoFactorChallenge extends Component
{
    #[Volatile]
    public string $recoveryCode = '';

    public string $code = '';

    public function generateRecovery(): void
    {
        $this->recoveryCode = 'backup-' . Str::random(20);
        // The code is never serialized to the frontend
    }

    public function confirm(): void
    {
        if ($this->recoveryCode && $this->code === $this->recoveryCode) {
            // ...
        }
    }
}
```

---

## Architectural Decisions

### Volatile vs Storing in Session

| Concern | Volatile Property | Session |
|---|---|---|
| Scope | Current request only | Across requests |
| Serialization | Not serialized | Serialized |
| Security | Not sent to client | Not sent to client |
| Cleanup | Automatic (after render) | Manual (forget) |
| Access | `$this->property` | `session()->get('key')` |

Use volatile for data that only exists during a single request. Use session for data that must survive across multiple requests.

### Volatile vs Private Property

| Concern | Volatile (public) | Private |
|---|---|---|
| Template access | Yes (not serialized) | No (PHP access only) |
| Serialization | No | Not serialized (private) |
| Purpose | Temporary data used in actions and views | Internal component logic |

Use private for helper methods and dependency references. Use volatile for temporary public state that should not persist.

---

## Tradeoffs

| Concern | Volatile | Normal Public | Private |
|---|---|---|---|
| Template access | Yes | Yes | No |
| Persists across requests | No | Yes | Yes |
| Security (not serialized) | Yes | No | Yes |
| Common use case | Temporary secrets | Form state | Dependencies |

---

## Performance Considerations

Volatile properties reduce the serialized payload size — any data marked as volatile is not included in the snapshot sent to the frontend. For properties with large data (arrays, objects), the savings can be significant (10-100KB per request).

---

## Production Considerations

### Mark All Secrets as Volatile

Any property that holds sensitive data (tokens, passwords, API keys) should be marked `#[Volatile]`. This prevents accidental exposure via Livewire's serialized snapshot.

### Use Volatile for Large Intermediate Data

If a property holds large data that is only needed during a single request (parsed CSV, temporary API response), mark it as volatile to avoid serializing it unnecessarily.

### Test That Volatile Data Is Not Serialized

```php
public function test_payment_token_is_not_serialized()
{
    Livewire::test(ProcessPayment::class)
        ->call('process')
        ->assertNotSet('paymentToken', 'some-token'); // Volatile — reset after call
}
```

---

## Common Mistakes

### Expecting Volatile Data to Persist

A common mistake: set a volatile property in one action and expect it to be available in a subsequent action. Volatile properties are reset after every render. Use normal properties or session for cross-request data.

### Over-Marking as Volatile

Marking EVERYTHING as volatile defeats the purpose. Volatile is for data that genuinely should not persist between renders. Form data, list state, and user selections should be normal properties.

### Forgetting Default Values

A volatile property without an explicit default value is `null`. If the component expects it to be a string, initialize it:

```php
#[Volatile]
public string $token = ''; // Default — empty string, not null
```

---

## Failure Modes

### Inconsistent State

If a volatile property is needed in the rendered template but is reset before the template variables are extracted, the template sees the default value (not the value set in the action). This is by design — volatile properties are available during the render that follows the action.

### Debugging Confusion

In Laravel Debugbar, volatile properties appear as set during the action but reset in the component state after the request. This can confuse debugging — check the property value in the action, not after the response.

---

## Ecosystem Usage

Volatile properties are a Livewire v3 feature using the `#[Volatile]` attribute from `Livewire\Attributes\Volatile`. They integrate with Livewire's dehydration pipeline and component serialization. Testing volatile behavior uses the standard `Livewire::test()` assertion methods.

## Related Knowledge Units

- **Component Architecture** (this workspace) — property types
- **Lifecycle Hooks** (this workspace) — dehydration and volatile reset
- **Lazy Loading** (this workspace) — volatile with lazy properties

---

## Research Notes

- `#[Volatile]` was introduced in Livewire v3
- Volatile properties are reset in the `dehydrate` phase, AFTER the render
- The attribute is defined in `Livewire\Attributes\Volatile`
- Volatile properties cannot be accessed from the frontend via `$wire.property`
