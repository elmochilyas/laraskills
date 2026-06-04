# Skill: Secure Sensitive Data with Volatile Properties

## Purpose

Apply the `#[Volatile]` attribute to Livewire public properties that hold sensitive data (passwords, tokens, API keys) or large intermediate computation results, preventing them from being serialized and sent to the frontend.

## When To Use

- One-time tokens (payment tokens, CSRF tokens) that should not persist
- Intermediate computation results that don't need to survive re-render
- Sensitive data (passwords, API keys) that must never be sent to the frontend
- Large temporary data that shouldn't increase snapshot size

## When NOT To Use

- UI state that needs to persist across requests (form input values, toggles, selections)
- Data that needs to survive component re-renders
- Properties used in the Blade template (volatile properties reset before render, but after rendering — they are safe in templates)

## Prerequisites

- Livewire v3 (volatile properties were introduced in v3)
- Understanding of which data is sensitive in the context of the component

## Inputs

- List of public properties in the component
- Sensitivity classification per property (sensitive, intermediate, persistent state)

## Workflow

1. Audit every public property in every Livewire component
2. Apply `#[Volatile]` to any property whose value must never appear in the HTML source or network response:
   ```php
   use Livewire\Attributes\Volatile;
   
   class ProcessPayment extends Component
   {
       #[Volatile]
       public string $paymentToken = '';
       public int $amount = 0;
   }
   ```
3. Apply `#[Volatile]` to large intermediate data arrays used within a single request:
   ```php
   #[Volatile]
   public array $processedReport = [];
   ```
4. Set volatile properties inside action methods (not `mount()`) since they reset after each render
5. Use normal (non-volatile) properties for all UI state that must persist across re-renders
6. Document volatile property usage so team members understand the intentional non-persistence

## Validation Checklist

- [ ] All sensitive properties marked as `#[Volatile]` (passwords, tokens, API keys, PII)
- [ ] Passwords and tokens never in normal public properties without `#[Volatile]`
- [ ] Large intermediate data marked as volatile to reduce snapshot size
- [ ] UI state that needs persistence uses normal properties (not volatile)
- [ ] Volatile properties set in action methods (not only in `mount()`)
- [ ] Team documentation explains volatile property usage
- [ ] HTML source inspected — no sensitive data visible

## Common Failures

- Sensitive data NOT marked volatile — password, token, or API key exposed in HTML snapshot
- Using volatile for persistent state — data lost after re-render, form inputs reset
- Setting volatile in `mount()` and expecting it to persist — reset after first render
- Not using volatile for large intermediate data — bloated snapshot size

## Decision Points

- Mark as `#[Volatile]` if the data must never reach the client (passwords, tokens, secrets)
- Mark as `#[Volatile]` if the data is large and only needed within one request cycle (intermediate computation)
- Keep as normal property if the data must persist across re-renders (form inputs, selected items, toggles)

## Performance Considerations

Volatile properties reduce the component snapshot size by excluding non-essential data. For large intermediate data (temporary arrays, processed collections), this can significantly reduce AJAX payload size.

## Security Considerations

Volatile properties are a critical security feature — they ensure sensitive data is NEVER sent to the client in the HTML snapshot. Without `#[Volatile]`, every public property is serialized and visible in the page source.

## Related Rules

- Mark All Sensitive Properties as Volatile (05-rules.md)
- Use Volatile for Intermediate Computation Results (05-rules.md)
- Never Rely on Volatile Persistence (05-rules.md)
- Keep UI State in Normal Properties (05-rules.md)
- Set Volatile Properties in Action Methods (05-rules.md)

## Related Skills

- Create a Well-Structured Livewire Component (livewire/component-architecture)
- Implement and Test Livewire Actions with Events (livewire/actions-events)
- Use Lifecycle Hooks Effectively in Livewire Components (livewire/lifecycle-hooks)

## Success Criteria

- No sensitive data (passwords, tokens, API keys) appears in the HTML source or network tab
- Large intermediate data arrays are excluded from the component snapshot
- UI state that must persist (form inputs, toggles) uses normal properties
- Volatile properties are initialized in action methods, not just `mount()`
- Team understands the intentional ephemeral nature of volatile properties
