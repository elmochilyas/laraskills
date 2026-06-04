# Decomposition: Livewire Data Binding

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Data Binding
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: wire:model Basics
- **Topics:** `wire:model` directive, bidirectional binding, property-to-input synchronization
- **Key Content:** How `wire:model` connects PHP properties to HTML inputs, debounce/lazy modifiers
- **Learning Objectives:** Use `wire:model` to bind form inputs to component properties

### Chunk 2: Data Binding Modifiers
- **Topics:** `wire:model.live`, `wire:model.blur`, `wire:model.debounce.500ms`
- **Key Content:** When each modifier is appropriate (real-time vs deferred), performance implications
- **Learning Objectives:** Select and apply the appropriate data binding modifier for different input types and UX requirements

### Chunk 3: Binding to Complex Types
- **Topics:** Binding to arrays, Eloquent models, nested properties
- **Key Content:** Array key binding, model property binding, validation of complex bound data
- **Learning Objectives:** Use `wire:model` to bind form inputs to arrays and model properties

### Chunk 4: Wire:model Under the Hood
- **Topics:** AJAX request flow, property hydration, security (CSRF, property whitelist)
- **Key Content:** What happens on input change (network request → property update → re-render), dirty property tracking
- **Learning Objectives:** Explain the request lifecycle behind `wire:model` and its security implications
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization