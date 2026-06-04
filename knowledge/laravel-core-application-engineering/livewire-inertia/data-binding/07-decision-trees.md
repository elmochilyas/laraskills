# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Data Binding
**Generated:** 2026-06-03

---

# Decision Inventory

* wire:model Default vs wire:model.defer for Form Fields
* wire:model with Debounce vs lazy vs Real-Time Update
* wire:model vs Manual $set() for Property Updates

---

# Architecture-Level Decision Trees

---

## Decision 1: wire:model Default vs wire:model.defer for Form Fields

---

## Decision Context

Whether to use Livewire's default `wire:model` (sends AJAX on every change) or `wire:model.defer` (batches updates until action submission).

---

## Decision Criteria

* Whether the field needs real-time server-side feedback as the user types
* Whether the form has 3+ fields that would generate excessive AJAX requests
* Whether the field value is needed for dependent dropdowns or live calculations
* Whether the application is on a slow network where fewer requests are better

---

## Decision Tree

Does the field need real-time server feedback as the user types (live search, dependent dropdown)?
↓
YES → Use `wire:model` (default) — fires immediately, enables real-time feedback
NO → Is the field part of a form with 3+ fields?
    YES → Use `wire:model.defer` — batch all field updates into the submit action request
    NO → Does the field change trigger expensive validation or computation on every keystroke?
        YES → Use `wire:model.defer` — avoid expensive computation on every keystroke
        NO → Use `wire:model.defer` — fewer AJAX requests, better performance

---

## Rationale

Default `wire:model` sends an AJAX request on every keystroke or change event. A typical 10-field form generates 10+ unnecessary AJAX requests before submit. `wire:model.defer` stores values locally and sends them with the next action, reducing AJAX traffic by up to 90%.

---

## Recommended Default

**Default:** Use `wire:model.defer` on all form fields. Use `wire:model` only for fields needing real-time server feedback.
**Reason:** `.defer` eliminates unnecessary AJAX requests. Real-time feedback fields are the exception, not the rule.

---

## Risks Of Wrong Choice

* Default `wire:model` for 10-field form: 10 AJAX requests on page load + 10 when filling — unnecessary load
* `.defer` for live search: Search fires on form submit instead of as you type — broken UX
* `.defer` for dependent dropdown: Second dropdown doesn't update until submit — can't cascade
* No modifier: All fields use default — maximum AJAX requests, minimum performance

---

## Related Rules

* Use defer for Most Form Fields

---

## Related Skills

* Implement Efficient Data Binding with Correct Modifiers

---

---

## Decision 2: wire:model with Debounce vs lazy vs Real-Time Update

---

## Decision Context

Which `wire:model` modifier to use for fields that need real-time feedback: `.debounce.500ms`, `.lazy` (on blur), or default (immediate).

---

## Decision Criteria

* How quickly the server needs to respond to input changes
* Whether the user expects instant feedback or can tolerate delay
* Whether the field triggers expensive server computation
* Whether the field is a search input or a standard form field

---

## Decision Tree

Does the field need immediate server response on every keystroke (search-as-you-type)?
↓
YES → Does the search trigger an expensive query or API call?
    YES → Use `wire:model.debounce.500ms` — wait for user to pause typing before firing
    NO → Use `wire:model` (default) — immediate feedback, cheap computation
NO → Is the field validation expensive (database query, external API)?
    YES → Use `wire:model.debounce.1000ms` or `.lazy` — validate only when user pauses or leaves field
    NO → Does the field need validation feedback only when the user leaves the field (blur)?
        YES → Use `wire:model.lazy` — sync on blur, not on keystroke
        NO → Use `wire:model.debounce.300ms` — reasonable default for real-time feedback

---

## Rationale

Debounce delays the AJAX request until the user stops typing for the specified duration. `.lazy` syncs only on blur. Default `wire:model` fires on every keystroke. The right choice balances responsiveness against server load — debounce for expensive operations, lazy for validation on blur, immediate for cheap feedback.

---

## Recommended Default

**Default:** `wire:model.debounce.300ms` for real-time feedback fields. `wire:model.lazy` for validation-on-blur fields. `wire:model.defer` for all other fields.
**Reason:** Debounce prevents excessive requests while providing responsive feedback. Lazy reduces requests further for blur-triggered validation. Defer eliminates requests for fields where real-time feedback isn't needed.

---

## Risks Of Wrong Choice

* No debounce for search: AJAX request on every keystroke — server load, rate limiting
* 1-second debounce for search: Slow feedback — user types fast, response feels laggy
* `.lazy` for real-time: No feedback until user leaves the field — feels unresponsive
* Debounce too short: Debounce 100ms still fires too many requests — barely different from default

---

## Related Rules

* Debounce for Real-Time Fields, defer for Others

---

## Related Skills

* Implement Efficient Data Binding with Correct Modifiers

---

---

## Decision 3: wire:model vs Manual $set() for Property Updates

---

## Decision Context

Whether to use `wire:model` (automatic two-way binding on input elements) or manual `$set('property', value)` called from Alpine.js or JavaScript.

---

## Decision Criteria

* Whether the binding is on a standard HTML input element
* Whether the update is triggered by custom JavaScript logic (timer, web socket, computation)
* Whether the property should be updated from a non-input source (button click, event)
* Whether the team prefers declarative (wire:model) or imperative ($set) style

---

## Decision Tree

Is the source of the update a standard HTML input element (text, select, checkbox, radio)?
↓
YES → Use `wire:model` — declarative, automatic, handles all input types
NO → Is the update triggered by custom JavaScript (setInterval, WebSocket message, computed value)?
    YES → Use `$set('property', value)` from JavaScript — `Livewire.dispatch('set', { property: 'count', value: 10 })`
    NO → Is the update triggered by another component's event?
        YES → Use `$set()` or `$refresh()` in event listener — imperative update from event handler
        NO → Is the update a one-time initialization (not interactive)?
            YES → Set in `mount()` or `boot()` — PHP initialization, not binding
            NO → Use `wire:model` — declarative binding is simpler

---

## Rationale

`wire:model` is the declarative standard for binding HTML inputs to PHP properties. `$set()` is the imperative fallback for non-input sources (JavaScript events, computed values, WebSocket messages). Use `wire:model` whenever possible — it's simpler, more readable, and handles input events automatically.

---

## Recommended Default

**Default:** `wire:model` for all HTML input bindings. `$set()` only for imperative updates from JavaScript or non-input sources.
**Reason:** `wire:model` is declarative and automatic. `$set()` requires manual imperatives and should be the exception, not the rule.

---

## Risks Of Wrong Choice

* `$set()` for input fields: Manual wiring for every input — event listeners, update handlers, more code
* `wire:model` for JavaScript-triggered update: No input element to bind to — can't use wire:model
* `$set()` in Blade with unnecessary Alpine: Alpine.js loaded just to call `$set` — unnecessary dependency
* No binding at all: Property never updates from client side — stale value

---

## Related Rules

* wire:model for Inputs, $set for JavaScript Updates

---

## Related Skills

* Implement Efficient Data Binding with Correct Modifiers
