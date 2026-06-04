# Decomposition: Livewire Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Testing
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Basic Component Testing
- **Topics:** `Livewire::test()`, asserting component state, asserting rendered output
- **Key Content:** Creating a testable component, `assertSet()`, `assertSee()`, `assertOk()`
- **Learning Objectives:** Write basic Livewire component tests that verify initial state and rendered output

### Chunk 2: Action and Event Testing
- **Topics:** Calling component actions, asserting property changes, asserting dispatched events
- **Key Content:** `call('method')`, `assertDispatched()`, `assertNotDispatched()`, action parameters
- **Learning Objectives:** Test component actions for correct state mutations and event dispatching

### Chunk 3: Validation Testing
- **Topics:** Testing validation rules, asserting errors present/absent, validation state
- **Key Content:** `set('field', value)`, `assertHasErrors()`, `assertNoErrors()`, validation error messages
- **Learning Objectives:** Write tests that verify validation rules and error states in Livewire components

### Chunk 4: Dense Testing Scenarios
- **Topics:** Testing component lifecycle, loading states, file uploads, complex interactions
- **Key Content:** Testing conditional views, `assertDispatched('closeModal')`, `set('file', $upload)`
- **Learning Objectives:** Write tests covering advanced Livewire features including lifecycle, loading indicators, and file uploads
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization