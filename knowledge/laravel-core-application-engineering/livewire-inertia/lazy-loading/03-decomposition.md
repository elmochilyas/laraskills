# Decomposition: Livewire Lazy Loading

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Lazy Loading
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: #[Lazy] Attribute and Placeholder
- **Topics:** `#[Lazy]` attribute, placeholder HTML, Intersection Observer integration
- **Key Content:** How Livewire defers component initialization, placeholder rendering, viewport detection
- **Learning Objectives:** Use the `#[Lazy]` attribute to defer component initialization until visible

### Chunk 2: Lazy Loading Trigger Strategies
- **Topics:** Viewport visibility, scroll-based, manual trigger with `$refresh()`
- **Key Content:** When the component initializes (scroll near), manual lazy triggers, eager fallback
- **Learning Objectives:** Configure lazy loading triggers and understand scroll-based vs manual activation

### Chunk 3: Performance Impact
- **Topics:** Initial page load reduction, split network requests, measured improvement
- **Key Content:** Benchmarking before/after lazy loading, per-component performance analysis
- **Learning Objectives:** Measure and evaluate the performance impact of lazy loading on initial page load

### Chunk 4: Lazy Loading with Heavy Components
- **Topics:** Loading skeletons, deferred queries, data dependencies between lazy components
- **Key Content:** Designing placeholders for complex components, avoiding layout shift, coordinating dependent lazily-loaded components
- **Learning Objectives:** Implement effective loading skeletons and manage dependencies between multiple lazy-loaded components
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization