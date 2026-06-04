# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Component Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Full-Page Component vs Nested Component (Island) Architecture
* Single Monolithic Component vs Multiple Small Components
* Livewire Component vs Blade + Alpine.js Hybrid

---

# Architecture-Level Decision Trees

---

## Decision 1: Full-Page Component vs Nested Component (Island) Architecture

---

## Decision Context

Whether to wrap the entire page in a single Livewire component (full-page) or embed Livewire components as islands within a standard Blade view.

---

## Decision Criteria

* Whether >50% of the page content is interactive (needs Livewire)
* Whether the page has mostly static content with a few interactive widgets
* Whether page-level state is needed across multiple sections
* Whether the initial page load should be fast (static content cached, Livewire components lazy)

---

## Decision Tree

Does the page have more interactive content than static content (>50% interactive)?
↓
YES → Full-page component — manage the entire page as a single Livewire component
NO → Does the page have mostly static content with 1-3 interactive widgets (comment section, search, filter)?
    YES → Islands pattern — embed individual Livewire components in a Blade view
    NO → Does the page need shared state across multiple interactive sections?
        YES → Full-page component — shared state is simpler in a single component
        NO → Islands pattern — each interactive section is an independent island

---

## Rationale

Full-page components serialize the entire page state on every AJAX request, including static content. For heavily interactive pages, this overhead is acceptable. For content pages with a few widgets, the Islands pattern keeps the initial render fast (pure Blade) and only hydrates the interactive sections.

---

## Recommended Default

**Default:** Full-page component for admin panels and highly interactive pages. Islands for content-heavy pages with a few interactive widgets.
**Reason:** The 50% interactive threshold identifies whether Livewire serialization overhead is justified. Islands provide better performance for content pages.

---

## Risks Of Wrong Choice

* Full-page for content page: Static blog content serialized on every comment submission — unnecessary overhead
* Islands for highly interactive page: Multiple independent components — harder to share state, more network requests
* Full-page with lazy loading: Component marked `#[Lazy]` but used as full-page — placeholder shows before content
* Islands with shared state needed: Components can't share state without events — complex communication

---

## Related Rules

* Choose Islands for Content Pages

---

## Related Skills

* Create a Well-Structured Livewire Component
* Implement the Islands Pattern for Content-Heavy Pages

---

---

## Decision 2: Single Monolithic Component vs Multiple Small Components

---

## Decision Context

Whether to build a page as one large Livewire component or split it into multiple smaller, focused components.

---

## Decision Criteria

* Lines of code in the component class (threshold: 150 lines)
* Lines of code in the Blade template (threshold: 200 lines)
* Number of distinct UI sections (form, table, sidebar, header)
* Whether sections are reusable across multiple pages

---

## Decision Tree

Does the component class exceed 150 lines or the template exceed 200 lines?
↓
YES → Split into smaller components — one component per distinct UI section
NO → Does the page have 3+ clearly distinct UI sections (form, table, stats)?
    YES → Split into smaller components — each section is independently testable
    NO → Is any section reusable across multiple pages (shared sidebar, common form)?
        YES → Extract to a separate component — reuse without duplication
        NO → Keep as a single component — small enough, no reason to split
NO → Is the component at risk of growing significantly in the next 3 months?
    YES → Proactively split — easier to split now than refactor a 300-line component later
    NO → Keep single — don't preemptively split

---

## Rationale

Component size is the primary indicator. A 200+ line component class with 300-line template mixes multiple concerns. Splitting at natural UI boundaries (form, table, widget) isolates each concern, improves testability, and enables reuse. The 150/200 line thresholds are the tipping point.

---

## Recommended Default

**Default:** One component per distinct UI section. Extract when class exceeds 150 lines or template exceeds 200 lines.
**Reason:** Size thresholds identify when a component has outgrown single responsibility. Extracting at natural UI boundaries produces focused, testable, reusable components.

---

## Risks Of Wrong Choice

* Monolithic at 500 lines: Mixes form logic, table logic, and event handling — impossible to test, hard to maintain
* Premature splitting: 5 components for a 50-line page — unnecessary overhead, harder to follow the flow
* No reuse extraction: Same search form component duplicated in 3 pages
* Splitting at wrong boundary: Components that should share state are split — complex event wiring

---

## Related Rules

* One Component Per Concern

---

## Related Skills

* Create a Well-Structured Livewire Component

---

---

## Decision 3: Livewire Component vs Blade + Alpine.js Hybrid

---

## Decision Context

Whether to use a Livewire component (server-driven) or a plain Blade view with Alpine.js for client-side interactivity.

---

## Decision Criteria

* Whether the interaction needs server-side logic (database, auth, validation)
* Whether the interaction is purely client-side (show/hide, toggle, animation)
* Whether the interaction needs real-time server feedback (search-as-you-type)
* Whether the team prefers PHP-based logic or JavaScript-based interactivity

---

## Decision Tree

Does the interaction need server-side logic (database query, authentication, email sending)?
↓
YES → Use Livewire component — server-side logic wrapped in a PHP component class
NO → Is the interaction purely client-side (toggle visibility, CSS animation, accordion)?
    YES → Use Blade + Alpine.js — lighter than Livewire for client-only interactions
    NO → Does the interaction need real-time server feedback as the user types (live search)?
        YES → Use Livewire component — `wire:model` with debounce provides server-driven real-time feedback
        NO → Does the interaction need to persist state across page reloads?
            YES → Use Livewire component — state persists through Livewire's serialization
            NO → Use Blade + Alpine.js — client-side state only

---

## Rationale

Livewire components are for interactions that need server-side processing — database queries, authentication, email, file storage. Alpine.js is for lightweight client-side interactions — toggles, dropdowns, accordions, animations. Using Livewire for client-only interactions adds unnecessary server round trips and serialization overhead.

---

## Recommended Default

**Default:** Livewire for server-dependent interactions. Alpine.js for client-only interactions. Both can coexist on the same page.
**Reason:** Livewire provides server-side power at the cost of round trips. Alpine.js provides lightweight client-side interaction without server overhead. Using each for its strength produces the best UX.

---

## Risks Of Wrong Choice

* Livewire for toggle: Server round trip to hide/show an element — unnecessary, Alpine does it instantly
* Alpine for form submission: No server-side validation — invalid data reaches server
* Both for same interaction: Double network requests — Livewire and Alpine both managing the same state
* No JavaScript at all: Transition/accordion animations in Livewire — slow, round trip for UI feedback

---

## Related Rules

* Livewire for Server Logic, Alpine for Client Logic

---

## Related Skills

* Create a Well-Structured Livewire Component
