# Decomposition: Inertia Server Props

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Server Props
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: Passing Props from Controllers
- **Topics:** `Inertia::render()` with `['key' => 'value']`, prop types, arrays and objects
- **Key Content:** Simple vs nested props, Eloquent model serialization, pagination as props
- **Learning Objectives:** Pass typed props from Laravel controllers to Inertia page components

### Chunk 2: Deferred/Lazy Props
- **Topics:** Closures as props, deferred computation, partial reload triggering
- **Key Content:** Wrapping expensive computations in closures, lazy resolution on hydration
- **Learning Objectives:** Use closure-based props to defer expensive computations until the client requests them

### Chunk 3: Serialization and Transformation
- **Topics:** How props are serialized to JSON, resource classes, custom serialization
- **Key Content:** API Resource serialization, DTO to prop conversion, date/collection formatting
- **Learning Objectives:** Control prop serialization to ensure correct types and formats reach the client component

### Chunk 4: Prop Size and Performance
- **Topics:** Large prop payloads, serialization overhead, selective prop passing
- **Key Content:** Identifying oversized payloads, pagination for large datasets, selective inclusion
- **Learning Objectives:** Optimize prop payload size by identifying and addressing performance bottlenecks
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization