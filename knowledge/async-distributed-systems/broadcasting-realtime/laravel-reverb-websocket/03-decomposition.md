# Decomposition: Laravel Reverb — WebSocket Server, FrankenPHP Engine

## Topic Overview

Laravel Reverb is a first-party WebSocket server powered by FrankenPHP — a PHP application server built on top of the Go-based Caddy web server. Unlike traditional PHP WebSocket solutions (which require separate Node.js/Go services), Reverb runs as a long-lived PHP process using FrankenPHP's ability to keep PHP in memory between requests.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k031-laravel-reverb-websocket/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Laravel Reverb — WebSocket Server, FrankenPHP Engine
- **Purpose:** Laravel Reverb is a first-party WebSocket server powered by FrankenPHP — a PHP application server built on top of the Go-based Caddy web server. Unlike traditional PHP WebSocket solutions (which require separate Node.js/Go services), Reverb runs as a long-lived PHP process using FrankenPHP's ability to keep PHP in memory between requests.
- **Difficulty:** Advanced
- **Dependencies:** - K030 Broadcasting System Overview (context)

## Dependency Graph

This KU depends on: - K030 Broadcasting System Overview (context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **FrankenPHP**: A PHP application server (Caddy + PHP worker mode). Maintains a persistent PHP process that handles multiple requests over its lifetime. - **Pusher protocol compatibility**: Reverb s...
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