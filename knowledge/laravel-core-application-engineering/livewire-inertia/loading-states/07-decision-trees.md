# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Loading States
**Generated:** 2026-06-03

---

# Decision Inventory

* wire:loading with Target vs Without Target for Feedback
* wire:loading Element Toggle vs wire:loading.attr Disabled for Buttons
* Loading State via wire:loading vs Alpine.js x-show

---

# Architecture-Level Decision Trees

---

## Decision 1: wire:loading with Target vs Without Target for Feedback

---

## Decision Context

Whether to scope `wire:loading` to a specific action/property via `wire:target` or let it respond to any component update.

---

## Decision Criteria

* Whether the component has multiple independent actions or one main action
* Whether a loading indicator should appear for ALL interactions or specific ones
* Whether the component has both slow and fast actions
* Whether wire:loading is on a submit button or a general spinner

---

## Decision Tree

Does the component have multiple user-triggered actions (save button, filter, export)?
↓
YES → Use `wire:loading` with `wire:target="specificAction"` — scope to the triggered action
NO → Does the component have one primary action (single submit button)?
    YES → `wire:loading` without target is acceptable — only one action can trigger loading
    NO → Is wire:loading on a submit button (the button triggers the action)?
        YES → Use `wire:loading` with `wire:target="actionName"` — scoped to the submit action
        NO → Is wire:loading a general page-level spinner?
            YES → `wire:loading` without target — show for any component interaction
            NO → Use `wire:loading` with `wire:target` — always scope for clarity

---

## Rationale

`wire:loading` without target shows the loading state for ANY component interaction — clicking any button, changing any field, triggering any event. This creates confusing flickering loading states across the entire component. Scoping with `wire:target` ensures the loading state appears only for the specific action that triggered it.

---

## Recommended Default

**Default:** Always pair `wire:loading` with `wire:target`. Only omit target when the component has exactly one possible loading trigger.
**Reason:** Untargeted loading states appear for every interaction, causing flickering and confusion. Scoped loading states provide accurate, predictable feedback.

---

## Risks Of Wrong Choice

* No target for multi-action component: Save button and search both trigger the same loading indicator — confusing
* Target on wrong action name: Loading never shows because target doesn't match action — no feedback
* Over-scoped: Loading indicator on button, but slow operation is initiated elsewhere — no feedback
* No loading state at all: User clicks button, nothing happens for 2 seconds — thinks app is broken

---

## Related Rules

* Always Scope Loading States with wire:target

---

## Related Skills

* Implement User-Friendly Loading States

---

---

## Decision 2: wire:loading Element Toggle vs wire:loading.attr Disabled for Buttons

---

## Decision Context

Whether to show a loading indicator by toggling element visibility (spinner replaces button text) or disabling the button via `wire:loading.attr="disabled"`.

---

## Decision Criteria

* Whether the button should be clickable during loading (prevent double-submit)
* Whether the button text should change during loading (show "Saving..." instead of "Save")
* Whether the button should visually dim during loading (disabled state)
* Whether the UX should show a spinner alongside or replacing the button

---

## Decision Tree

Should the button become non-clickable during loading to prevent double-submits?
↓
YES → Use `wire:loading.attr="disabled"` on the button — prevents multiple clicks
NO → Should the button text change during loading (show "Saving..." instead of "Save")?
    YES → Use `wire:loading` to show a loading text element and hide the default text
    NO → Should a spinner appear alongside the button without disabling it?
        YES → Use `wire:loading` for spinner visibility — button remains clickable
        NO → Use `wire:loading.attr="disabled"` — standard pattern for button loading states

---

## Rationale

`wire:loading.attr="disabled"` prevents double-submits and provides visual feedback (dimmed button, disabled cursor). Text replacement ("Saving...") provides clearer feedback but doesn't prevent double-clicks unless combined with `disabled`. The standard UX pattern is: disable + show loading text.

---

## Recommended Default

**Default:** `wire:loading.attr="disabled"` on submit buttons combined with `wire:loading` to show "Saving..." text and hide "Save" text.
**Reason:** Disabled prevents double-submits. Text change provides clear feedback. Both together provide optimal UX.

---

## Risks Of Wrong Choice

* No disabled attribute: User double-clicks — action runs twice
* Only disabled, no text change: Button dims but user isn't sure what's happening — confusion
* Spinner without disabled: User can still click — double submission
* Loading state too long without text change: User wonders if app is stuck — no progress indication

---

## Related Rules

* Always Disable Buttons During Loading

---

## Related Skills

* Implement User-Friendly Loading States

---

---

## Decision 3: Loading State via wire:loading vs Alpine.js x-show

---

## Decision Context

Whether to use Livewire's `wire:loading` (server-side aware) or Alpine.js `x-show` (client-side only) for showing/hiding loading elements.

---

## Decision Criteria

* Whether the loading state is tied to a Livewire action or property update
* Whether the loading state is triggered by client-side events (timer, animation)
* Whether the loading state is on a page that doesn't use Livewire
* Whether the developer prefers Livewire-native or generic JavaScript approaches

---

## Decision Tree

Is the loading state tied to a Livewire action (wire:click, form submission)?
↓
YES → Use `wire:loading` — Livewire-aware, integrates with server lifecycle
NO → Is the loading state triggered by client-side events (fetch request, timer, animation)?
    YES → Use Alpine.js `x-show` — client-side, no Livewire dependency
    NO → Is the component inside a Livewire component or a plain Blade view?
        Livewire component → `wire:loading` — standard, consistent with Livewire patterns
        Plain Blade view → Alpine.js `x-show` — Livewire isn't available
        Both → Use `wire:loading` within Livewire components, Alpine in plain Blade

---

## Rationale

`wire:loading` is the Livewire-native way to show loading states. It's automatically aware of the Livewire lifecycle — shows during server processing, hides after re-render. Alpine.js `x-show` is for client-side toggling not related to Livewire actions.

---

## Recommended Default

**Default:** `wire:loading` for loading states tied to Livewire actions. Alpine.js `x-show` for client-side toggling.
**Reason:** `wire:loading` integrates with Livewire's lifecycle automatically. Alpine.js is for non-Livewire interactions. Using `wire:loading` within Livewire components keeps the codebase consistent.

---

## Risks Of Wrong Choice

* Alpine for Livewire action: Must manually track Livewire's loading state — `wire:loading` handles it automatically
* `wire:loading` for client-side: `wire:loading` only responds to Livewire lifecycle — won't show for fetch requests
* No loading state: User has no feedback — thinks app is broken during server processing

---

## Related Rules

* wire:loading for Livewire Actions

---

## Related Skills

* Implement User-Friendly Loading States
