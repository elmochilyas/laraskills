# Decomposition: Livewire Islands Pattern

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Islands Pattern
- **Difficulty Level:** Expert

## Atomic Chunks

### Chunk 1: Islands vs Full-Page Components
- **Topics:** Blade page with embedded Livewire components vs Livewire-wrapped page
- **Key Content:** Conceptual difference, when each approach is appropriate, islands as progressive enhancement
- **Learning Objectives:** Distinguish the islands pattern from full-page Livewire components and select the appropriate approach

### Chunk 2: Isolated Component State Boundaries
- **Topics:** Each island has its own state, lifecycle, AJAX — no shared component state
- **Key Content:** Independent updates, avoiding cross-component coupling, page-level re-render avoidance
- **Learning Objectives:** Design self-contained Livewire components that operate independently within a static page

### Chunk 3: Communication Between Islands and Static Page
- **Topics:** Events bridging islands, page-level JavaScript interaction, DOM event coordination
- **Key Content:** Using browser events (CustomEvent) for page ↔ island and island ↔ island communication
- **Learning Objectives:** Implement communication patterns between islands and between islands and the surrounding static page

### Chunk 4: Performance and Bundle Optimization
- **Topics:** Selective hydration, multiple island instances, page weight optimization
- **Key Content:** Bundle size management for multiple islands, lazy loading individual islands, minimizing server requests
- **Learning Objectives:** Optimize pages with multiple islands for performance including hydration, bundle size, and server load
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization