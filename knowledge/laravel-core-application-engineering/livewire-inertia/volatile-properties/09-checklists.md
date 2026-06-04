# Livewire Volatile Properties — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Volatile Properties
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed (supports `#[Volatile]` attribute)
- [ ] Component follows Livewire component architecture
- [ ] Understanding of serialization/dehydration cycle

## Implementation Checklist
- [ ] All sensitive properties marked as `#[Volatile]`
- [ ] Passwords and tokens never in normal public properties
- [ ] Large intermediate data marked as volatile
- [ ] UI state that needs persistence uses normal properties
- [ ] Volatile properties set in action methods (not just mount)
- [ ] Team documentation explains volatile property usage
- [ ] HTML source inspected — no sensitive data visible
- [ ] Snapshot size reduced by using volatile for intermediate data
- [ ] Payment processing tokens stored as volatile (not serialized)

## Verification Checklist
- [ ] `#[Volatile]` property is excluded from serialized snapshot sent to frontend
- [ ] Property resets to default value after each render (dehydrate phase)
- [ ] Default value = initial value from property declaration
- [ ] Volatile properties can be used in Blade templates (reset AFTER rendering)
- [ ] Normal properties persist across requests, volatile properties don't
- [ ] `dehydrate` phase resets volatile after render but before response
- [ ] Component snapshot doesn't contain volatile property data

## Security Checklist
- [ ] `#[Volatile]` ensures sensitive data is NEVER sent to client in HTML snapshot
- [ ] Passwords, payment tokens, API keys, PII marked as `#[Volatile]`
- [ ] No sensitive data visible in page source (inspect HTML)
- [ ] One-time tokens (payment tokens, CSRF) don't persist across requests
- [ ] Security audit confirms all sensitive properties are volatile
- [ ] Team knows volatile properties exist only during current request

## Performance Checklist
- [ ] Component snapshot size reduced by excluding volatile properties
- [ ] Large intermediate data (temporary arrays, processed collections) marked volatile
- [ ] AJAX payload size benefit measured (reduced by volatile exclusion)
- [ ] No overhead from volatility check (negligible)
- [ ] Volatile properties for intermediate computation results reduce payload

## Production Readiness Checklist
- [ ] All secrets (passwords, tokens, API keys) are volatile
- [ ] Payment processing flows use volatile for tokens
- [ ] Documented which properties are volatile and why
- [ ] Team understands volatility behavior (reset after render)
- [ ] No UI state mistakenly marked as volatile (data disappears after re-render)
- [ ] `mount()` doesn't set volatile properties expecting persistence
- [ ] No computed properties depending on volatile values after they're reset

## Common Mistakes to Avoid
- [ ] Sensitive data NOT marked volatile — data exposed in HTML snapshot
- [ ] Using volatile for persistent UI state — data lost after re-render
- [ ] Setting volatile in `mount()` expecting it to persist
- [ ] Accessing volatile in computed property — gets default, not expected value
- [ ] Storing passwords without `#[Volatile]` — exposed in HTML source
- [ ] Payment tokens in normal properties — visible for entire session
- [ ] Large intermediate data not volatile — bloats every AJAX response
