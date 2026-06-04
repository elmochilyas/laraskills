# Decomposition: Inertia Partial Reloads

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Partial Reloads
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Reload Mechanism
- **Topics:** Client-initiated re-fetch of specific props, no full navigation
- **Key Content:** How partial reload works under the hood, re-executing route handler, returning only requested props
- **Learning Objectives:** Explain how Inertia partial reloads allow re-fetching specific props without a full page navigation

### Chunk 2: Server-Side Prop Filtering
- **Topics:** `$request->only()` on server, `$request->header('X-Inertia-Partial-Data')`, key-based selection
- **Key Content:** How the server determines which props to return, filtering logic, lazy prop evaluation
- **Learning Objectives:** Implement server-side prop filtering that returns only the requested subset of props

### Chunk 3: Client-Side Triggering
- **Topics:** `form.reload()` in React, `$inertia.reload()` in Vue, custom triggering
- **Key Content:** Reloading only specific props from client, combining with other Inertia features
- **Learning Objectives:** Trigger partial reloads from the client to refresh specific data without navigation

### Chunk 4: Use Cases and Tradeoffs
- **Topics:** Polling data, refreshing after external changes, partial form revalidation
- **Key Content:** Use cases (dashboard refresh, live data feeds), tradeoffs vs WebSockets vs full reload
- **Learning Objectives:** Evaluate when partial reloads are appropriate vs WebSockets, polling, or full page navigation
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization