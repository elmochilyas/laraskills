# Decomposition: Inertia SSR Configuration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia SSR Configuration
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: SSR Architecture Overview
- **Topics:** Node.js server pre-renders components, sends HTML + hydrates client-side
- **Key Content:** How Inertia SSR works (request → PHP → Node.js render → HTML response), server communication
- **Learning Objectives:** Explain Inertia SSR's architecture and how it integrates with the Laravel backend

### Chunk 2: Setting Up the SSR Server
- **Topics:** Package installation, `@inertiajs/server` configuration, Node/Bun runtime
- **Key Content:** Configuration, package.json scripts, SSR entry point, production daemon
- **Learning Objectives:** Set up and configure the Inertia SSR server with the appropriate Node.js runtime

### Chunk 3: SSR Performance and Caching
- **Topics:** SSR response time, caching strategies, TTFB optimization
- **Key Content:** SSR vs non-SSR performance benchmarks, HTTP caching, component-level cache
- **Learning Objectives:** Measure and optimize SSR performance including caching strategies for pre-rendered responses

### Chunk 4: SSR Caveats and Troubleshooting
- **Topics:** Window-dependent code, client-only hooks, hydration mismatches
- **Key Content:** Common SSR pitfalls (DOM access, third-party libs), hydration mismatch debugging, graceful fallbacks
- **Learning Objectives:** Identify and resolve common SSR issues including hydration mismatches and browser-only code
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization