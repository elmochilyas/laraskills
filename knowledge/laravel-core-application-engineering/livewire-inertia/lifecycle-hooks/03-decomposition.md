# Decomposition: Livewire Lifecycle Hooks

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Lifecycle Hooks
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Initialization Hooks
- **Topics:** `mount()`, `boot()`, `booted()`
- **Key Content:** Component initialization order, parameter injection, database queries in `mount()`
- **Learning Objectives:** Use `mount()`, `boot()`, and `booted()` for component initialization with correct parameter handling

### Chunk 2: Property Update Hooks
- **Topics:** `updating()`, `updated()` — per-property and wildcard
- **Key Content:** Intercepting property changes, validation on update, computed properties
- **Learning Objectives:** Use `updating()`/`updated()` hooks to react to property changes and enforce invariants

### Chunk 3: Action Hooks
- **Topics:** `executeMethod()` hooks, before/after action interception
- **Key Content:** Pre-action validation, post-action cleanup, action logging
- **Learning Objectives:** Intercept action execution using lifecycle hooks for cross-cutting concerns

### Chunk 4: Rendering and Dehydration Hooks
- **Topics:** `rendering()`, `rendered()`, `dehydrate()`, `hydrate()`
- **Key Content:** Modifying view data before render, post-render cleanup, serialization control
- **Learning Objectives:** Use rendering and dehydration hooks to control component output and serialization behavior
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization