# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Volatile Properties |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Volatile properties (Livewire v3) are public properties marked with the `#[Volatile]` attribute. These properties are NOT serialized between requests — they exist only during the current request. After the component re-renders, volatile properties are reset to their initial values. The engineering value is security and performance: sensitive data (API keys, one-time tokens) marked as volatile is never serialized and sent to the frontend.

---

## Core Concepts

- **`#[Volatile]` attribute**: Marks a property as non-serializable
- **Not sent to frontend**: Volatile properties are excluded from the component snapshot
- **Reset after render**: Volatile properties reset to their default (declared) value after each request
- **Normal vs Volatile**: Normal properties persist across requests; volatile properties exist only in the current request
- **Default value resolution**: The default is the initial value from the property declaration

---

## When To Use

- One-time tokens (payment tokens, CSRF tokens) that should not persist
- Intermediate computation results that don't need to survive re-render
- Sensitive data (passwords, API keys) that should never be sent to the frontend
- Large temporary data that shouldn't increase snapshot size

## When NOT To Use

- UI state that needs to persist across requests (form input values, toggles, selections)
- Data that needs to survive component re-renders
- Properties that are used in the Blade template (volatile properties are reset before render)

---

## Best Practices

- **Mark all sensitive properties as `#[Volatile]`** — passwords, tokens, secrets should never be serialized
- **Use volatile for intermediate computation results** — large arrays, processed data that are discarded after render
- **Keep volatile properties minimal** — only mark what genuinely needs to be volatile
- **Don't rely on volatile values persisting** — they reset after each render; set them in action methods as needed
- **Use volatile for payment processing tokens** — generate token in action, use it, discard after render
- **Document volatile properties** — team members should know why a property is volatile

---

## Architecture Guidelines

- Livewire's dehydration process checks each property for `#[Volatile]` attribute
- If present, the property is excluded from the serialized snapshot sent to the frontend
- Reset happens in the `dehydrate` phase, after `render()` returns and before the response is sent
- The default value is the initial value from the property declaration line
- Volatile properties can still be used in Blade templates — they're reset AFTER rendering

---

## Performance

Volatile properties reduce the component snapshot size by excluding non-essential data. For large intermediate data (temporary arrays, processed collections), this can significantly reduce AJAX payload size. No additional performance overhead from the volatility check.

---

## Security

Volatile properties are a critical security feature: they ensure sensitive data is NEVER sent to the client in the HTML snapshot. Without `#[Volatile]`, every public property is serialized and visible in the page source. Always use `#[Volatile]` for passwords, payment tokens, API keys, and any personally identifiable information (PII) that the client doesn't need.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Sensitive data NOT marked volatile | Forgetting the attribute | Data exposed in HTML snapshot | Always use #[Volatile] for secrets |
| Using volatile for persistent state | Misunderstanding reset behavior | Data lost after re-render | Use normal properties for UI state |
| Setting volatile in mount() | Expecting it to persist | Reset after first render | Set in action methods where needed |
| Accessing volatile in computed property | Computed runs after reset | Gets default value, not expected value | Use normal property or pass explicitly |

---

## Anti-Patterns

- **Storing passwords without `#[Volatile]`**: Password exposed in the HTML source
- **Payment tokens in normal properties**: Token visible in snapshot for the entire session
- **Large intermediate data not volatile**: Gigantic temporary arrays bloating every AJAX response
- **UI state as volatile**: Tracked data that disappears after re-render

---

## Examples

**Volatile for payment token:**
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
        // Token was never sent to the client
    }
}
```

**Volatile for intermediate data:**
```php
class ReportViewer extends Component
{
    public array $filters = [];

    #[Volatile]
    public array $processedReport = [];

    public function generate(): void
    {
        $raw = $this->fetchReportData($this->filters);
        $this->processedReport = $this->process($raw);
        // After render, processedReport is reset
        // Large processed data not sent to client
    }
}
```

**Normal vs volatile comparison:**
```php
class Example extends Component
{
    public string $name = '';        // Persists, sent to frontend
    #[Volatile]
    public string $tempToken = '';   // Resets after render, NOT sent
}
```

---

## Related Topics

- livewire/component-architecture — Component property fundamentals
- livewire/data-binding — How normal properties sync with frontend
- livewire/lifecycle-hooks — Dehydrate phase where volatile reset happens
- livewire/actions-events — Setting volatile properties in actions

---

## AI Agent Notes

- `#[Volatile]` attribute introduced in Livewire v3
- Volatile properties are excluded from the serialized snapshot sent to frontend
- Reset happens in the `dehydrate` phase, AFTER rendering but before response
- Default value = initial value from property declaration
- Volatile properties can still be used in templates — reset happens after rendering
- Essential for security: prevents sensitive data from being exposed in HTML

---

## Verification

- [ ] All sensitive properties marked as `#[Volatile]`
- [ ] Passwords and tokens never in normal public properties
- [ ] Large intermediate data marked as volatile
- [ ] UI state that needs persistence uses normal properties
- [ ] Volatile properties set in action methods (not just mount)
- [ ] Team documentation explains volatile property usage
- [ ] HTML source inspected — no sensitive data visible
- [ ] Snapshot size reduced by using volatile for intermediate data
