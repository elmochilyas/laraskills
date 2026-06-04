# Decomposition: Inertia Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Testing
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Server-Side Testing of Inertia Responses
- **Topics:** `assertInertia()`, asserting component name, asserting props
- **Key Content:** Testing controller returns correct Inertia response, prop shape assertions
- **Learning Objectives:** Write PHP tests that verify controllers return the correct Inertia page with expected props

### Chunk 2: Server-Side Shared Data Testing
- **Topics:** Asserting shared data is present, asserting shared data values
- **Key Content:** Testing `Inertia::share()` data, middleware-based shared data assertions
- **Learning Objectives:** Verify that shared data is correctly injected into Inertia responses

### Chunk 3: Client-Side Component Testing
- **Topics:** Vitest/Jest for page components, rendering with props, mocking Inertia helpers
- **Key Content:** Testing that page components render correctly with given props, interaction testing
- **Learning Objectives:** Write client-side tests that verify page component rendering and behavior with given props

### Chunk 4: End-to-End Flow Testing
- **Topics:** Full request → Inertia response → component render pipeline
- **Key Content:** Combining PHP tests (passing correct props) with JS tests (rendering with those props), Dusk/Laravel tests with Inertia
- **Learning Objectives:** Connect server-side assertion testing with client-side component testing for end-to-end verification
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization