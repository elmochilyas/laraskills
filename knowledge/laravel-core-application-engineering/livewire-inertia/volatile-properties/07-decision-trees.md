# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Volatile Properties
**Generated:** 2026-06-03

---

# Decision Inventory

* #[Volatile] vs Normal Property for Sensitive Data
* #[Volatile] Property vs Non-Public Property (Private/Protected)
* #[Volatile] vs Separate Service Class for Temporary Data

---

# Architecture-Level Decision Trees

---

## Decision 1: #[Volatile] vs Normal Property for Sensitive Data

---

## Decision Context

Whether to mark a public property as `#[Volatile]` (not serialized, reset after each request) or keep it as a normal public property.

---

## Decision Criteria

* Whether the property holds sensitive data (passwords, tokens, API keys, PII)
* Whether the property holds large intermediate data that shouldn't be serialized
* Whether the property state should persist across requests
* Whether the property is needed in the Blade template after re-render

---

## Decision Tree

Does the property hold sensitive data (password, token, API key, PII) that must never reach the frontend?
↓
YES → Mark as `#[Volatile]` — never serialized, never sent to frontend
NO → Does the property hold large intermediate computation results that bloat the snapshot?
    YES → Mark as `#[Volatile]` — reduce snapshot size, don't persist intermediate data
    NO → Should the property value persist across AJAX requests (normal Livewire behavior)?
        YES → Normal public property — state persists across requests
        NO → Does the property need to be accessible in the Blade template?
            YES → Normal public property — volatile properties reset before render, but after rendering they are safe in templates
            NO → Mark as `#[Volatile]` — no reason to persist it

---

## Rationale

Normal public properties are serialized into the Livewire component snapshot and sent to the frontend on every response. `#[Volatile]` properties are excluded from serialization, protecting sensitive data and reducing snapshot size. The tradeoff: volatile properties reset after each request.

---

## Recommended Default

**Default:** Normal public property for persistent state. `#[Volatile]` for sensitive data, large intermediate data, or data that doesn't need to persist.
**Reason:** Normal properties persist state across requests — the standard Livewire behavior. Volatile is the opt-out for security and performance.

---

## Risks Of Wrong Choice

* Normal property for password: Password serialized to frontend — visible in HTML source, security incident
* `#[Volatile]` for form input: Input value resets after each request — user's input lost
* Normal property for large array: 10MB intermediate data serialized in every snapshot — bloated payloads
* `#[Volatile]` without sensitivity: Unnecessary volatility — property resets, breaking component behavior

---

## Related Rules

* Mark All Sensitive Properties as Volatile

---

## Related Skills

* Secure Sensitive Data with Volatile Properties

---

---

## Decision 2: #[Volatile] Property vs Non-Public Property (Private/Protected)

---

## Decision Context

Whether to handle sensitive data by marking a public property as `#[Volatile]` or making the property non-public (private/protected).

---

## Decision Criteria

* Whether the property value needs to be accessible in the Blade template
* Whether the property value needs to be set from the frontend (wire:model)
* Whether the property is purely internal (not needed in template or frontend)
* Whether the property should be accessible from child components or traits

---

## Decision Tree

Does the property need to be accessible in the Blade template (rendered in the view)?
↓
YES → Does the property need to be set from the frontend (wire:model)?
    YES → Public property with `#[Volatile]` if sensitive — both template and wire:model require public access
    NO → Public property with `#[Volatile]` if sensitive — template access requires public, volatile prevents serialization
NO → Is the property purely internal (helper data, not needed in template)?
    YES → Use private/protected property — not accessible from template or frontend
    NO → Protected/public property — accessible from child classes if protected

---

## Rationale

Non-public properties (private/protected) are not serialized and not accessible from the Blade template. `#[Volatile]` public properties are accessible in the Blade template but not serialized. If the template needs the value, use `#[Volatile]`. If the template doesn't need it, use private/protected.

---

## Recommended Default

**Default:** Private/protected for internal helper data. Public `#[Volatile]` for data the template needs but shouldn't be serialized.
**Reason:** Non-public properties are the strongest protection — not serialized and not accessible from template. `#[Volatile]` is the right choice when the template needs access but serialization must be prevented.

---

## Risks Of Wrong Choice

* Private property needed in template: Template can't access it — `$this->secret` is null in Blade
* Public volatile for internal data: Unnecessary exposure to template — private is more appropriate
* Public non-volatile for sensitive data: Sensitive data serialized — security risk
* Protected property for cross-component: Protected is for inheritance, not cross-component access

---

## Related Rules

* Mark All Sensitive Properties as Volatile

---

## Related Skills

* Secure Sensitive Data with Volatile Properties

---

---

## Decision 3: #[Volatile] vs Separate Service Class for Temporary Data

---

## Decision Context

Whether to store temporary computation data in a `#[Volatile]` property on the component or extract the computation to a separate service class.

---

## Decision Criteria

* Whether the temporary data is complex (multiple values, nested structures)
* Whether the computation logic is reusable across multiple components
* Whether the temporary data needs to be testable independently
* Whether the component is becoming bloated with computation logic

---

## Decision Tree

Is the temporary data complex (multiple values, computed from multiple sources)?
↓
YES → Extract to a separate service class — complex computation belongs in a dedicated class
NO → Is the computation logic reused across 2+ components?
    YES → Extract to a separate service class — single source of truth for shared logic
    NO → Is the temporary data simple (single value, computed from one source)?
        YES → Use `#[Volatile]` property — simple, co-located with the component
        NO → Use `#[Volatile]` property — or extract if the component is growing too large

---

## Rationale

`#[Volatile]` properties are for simple temporary data that is computed and used within a single request. Complex computations or reusable logic should be extracted to service classes. The threshold for extraction is the same as any refactoring: complexity or reuse.

---

## Recommended Default

**Default:** `#[Volatile]` property for simple, component-specific temporary data. Service class for complex or reusable computation.
**Reason:** Volatile properties keep simple temporary data with the component. Service classes extract complexity and enable reuse and testing.

---

## Risks Of Wrong Choice

* Service class for simple volatile: File overhead for a one-line computation — wasted abstraction
* `#[Volatile]` for complex computation: Component grows with 50 lines of computation logic — bloated
* No volatile for temporary data: Temporary data persisted across requests — unintentional state
* Volatile for data needed after re-render: Property resets — data lost

---

## Related Rules

* Volatile for Simple Temporary Data

---

## Related Skills

* Secure Sensitive Data with Volatile Properties
