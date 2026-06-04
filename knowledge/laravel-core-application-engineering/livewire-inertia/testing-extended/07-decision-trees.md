# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* Livewire::test() Integration Test vs Unit Test for Component Logic
* State Assertion vs Output Assertion for Component Validation
* Livewire Test vs Browser Test (Dusk) for Interactive Behavior

---

# Architecture-Level Decision Trees

---

## Decision 1: Livewire::test() Integration Test vs Unit Test for Component Logic

---

## Decision Context

Whether to test Livewire component behavior using `Livewire::test()` (full lifecycle) or unit-test the component class methods directly.

---

## Decision Criteria

* Whether the test needs the full Livewire lifecycle (hydration, action, re-render)
* Whether the component interacts with Livewire's features (wire:model, $dispatch, #[Rule])
* Whether the test needs to assert on rendered output
* Whether the component method is pure PHP logic with no Livewire dependencies

---

## Decision Tree

Does the test need to verify Livewire-specific behavior (action => re-render, property update => output change)?
↓
YES → Use `Livewire::test()` — runs full component lifecycle, enables Livewire assertions
NO → Is the method pure PHP logic with no Livewire dependencies (no `$this->dispatch()`, no `#[Rule]`)?
    YES → Unit test the method directly — simpler, faster
    NO → Use `Livewire::test()` — method depends on Livewire features
NO → Does the test need to assert on rendered HTML output?
    YES → Use `Livewire::test()` — `assertSee()` requires the rendering pipeline
    NO → Does the test need to verify event dispatch?
        YES → Use `Livewire::test()` — `assertDispatched()` requires the Livewire lifecycle
        NO → Use `Livewire::test()` — still the standard approach for component behavior

---

## Rationale

`Livewire::test()` runs the component through the full Livewire lifecycle — hydration, action execution, property updates, rendering, dehydration. This is the only way to verify that wire:model bindings, `$dispatch` events, `#[Rule]` validation, and component re-rendering work correctly. Unit tests of individual methods miss the lifecycle integration.

---

## Recommended Default

**Default:** `Livewire::test()` for all component behavior tests. Unit test only for pure logic methods extracted to service classes.
**Reason:** Livewire components are defined by their lifecycle behavior. Testing methods in isolation doesn't verify that wire:click triggers the right action, or that the component re-renders correctly. `Livewire::test()` tests what the component actually does.

---

## Risks Of Wrong Choice

* Unit test of action method: Method works, but wire:click doesn't trigger it — false confidence
* `Livewire::test()` for pure logic: Full lifecycle overhead for a simple calculation — slower than needed
* No test at all: Component behavior untested — regression goes undetected
* Integration test without setup: Component crashes on hydrate because dependencies aren't available

---

## Related Rules

* Test Component Behavior, Not Implementation

---

## Related Skills

* Write Comprehensive Livewire Component Tests

---

---

## Decision 2: State Assertion vs Output Assertion for Component Validation

---

## Decision Context

Whether to assert on component state (`assertSet('count', 1)`) or rendered output (`assertSee('1')`) when verifying component behavior.

---

## Decision Criteria

* Whether the user-visible output is the real "truth" of what the component does
* Whether the state is directly observable by the user
* Whether the test should remain resilient to UI refactoring (template changes)
* Whether the state assertion is more precise than seeing text in HTML

---

## Decision Tree

Is the component's behavior defined by what the user SEES or by internal state?
↓
User-facing behavior (output) → Use `assertSee('value')`, `assertDontSee('value')` — assert on rendered output
Internal state → Use `assertSet('property', value)` — assert on component state
NO → Is the user-visible output verifiable with `assertSee()`?
    YES → Use `assertSee()` — output is the real behavior
    NO → Use `assertSet()` — state isn't directly rendered, but it's the correct behavior
NO → Could the template change and make `assertSee()` fail even though behavior is correct?
    YES → Use `assertSet()` — resilient to template changes
    NO → Use `assertSee()` — more end-to-end, checks the actual user experience

---

## Rationale

Output assertions (`assertSee`, `assertDontSee`) verify what the user actually experiences. State assertions (`assertSet`, `assertCount`) verify implementation details. Output assertions are more robust because they test real behavior. State assertions are useful when the state isn't directly rendered or when output assertions would be too fragile.

---

## Recommended Default

**Default:** Output assertions (`assertSee()`, `assertDontSee()`) for user-visible behavior. State assertions (`assertSet()`) only when output can't verify the behavior.
**Reason:** Output assertions test what the user experiences. They survive template changes and implementation refactoring as long as the visible output stays the same.

---

## Risks Of Wrong Choice

* Only state assertions: Component state is correct but nothing is rendered — UI bug
* Only output assertions: Text visible due to wrong state — false positive
* Assert on CSS classes: `assertSee('hidden')` — brittle, template change breaks test
* No assertions at all: Component runs but nothing is verified — test passes unconditionally

---

## Related Rules

* Test Component Behavior, Not Implementation

---

## Related Skills

* Write Comprehensive Livewire Component Tests

---

---

## Decision 3: Livewire Test vs Browser Test (Dusk) for Interactive Behavior

---

## Decision Context

Whether to test interactive behavior using `Livewire::test()` (server-side lifecycle) or Laravel Dusk (real browser).

---

## Decision Criteria

* Whether the behavior depends on JavaScript execution (Alpine.js, third-party JS)
* Whether the behavior involves browser-level interactions (scroll, resize, file dialog)
* Whether the behavior is purely Livewire-driven (wire:click, wire:model)
* Whether the team has Dusk set up and running in CI

---

## Decision Tree

Does the behavior depend on JavaScript that isn't Livewire (Alpine.js, custom JS, third-party widgets)?
↓
YES → Use Dusk — Livewire::test() doesn't execute client-side JavaScript
NO → Does the behavior involve browser-level interactions (file upload dialog, scroll position, clipboard)?
    YES → Use Dusk — browser-level interactions need a real browser
    NO → Is the behavior purely Livewire-driven (wire:click, wire:model, $dispatch)?
        YES → Use `Livewire::test()` — faster, simpler, no browser needed
        NO → Use `Livewire::test()` — default for Livewire component testing

---

## Rationale

`Livewire::test()` runs the component server-side without a browser. It covers the full Livewire lifecycle but doesn't execute JavaScript. Dusk is needed for behaviors that depend on client-side JavaScript (Alpine.js, third-party libraries) or browser-level interactions (file dialog, scroll). For purely Livewire-driven behavior, `Livewire::test()` is faster and simpler.

---

## Recommended Default

**Default:** `Livewire::test()` for Livewire-driven behavior. Dusk only when client-side JavaScript or browser interactions need testing.
**Reason:** `Livewire::test()` is faster (no browser), integrates with PHPUnit/Pest, and covers the Livewire lifecycle completely. Dusk adds significant test execution time.

---

## Risks Of Wrong Choice

* `Livewire::test()` for Alpine-dependent behavior: Alpine's x-show not executed — test passes but component doesn't show in real browser
* Dusk for pure Livewire: Slow browser for a simple component test — unnecessary overhead
* No test for JavaScript-dependent behavior: Component works in Livewire test but not in browser — undetected bug
* Dusk without CI setup: Tests only run locally — regressions reach production

---

## Related Rules

* Livewire::test() for Livewire Behavior, Dusk for JS Behavior

---

## Related Skills

* Write Comprehensive Livewire Component Tests
