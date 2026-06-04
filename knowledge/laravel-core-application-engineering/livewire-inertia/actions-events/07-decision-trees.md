# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Actions and Events
**Generated:** 2026-06-03

---

# Decision Inventory

* Livewire Action Method vs API Controller for Server-Side Logic
* $dispatch Event vs Direct Component Method Call for Cross-Component Communication
* wire:click vs Alpine.js @click for Button Interactions

---

# Architecture-Level Decision Trees

---

## Decision 1: Livewire Action Method vs API Controller for Server-Side Logic

---

## Decision Context

Whether to handle a server interaction via a Livewire action method (in-component) or a separate API controller endpoint.

---

## Decision Criteria

* Whether the interaction needs to update the Livewire component's state after execution
* Whether the interaction is reusable across multiple Livewire components
* Whether the interaction is a standard API endpoint (RESTful CRUD) or a component-specific action
* Whether the interaction needs to be callable from non-Livewire clients (external API)

---

## Decision Tree

Does the interaction need to update the Livewire component's state after execution (re-render, property change)?
↓
YES → Use Livewire action method — the method has direct access to component state
NO → Is the interaction reusable across multiple Livewire components?
    YES → Is the interaction RESTful (CRUD on a resource)?
        YES → Use API controller — standard endpoint, reusable across contexts
        NO → Use Livewire action — or a shared service class called from multiple components
    NO → Is the interaction callable from non-Livewire clients (mobile app, external API)?
        YES → Use API controller — separate endpoint for external consumers
        NO → Use Livewire action method — simplest for component-specific interactions

---

## Rationale

Livewire action methods have direct access to component state and trigger automatic re-rendering. API controllers are for reusable, RESTful endpoints that may be consumed by non-Livewire clients. If the interaction is component-specific and should update component state, an action method is the right choice.

---

## Recommended Default

**Default:** Livewire action method for component-specific interactions that update component state. API controllers for reusable RESTful endpoints.
**Reason:** Action methods integrate with Livewire's lifecycle — automatic re-render, state management, and error handling. API controllers require manual state synchronization.

---

## Risks Of Wrong Choice

* API controller for component-specific action: Must manually update component state after API call — extra work
* Livewire action for reusable API: Not callable from external clients — no RESTful endpoint
* Livewire action with heavy computation: Blocks re-render until computation completes — slow UX
* API controller in Livewire component: Component fetches data from its own API — round-trip overhead

---

## Related Rules

* Actions Must Be Public Methods

---

## Related Skills

* Implement and Test Livewire Actions with Events

---

---

## Decision 2: $dispatch Event vs Direct Component Method Call for Cross-Component Communication

---

## Decision Context

Whether to use `$dispatch()` events or directly call methods on another component for cross-component communication.

---

## Decision Criteria

* Whether the components are parent-child or sibling/unrelated
* Whether the communication is one-way (notification) or request-response
* Whether the components are in different parts of the page (not nested)
* Whether the team prefers loosely coupled or tightly coupled communication

---

## Decision Tree

Are the components in a parent-child relationship (one nested inside the other)?
↓
YES → Can the parent pass data via properties (props)?
    YES → Use property binding — simplest, most direct
    NO → Use `$dispatch()` — child dispatches event, parent listens
NO → Are the components siblings or unrelated (different page sections)?
    YES → Use `$dispatch()` — components don't have direct access to each other
    NO → Can one component be wrapped inside the other?
        YES → Refactor to parent-child — then use property binding or $dispatch
        NO → Use `$dispatch()` — global event, any component can listen

---

## Rationale

Livewire components are isolated. They cannot directly call methods on sibling or unrelated components. `$dispatch()` with `$listeners` is the standard mechanism for cross-component communication. Parent-child communication can use property passing (`wire:key` and model binding) in addition to events.

---

## Recommended Default

**Default:** `$dispatch()` for all cross-component communication. Property binding for parent-to-child data flow.
**Reason:** `$dispatch()` provides loose coupling — the dispatching component doesn't know which components are listening. Property binding is simpler for parent-to-child data flow. Direct method calls across components are not supported.

---

## Risks Of Wrong Choice

* Direct method call on sibling: Not possible in Livewire — components are isolated
* `$dispatch()` for parent-child: Works but property binding is simpler for parent-to-child
* No event for sibling communication: Duplicated logic — each component fetches the same data independently
* Event name collision: Two components dispatch `'refresh'` — both listeners fire for either event

---

## Related Rules

* $dispatch for Cross-Component Communication

---

## Related Skills

* Implement and Test Livewire Actions with Events

---

---

## Decision 3: wire:click vs Alpine.js @click for Button Interactions

---

## Decision Context

Whether to use Livewire's `wire:click` (triggers a server action) or Alpine.js `@click` (triggers client-side behavior) for button interactions.

---

## Decision Criteria

* Whether the interaction needs server-side processing (save, delete, send email)
* Whether the interaction is purely client-side (toggle dropdown, close modal, CSS animation)
* Whether the interaction should update Livewire component state
* Whether the button is inside a Livewire component or a plain Blade section

---

## Decision Tree

Does the button click need server-side processing (database write, email, authentication)?
↓
YES → Use `wire:click` — triggers a Livewire action method on the server
NO → Does the click need to update Livewire component state?
    YES → Use `wire:click` — can modify Livewire properties and trigger re-render
    NO → Is the click purely client-side (show/hide, toggle, animation)?
        YES → Use Alpine.js `@click` — no server round trip, instant feedback
        NO → Does the click navigate to a different page?
            YES → Use standard `<a>` link — no Livewire or Alpine needed
            NO → Use Alpine.js `@click` — client-only interaction

---

## Rationale

`wire:click` triggers a full Livewire lifecycle — action method runs on server, component re-renders, HTML diff sent to browser. This is appropriate for actions that need server processing. Alpine.js `@click` handles client-only interactions instantly without a server round trip.

---

## Recommended Default

**Default:** `wire:click` for server-side actions. Alpine.js `@click` for client-only interactions. Standard `<a>` for navigation.
**Reason:** Each mechanism serves a distinct purpose. Using the right one avoids unnecessary server requests (Alpine for client-only) or unnecessary client complexity (Livewire for server actions).

---

## Risks Of Wrong Choice

* `wire:click` for toggle: Server round trip to hide/show — 100ms delay for a 0ms action
* Alpine `@click` for save: No server action — data not saved, user thinks it was
* No feedback on `wire:click`: Button clicked, no loading state — user clicks again, double submission
* Mixed `wire:click` and `@click` on same element: Conflicting handlers — one may override the other

---

## Related Rules

* wire:click for Server Actions, Alpine @click for Client Actions

---

## Related Skills

* Implement and Test Livewire Actions with Events
