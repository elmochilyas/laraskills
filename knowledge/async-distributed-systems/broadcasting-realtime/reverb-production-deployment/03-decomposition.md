# Decomposition: Reverb Production: SSL, Nginx, Open Files, Event Loop

## Topic Overview

Deploying Reverb to production requires specific infrastructure configuration beyond typical Laravel applications. Key concerns: SSL termination (WSS requires valid certificate), Nginx proxying (WebSocket upgrade headers, long timeouts), operating system limits (open file descriptors for WebSocket connections), event loop health (no blocking I/O in the Reverb process), and process management (Supervisor for auto-restart).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k034-reverb-production-deployment/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Reverb Production: SSL, Nginx, Open Files, Event Loop
- **Purpose:** Deploying Reverb to production requires specific infrastructure configuration beyond typical Laravel applications. Key concerns: SSL termination (WSS requires valid certificate), Nginx proxying (WebSocket upgrade headers, long timeouts), operating system limits (open file descriptors for WebSocket connections), event loop health (no blocking I/O in the Reverb process), and process management (Supervisor for auto-restart).
- **Difficulty:** Advanced
- **Dependencies:** - K031 Laravel Reverb (architecture)

## Dependency Graph

This KU depends on: - K031 Laravel Reverb (architecture)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **WSS**: WebSocket Secure — WebSocket over TLS. Required for secure connections from browsers. - **Nginx WebSocket proxy**: Nginx must forward `Upgrade` and `Connection` headers to the Reverb back...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization