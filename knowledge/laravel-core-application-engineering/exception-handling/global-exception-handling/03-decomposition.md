# Decomposition: Global Exception Handling

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Global Exception Handling
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Handler Registration and Bootstrapping
- **Topics:** How `Handler` is registered, `withExceptions()` API (Laravel 11), legacy `register()` method
- **Key Content:** Bootstrap flow, exception handling pipeline, Handler vs middleware exception handling
- **Learning Objectives:** Describe how Laravel registers and bootstraps the global exception handler

### Chunk 2: Reportable and Renderable Callbacks
- **Topics:** `reportable()` / `renderable()` callbacks, type-based dispatching, callback priorities
- **Key Content:** Registering handlers for specific exception types, ordering, stopping propagation
- **Learning Objectives:** Register reportable and renderable callbacks that handle specific exception types

### Chunk 3: Exception Classification Flow
- **Topics:** How Handler classifies exceptions (HTTP, validation, custom), rendering fallbacks
- **Key Content:** Exception type checks, content negotiation, default vs custom rendering
- **Learning Objectives:** Trace the full exception classification and rendering flow through the Handler

### Chunk 4: Ignition Integration (Laravel 10) and Laravel 11 Changes
- **Topics:** Ignition error page, `withExceptions()` API, solution providers, production vs debug mode
- **Key Content:** Ignition's role in development, Laravel 11's simplified exception handling, migration between versions
- **Learning Objectives:** Configure Ignition (Laravel 10) or `withExceptions()` (Laravel 11) for appropriate dev/production behavior
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization