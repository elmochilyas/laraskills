# Decomposition: Inertia Shared Data

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Shared Data
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Registering Shared Data
- **Topics:** `Inertia::share()`, `HandleInertiaRequests` middleware, shared data providers
- **Key Content:** Global shared data registration, middleware-based sharing, provider pattern
- **Learning Objectives:** Register shared data that is included in every Inertia page response

### Chunk 2: Common Shared Data Patterns
- **Topics:** Authenticated user, flash messages, app configuration, localization
- **Key Content:** Standard shared data that nearly all applications need, lazy evaluation for expensive props
- **Learning Objectives:** Implement shared data for authenticated user, flash messages, and app configuration

### Chunk 3: Lazy Shared Data
- **Topics:** Deferred computation of shared data, performance optimization, conditional sharing
- **Key Content:** Using closures in `share()` to defer computation, sharing based on route/auth conditions
- **Learning Objectives:** Use lazy evaluation for shared data to avoid computing expensive values on every request

### Chunk 4: Shared Data Merge Strategy
- **Topics:** How shared data merges with page props, override order, key collision handling
- **Key Content:** Merge depth, page-specific overrides, shared data conflicts
- **Learning Objectives:** Understand and manage the merge behavior between shared data and page-specific props
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization