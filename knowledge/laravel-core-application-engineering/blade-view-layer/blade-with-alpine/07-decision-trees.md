# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Blade with Alpine.js
**Generated:** 2026-06-03

---

# Decision Inventory

* Alpine.js vs Livewire for Client Interactivity
* Alpine.js vs Full JS Framework (React/Vue/Inertia)
* Alpine Component Scope: Single Large vs Multiple Small Components

---

# Architecture-Level Decision Trees

---

## Decision 1: Alpine.js vs Livewire for Client Interactivity

---

## Decision Context

Whether to use Alpine.js (client-only state) or Livewire (server-synced state) to add interactivity to a Blade template.

---

## Decision Criteria

* Whether the state must persist to the server
* Whether real-time server updates are needed
* Whether the interaction is UI-only (dropdown, modal, toggle) or data-driven

---

## Decision Tree

Does the interactive state need to persist to the server or reflect server-side changes?
↓
YES → Livewire (`wire:model`, `wire:click`) — state syncs between client and server automatically
NO → Is the interaction purely UI behavior (dropdown, modal, toggle, tab)?
    YES → Alpine.js (`x-data`, `x-show`, `@click`) — lightweight, no server round-trip
NO → Does the interaction involve fetching read-only server data (API call)?
    YES → Alpine.js with `fetch()` is acceptable for current-page read-only data
NO → Is the interaction complex enough to need rich client state management?
    YES → Full JS framework (React/Vue/Inertia) — Alpine is too limited
NO → Alpine.js is the default choice for simple UI interactivity on Blade pages

---

## Rationale

Alpine's `x-data` is purely client-side — it does not sync to the server. Livewire's `wire:model` does. Using Alpine for server-dependent state causes data loss on reload. Using Livewire for simple UI toggles adds unnecessary server round-trips.

---

## Recommended Default

**Default:** Alpine.js for UI interactivity (dropdowns, modals, toggles, client-side validation). Livewire for server-bound state (form submission, auth-dependent UI).
**Reason:** Alpine adds ~10KB and works without server round-trips. Livewire syncs server state but requires a full component lifecycle.

---

## Risks Of Wrong Choice

* Alpine for server state: Changes lost on reload; no persistence
* Livewire for UI toggles: Unnecessary server requests for every toggle, slower perceived performance
* Full framework for simple UI: 100KB+ bundle for a dropdown

---

## Related Rules

* Keep Alpine State Client-Only, Use Livewire for Server State (05-rules.md)
* Do Not Replace Blade Logic with Alpine (05-rules.md)

---

## Related Skills

* Skill: Integrate Alpine.js with Blade Templates for Client-Side Interactivity

---

## Decision 2: Alpine.js vs Full JS Framework (React/Vue/Inertia)

---

## Decision Context

Whether to augment a Blade template with Alpine.js or build a full single-page application with React, Vue, or Inertia.

---

## Decision Criteria

* Complexity of client-side state management
* Number of interactive elements per page
* SEO requirements for dynamic content
* Bundle size budget
* Team's JavaScript expertise

---

## Decision Tree

Does the page need complex client-side state management (Redux, Pinia, or equivalent)?
↓
YES → React or Vue (possibly via Inertia)
NO → Are there more than 20 interactive Alpine components on a single page?
    YES → Is each component simple (toggle, dropdown)?
        YES → Alpine is still acceptable (under 5ms init)
        NO → Consider Livewire or a full framework for complex interactivity
NO → Is SEO-critical content rendered dynamically?
    YES → Server-render with Blade/Inertia SSR; Alpine cannot SEO-render client content
NO → Does the team have strong JavaScript/SFC experience?
    YES → React/Vue/Inertia are viable options
    NO → Alpine (HTML-attribute-based) requires minimal JS knowledge
NO → Alpine.js is the default augmentation tool for server-rendered Laravel apps

---

## Rationale

Alpine is ~10KB compressed and requires no build step. React/Vue are ~100KB+ and require Vite/Webpack. For interactive UI on server-rendered pages, Alpine provides sufficient capability without the complexity of a full SPA framework.

---

## Recommended Default

**Default:** Alpine.js for interactive UI on server-rendered Blade pages; Inertia/React/Vue only for complex SPAs with rich client state
**Reason:** Alpine adds interactivity with 10KB and no build step. Full frameworks should be reserved for pages where Alpine's capabilities are insufficient.

---

## Risks Of Wrong Choice

* Full framework for simple UI: Heavy bundle, complex build pipeline, longer development time
* Alpine for complex SPA: Unmaintainable `x-data` with 30+ properties, no routing, no component composition

---

## Related Rules

* Keep Alpine Components Small and Focused (05-rules.md)

---

## Related Skills

* Skill: Integrate Alpine.js with Blade Templates for Client-Side Interactivity

---

## Decision 3: Alpine Component Scope — Single Large vs Multiple Small Components

---

## Decision Context

Whether to define one Alpine component with many properties or split into multiple focused components.

---

## Decision Criteria

* Number of properties needed
* Whether state is independent or shared between elements
* Whether elements need to communicate

---

## Decision Tree

How many state properties are needed?
↓
5-8 or fewer → Single component is fine — keep all state in one `x-data` block
9-15 properties → Can the state be split by UI concern?
    YES → Split into separate components:
        Dropdown component: `{ open: false }`
        Search component: `{ query: '', results: [] }`
        Form component: `{ email: '', errors: {} }`
    NO → Consider if a single component with 9-15 properties is justified (complex form/widget)
15+ properties → Split required — component has too many concerns
NO → Do elements need to share state (selected item in one affects display in another)?
    YES → Use Alpine.store() or $dispatch for cross-component communication
    NO → Split into independent components with separate x-data

---

## Rationale

Large `x-data` objects with 15+ properties indicate a component handles too many concerns. Small components are easier to reason about, reuse, and debug. Cross-component communication via `$dispatch` and `$store` provides clean patterns without coupling.

---

## Recommended Default

**Default:** Split into multiple small components (5-8 properties max) with independent `x-data` blocks
**Reason:** Small components are easier to maintain, test, and reuse. Split by UI concern — each interactive element gets its own component.

---

## Risks Of Wrong Choice

* Single large component: Hard to reason about, brittle, high initialization cost
* Too many tiny components: Excessive `x-data` blocks add initialization overhead (under 20 is fine)
* Components split by unrelated concerns: Confusing state boundaries, unnecessary `$dispatch` complexity

---

## Related Rules

* Keep Alpine Components Small and Focused (05-rules.md)
* Add `@click.away` to Every Dropdown and Overlay (05-rules.md)

---

## Related Skills

* Skill: Integrate Alpine.js with Blade Templates for Client-Side Interactivity
