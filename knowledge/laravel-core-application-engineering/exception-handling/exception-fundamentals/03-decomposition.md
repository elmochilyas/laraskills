# Decomposition: Exception Fundamentals

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Fundamentals
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: The Handler Class Architecture
- **Topics:** `App\Exceptions\Handler`, registration, the two-phase flow (report → render)
- **Key Content:** Handler bootstrap, `register()` method vs `withExceptions()` (Laravel 11), exception pipeline
- **Learning Objectives:** Explain the role and lifecycle of the global exception Handler

### Chunk 2: Report Phase
- **Topics:** `report()` method, logging exceptions, conditional reporting, stopping propagation
- **Key Content:** `reportable()` callback, `stop()` method, `dontReport` configuration
- **Learning Objectives:** Configure which exceptions are reported and how reporting can be customized

### Chunk 3: Render Phase
- **Topics:** `render()` method, HTTP response generation, custom render callbacks
- **Key Content:** `renderable()` callback, returning custom responses, content negotiation (HTML vs JSON)
- **Learning Objectives:** Customize exception rendering to produce appropriate HTTP responses per exception type

### Chunk 4: Exception Context and Customization
- **Topics:** `context()` method, `dontFlash`, exception metadata
- **Key Content:** Adding global context to all exception reports, excluding sensitive request data
- **Learning Objectives:** Enrich exception reports with context data and protect sensitive information from exposure
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization